import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { encryptMessage, decryptMessage, encryptField, decryptField } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let currentUserId = (session.user as any).id;
    if (!currentUserId) {
      const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      currentUserId = currentUser._id.toString();
    }

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const conversationId = searchParams.get("conversationId");
    const queryTerm = searchParams.get("q")?.toLowerCase().trim();

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    // Verify user is in this conversation
    const conversation = await Conversation.findById(conversationId).select("participants").lean();
    if (!conversation || !conversation.participants?.includes(currentUserId)) {
      return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 403 });
    }

    // Ultra-fast index query using { conversationId: 1, createdAt: 1 }
    const messages = await Message.find({
      conversationId,
      clearedFor: { $ne: currentUserId },
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read when incoming unread messages exist
    const hasUnread = messages.some(
      (m: any) => m.senderId !== currentUserId && (!m.readBy || !m.readBy.some((r: any) => r.userId === currentUserId))
    );

    if (hasUnread) {
      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: currentUserId },
          "readBy.userId": { $ne: currentUserId },
        },
        {
          $addToSet: {
            readBy: {
              userId: currentUserId,
              userName: session.user?.name || "Recipient",
              readAt: new Date(),
            },
          },
        }
      ).catch(() => {});
    }

    // Decrypt messages with lightweight on-demand media streaming
    const formatted = messages.map((msg: any) => {
      let plainText = "";
      if (msg.isDeleted) {
        plainText = "This message was deleted";
      } else {
        plainText = decryptMessage({
          content: msg.content,
          iv: msg.iv,
          authTag: msg.authTag,
        });
      }

      // If message has mediaData, point to on-demand cached media streaming endpoint
      // to keep polling payload ultra-lightweight (<10KB instead of 20MB)
      const mediaUrl = msg.mediaData ? `/api/chat/messages/media?id=${msg._id}` : null;

      return {
        _id: msg._id.toString(),
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderAvatar: msg.senderAvatar,
        isMe: msg.senderId === currentUserId,
        text: plainText,
        effect: msg.effect || null,
        mediaType: msg.mediaType || null,
        mediaData: mediaUrl,
        mediaName: msg.mediaName || null,
        mediaSize: msg.mediaSize || null,
        audioDuration: msg.audioDuration || 0,
        reactions: msg.reactions || [],
        replyTo: msg.replyTo
          ? {
              ...msg.replyTo,
              text: msg.replyTo.text ? decryptField(msg.replyTo.text) : null,
            }
          : null,
        readBy: msg.readBy || [],
        isRead: (msg.readBy || []).length > 0,
        isEdited: Boolean(msg.isEdited),
        isDeleted: Boolean(msg.isDeleted),
        isPinned: Boolean(msg.isPinned),
        createdAt: msg.createdAt,
      };
    });

    // Filter by query term if search active
    if (queryTerm) {
      return NextResponse.json(
        formatted.filter((m) => m.text.toLowerCase().includes(queryTerm))
      );
    }

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUserId = currentUser._id.toString();

    const {
      conversationId,
      text,
      effect,
      mediaType,
      mediaData,
      mediaName,
      mediaSize,
      audioDuration,
      replyTo,
    } = await req.json();

    if (!conversationId || (!text?.trim() && !mediaData)) {
      return NextResponse.json({ error: "Conversation ID and message content or media are required" }, { status: 400 });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 403 });
    }

    // Encrypt message content with AES-256-GCM
    const rawText = (text || "").trim();
    const encrypted = encryptMessage(rawText);

    // Calculate disappearing TTL if enabled
    let expiresAt: Date | null = null;
    if (conversation.disappearingHours && conversation.disappearingHours > 0) {
      expiresAt = new Date(Date.now() + conversation.disappearingHours * 60 * 60 * 1000);
    }

    // Automatic keyword effect triggers if none provided
    let resolvedEffect = effect || null;
    if (!resolvedEffect && rawText) {
      const lower = rawText.toLowerCase().trim();
      if (lower.includes("happy new year") || lower.includes("congratulations") || lower.includes("congrats") || lower.includes("fireworks")) {
        resolvedEffect = "fireworks";
      } else if (lower.includes("happy birthday") || lower.includes("hbd") || lower.includes("birthday")) {
        resolvedEffect = "balloons";
      } else if (lower.includes("celebrate") || lower.includes("party") || lower.includes("woohoo") || lower.includes("confetti")) {
        resolvedEffect = "confetti";
      } else if (lower.includes("i love you") || lower.includes("love you") || lower.includes("i love u") || lower.includes("love u") || lower === "❤️" || lower === "💕" || lower.includes("tingu")) {
        resolvedEffect = "love";
      } else if (
        lower.includes("good morning") ||
        lower.includes("goodmorning") ||
        lower.includes("rise and shine") ||
        lower.includes("shubh prabhat") ||
        lower.includes("subh prabhat") ||
        lower === "gm" ||
        lower === "morning" ||
        lower === "morning!" ||
        lower.startsWith("gm ") ||
        lower.endsWith(" gm")
      ) {
        resolvedEffect = "good_morning";
      } else if (
        lower.includes("good night") ||
        lower.includes("goodnight") ||
        lower.includes("sweet dreams") ||
        lower.includes("nighty night") ||
        lower.includes("shubh ratri") ||
        lower.includes("subh ratri") ||
        lower === "gn" ||
        lower === "night" ||
        lower === "night!" ||
        lower.startsWith("gn ") ||
        lower.endsWith(" gn")
      ) {
        resolvedEffect = "good_night";
      }
    }

    const newMessage = await Message.create({
      conversationId,
      senderId: currentUserId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar || "",
      content: encrypted.content,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      effect: resolvedEffect,
      mediaType: mediaType || null,
      mediaData: mediaData ? encryptField(mediaData) : null,
      mediaName: mediaName || null,
      mediaSize: mediaSize || null,
      audioDuration: audioDuration || 0,
      replyTo: replyTo
        ? {
            ...replyTo,
            text: replyTo.text ? encryptField(replyTo.text) : null,
          }
        : null,
      reactions: [],
      readBy: [],
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      expiresAt,
    });

    // Update conversation lastMessage (stored encrypted in DB)
    let previewText = rawText;
    if (!previewText && mediaType) {
      previewText = `[${mediaType.toUpperCase()}] ${mediaName || ""}`;
    }
    conversation.lastMessage = {
      text: encryptField(previewText),
      senderId: currentUserId,
      senderName: currentUser.name,
      createdAt: new Date(),
      mediaType: mediaType || null,
      effect: resolvedEffect,
    };
    conversation.clearedFor = [];
    await conversation.save();

    return NextResponse.json(
      {
        _id: newMessage._id.toString(),
        conversationId,
        senderId: currentUserId,
        senderName: currentUser.name,
        senderAvatar: currentUser.avatar || "",
        isMe: true,
        text: rawText,
        effect: resolvedEffect,
        mediaType: mediaType || null,
        mediaData: mediaData || null,
        mediaName: mediaName || null,
        mediaSize: mediaSize || null,
        audioDuration: audioDuration || 0,
        reactions: [],
        replyTo: replyTo || null,
        readBy: [],
        isRead: false,
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        createdAt: newMessage.createdAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUserId = currentUser._id.toString();

    const { messageId, text, isPinned } = await req.json();

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (isPinned !== undefined) {
      message.isPinned = Boolean(isPinned);
      await message.save();
      return NextResponse.json({ success: true, isPinned: message.isPinned });
    }

    if (message.senderId !== currentUserId) {
      return NextResponse.json({ error: "You can only edit your own messages" }, { status: 403 });
    }

    const rawText = (text || "").trim();
    if (!rawText) {
      return NextResponse.json({ error: "Text cannot be empty" }, { status: 400 });
    }

    const encrypted = encryptMessage(rawText);
    message.content = encrypted.content;
    message.iv = encrypted.iv;
    message.authTag = encrypted.authTag;
    message.isEdited = true;
    await message.save();

    return NextResponse.json({
      _id: message._id.toString(),
      text: rawText,
      isEdited: true,
    });
  } catch (error: any) {
    console.error("PUT Message Error:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUserId = currentUser._id.toString();

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");
    const conversationId = searchParams.get("conversationId");
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll && conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $addToSet: { clearedFor: currentUserId },
      });
      await Message.updateMany(
        { conversationId },
        { $addToSet: { clearedFor: currentUserId } }
      );
      return NextResponse.json({ success: true, message: "Chat cleared for your account" });
    }

    if (!messageId) {
      return NextResponse.json({ error: "messageId is required" }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (message.senderId !== currentUserId) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }

    message.content = "";
    message.iv = "";
    message.authTag = "";
    message.mediaData = null;
    message.isDeleted = true;
    await message.save();

    return NextResponse.json({ success: true, message: "Message deleted for everyone" });
  } catch (error: any) {
    console.error("DELETE Message Error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
