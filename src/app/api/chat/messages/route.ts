import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ChatMessage from "@/lib/models/ChatMessage";
import { encryptMessage, decryptMessage } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const rawRecipientId = searchParams.get("recipientId");
    const shouldMarkRead = searchParams.get("markRead") !== "false";
    const now = new Date();

    let query: any = {};

    if (rawRecipientId && rawRecipientId.trim()) {
      let targetRecipientId = rawRecipientId.trim();
      let targetRecipientEmail = "";

      if (targetRecipientId.includes("@")) {
        targetRecipientEmail = targetRecipientId.toLowerCase();
        const targetUser = await User.findOne({ email: targetRecipientEmail });
        if (targetUser) {
          targetRecipientId = targetUser._id.toString();
        }
      } else {
        const targetUser = await User.findById(targetRecipientId);
        if (targetUser) {
          targetRecipientEmail = targetUser.email.toLowerCase();
        }
      }

      const targetRoomId = [currentUserId, targetRecipientId].sort().join(":");

      query = {
        $and: [
          {
            $or: [
              { roomId: targetRoomId },
              { participants: { $all: [currentUserId, targetRecipientId] } },
              { $and: [{ senderId: currentUserId }, { recipientId: targetRecipientId }] },
              { $and: [{ senderId: targetRecipientId }, { recipientId: currentUserId }] },
              ...(targetRecipientEmail ? [
                { participants: { $all: [currentUserEmail, targetRecipientEmail] } },
                { $and: [{ senderId: currentUserId }, { recipientId: targetRecipientEmail }] },
                { $and: [{ senderId: targetRecipientId }, { recipientId: currentUserEmail }] },
              ] : [])
            ],
          },
          {
            $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
          },
        ],
      };
    } else {
      query = {
        $and: [
          {
            $or: [
              { participants: currentUserId },
              { participants: currentUserEmail },
              { senderId: currentUserId },
              { recipientId: currentUserId },
            ],
          },
          {
            $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
          },
        ],
      };
    }

    const messages: any[] = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages directed to current user as read
    if (shouldMarkRead && messages.length > 0) {
      await ChatMessage.updateMany(
        {
          ...query,
          $or: [
            { recipientId: currentUserId },
            { recipientId: currentUserEmail },
          ],
          isRead: false,
        },
        { $set: { isRead: true } }
      );
    }

    // Decrypt messages
    const decryptedList = messages.map((msg: any) => {
      if (msg.isDeleted) {
        return {
          _id: msg._id ? msg._id.toString() : "",
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          sender: msg.sender,
          text: "This message was deleted",
          replyTo: null,
          isRead: msg.isRead,
          isEdited: false,
          isDeleted: true,
          retentionHours: msg.retentionHours || 24,
          createdAt: msg.createdAt,
        };
      }

      const plainText = decryptMessage({
        content: msg.content,
        iv: msg.iv,
        authTag: msg.authTag,
      });

      return {
        _id: msg._id ? msg._id.toString() : "",
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        sender: msg.sender,
        text: plainText,
        replyTo: msg.replyTo || null,
        isRead: msg.isRead,
        isEdited: msg.isEdited || false,
        isDeleted: false,
        retentionHours: msg.retentionHours || 24,
        createdAt: msg.createdAt,
      };
    });

    return NextResponse.json(decryptedList);
  } catch (error: any) {
    console.error("GET Chat Messages Error:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const { sender, recipientId, text, replyTo, retentionHours = 24 } = await req.json();

    if (!recipientId || !recipientId.trim()) {
      return NextResponse.json({ error: "Recipient is required for private 1-on-1 messaging" }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    let targetRecipientId = recipientId.trim();
    if (targetRecipientId.includes("@")) {
      const targetUser = await User.findOne({ email: targetRecipientId.toLowerCase() });
      if (targetUser) {
        targetRecipientId = targetUser._id.toString();
      }
    }

    // Derive deterministic 1-on-1 roomId
    const roomId = [currentUserId, targetRecipientId].sort().join(":");
    const participants = [currentUserId, targetRecipientId, currentUserEmail];

    // Encrypt the message text with AES-256-GCM
    const encrypted = encryptMessage(text.trim());

    // Calculate expiration date
    const hours = retentionHours === 12 ? 12 : 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const displayName = sender && sender.trim() ? sender.trim() : session.user.name || currentUserEmail.split("@")[0] || "User";

    const newMsg = await ChatMessage.create({
      senderId: currentUserId,
      recipientId: targetRecipientId,
      roomId,
      participants,
      sender: displayName,
      content: encrypted.content,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      replyTo: replyTo ? {
        id: replyTo.id,
        sender: replyTo.sender,
        text: replyTo.text,
      } : null,
      retentionHours: hours,
      expiresAt,
      isRead: false,
      isEdited: false,
      isDeleted: false,
    });

    return NextResponse.json({
      _id: newMsg._id.toString(),
      senderId: newMsg.senderId,
      recipientId: newMsg.recipientId,
      sender: newMsg.sender,
      text: text.trim(),
      replyTo: newMsg.replyTo || null,
      isRead: false,
      isEdited: false,
      isDeleted: false,
      retentionHours: newMsg.retentionHours,
      createdAt: newMsg.createdAt,
    });
  } catch (error: any) {
    console.error("POST Chat Message Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);

    const { id, text } = await req.json();

    if (!id || !text || !text.trim()) {
      return NextResponse.json({ error: "Message ID and text are required" }, { status: 400 });
    }

    // Verify current user is the sender
    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.senderId !== currentUserId && existing.senderId !== session.user.email) {
      return NextResponse.json({ error: "You can only edit messages you sent" }, { status: 403 });
    }

    // Encrypt updated text
    const encrypted = encryptMessage(text.trim());

    existing.content = encrypted.content;
    existing.iv = encrypted.iv;
    existing.authTag = encrypted.authTag;
    existing.isEdited = true;
    await existing.save();

    return NextResponse.json({
      _id: existing._id.toString(),
      senderId: existing.senderId,
      recipientId: existing.recipientId,
      sender: existing.sender,
      text: text.trim(),
      replyTo: existing.replyTo || null,
      isRead: existing.isRead,
      isEdited: true,
      isDeleted: existing.isDeleted || false,
      retentionHours: existing.retentionHours,
      createdAt: existing.createdAt,
    });
  } catch (error: any) {
    console.error("PUT Chat Message Error:", error);
    return NextResponse.json({ error: "Failed to update message" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const recipientId = searchParams.get("recipientId");
    const id = searchParams.get("id");

    // Clear whole 1-on-1 room conversation
    if (clearAll) {
      let filter: any = {};
      if (recipientId && recipientId.trim()) {
        const targetRecipientId = recipientId.trim();
        const targetRoomId = [currentUserId, targetRecipientId].sort().join(":");
        filter = {
          $or: [
            { roomId: targetRoomId },
            { participants: { $all: [currentUserId, targetRecipientId] } },
          ],
        };
      } else {
        filter = {
          $or: [{ participants: currentUserId }, { participants: session.user.email }],
        };
      }

      await ChatMessage.deleteMany(filter);
      return NextResponse.json({ success: true, message: "1-on-1 conversation history wiped" });
    }

    if (!id) {
      return NextResponse.json({ error: "Message ID or clearAll=true is required" }, { status: 400 });
    }

    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user is in participants
    if (!existing.participants.includes(currentUserId) && !existing.participants.includes(session.user.email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Wipe sensitive payload and mark as deleted
    existing.content = "";
    existing.iv = "";
    existing.authTag = "";
    existing.replyTo = null;
    existing.isDeleted = true;
    await existing.save();

    return NextResponse.json({ success: true, message: "Message marked as deleted" });
  } catch (error: any) {
    console.error("DELETE Chat Message Error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
