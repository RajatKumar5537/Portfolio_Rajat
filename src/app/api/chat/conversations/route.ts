import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { decryptField, encryptField, decryptMessage } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Fetch conversations where user is a participant
    const conversations = await Conversation.find({
      participants: currentUserId,
      clearedFor: { $ne: currentUserId },
    })
      .sort({ updatedAt: -1 })
      .lean();

    if (conversations.length === 0) {
      return NextResponse.json([]);
    }

    const conversationIds = conversations.map((c) => c._id.toString());

    // Batch 1: Collect participant details in 1 indexed query
    const allParticipantIds = Array.from(
      new Set(conversations.flatMap((c) => c.participants || []))
    );
    const users = await User.find({ _id: { $in: allParticipantIds } })
      .select("name email avatar isOnline lastSeen statusMessage")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Batch 2: Single aggregation for unread message counts across ALL conversations
    const unreadAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          senderId: { $ne: currentUserId },
          "readBy.userId": { $ne: currentUserId },
          clearedFor: { $ne: currentUserId },
          isDeleted: false,
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
        },
      },
    ]);
    const unreadMap = new Map(unreadAgg.map((item: any) => [item._id, item.count]));

    // Batch 3: Single aggregation for the latest message across ALL conversations
    const latestMessagesAgg = await Message.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          clearedFor: { $ne: currentUserId },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$conversationId",
          lastMsg: { $first: "$$ROOT" },
        },
      },
    ]);
    const latestMsgMap = new Map(latestMessagesAgg.map((item: any) => [item._id, item.lastMsg]));

    // Assemble detailed conversations purely in-memory
    const detailedConversations = conversations.map((conv: any) => {
      const convId = conv._id.toString();
      const otherParticipantIds = (conv.participants || []).filter((id: string) => id !== currentUserId);
      const otherUsers = otherParticipantIds.map((id: string) => userMap.get(id)).filter(Boolean);
      const unreadCount = unreadMap.get(convId) || 0;

      // Determine title, avatar & presence
      let displayName = conv.name;
      let displayAvatar = conv.icon;
      let displayOnline = false;
      let displayLastSeen: any = null;

      if (conv.type === "direct") {
        const peer = otherUsers[0];
        displayName = peer ? peer.name : "Contact";
        displayAvatar = peer ? peer.avatar : "";
        displayLastSeen = peer?.lastSeen || null;
        if (peer?.isOnline && peer?.lastSeen) {
          const diff = Date.now() - new Date(peer.lastSeen).getTime();
          displayOnline = diff < 35000;
        } else {
          displayOnline = Boolean(peer?.isOnline);
        }
      }

      const lastMsg = latestMsgMap.get(convId);
      let lastMessageData: any = null;

      if (lastMsg) {
        let plainText = "";
        if (lastMsg.isDeleted) {
          plainText = "This message was deleted";
        } else if (lastMsg.mediaType && !lastMsg.content) {
          plainText = `[${lastMsg.mediaType.toUpperCase()}] ${lastMsg.mediaName || ""}`;
        } else {
          try {
            plainText = decryptMessage({
              content: lastMsg.content,
              iv: lastMsg.iv,
              authTag: lastMsg.authTag,
            });
          } catch {
            plainText = lastMsg.content || "";
          }
        }

        const isMe = lastMsg.senderId === currentUserId;
        const isRead = (lastMsg.readBy || []).length > 0;
        const readAt = lastMsg.readBy?.[0]?.readAt || null;

        lastMessageData = {
          text: plainText,
          senderId: lastMsg.senderId,
          senderName: lastMsg.senderName,
          isMe,
          isRead,
          readAt,
          createdAt: lastMsg.createdAt,
          mediaType: lastMsg.mediaType || null,
          effect: lastMsg.effect || null,
        };
      } else if (conv.lastMessage?.text) {
        lastMessageData = {
          ...conv.lastMessage,
          text: decryptField(conv.lastMessage.text),
          isMe: conv.lastMessage.senderId === currentUserId,
          isRead: false,
        };
      }

      return {
        _id: convId,
        type: conv.type,
        name: displayName,
        icon: displayAvatar,
        participants: conv.participants,
        participantDetails: (conv.participants || []).map((id: string) => userMap.get(id)).filter(Boolean),
        admins: conv.admins || [],
        isPinned: (conv.isPinnedBy || []).includes(currentUserId),
        disappearingHours: conv.disappearingHours || 0,
        lastMessage: lastMessageData,
        unreadCount,
        isOnline: displayOnline,
        lastSeen: displayLastSeen,
        updatedAt: conv.updatedAt,
      };
    });

    return NextResponse.json(detailedConversations);
  } catch (error: any) {
    console.error("GET Conversations Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
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

    const { type, recipientId, recipientEmail, name, participantIds } = await req.json();

    if (type === "group") {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Group name is required" }, { status: 400 });
      }
      const members = Array.from(new Set([currentUserId, ...(participantIds || [])]));
      if (members.length < 2) {
        return NextResponse.json({ error: "A group must have at least 2 members" }, { status: 400 });
      }

      const newGroup = await Conversation.create({
        type: "group",
        name: name.trim(),
        icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name.trim())}`,
        participants: members,
        admins: [currentUserId],
        createdBy: currentUserId,
        lastMessage: {
          text: encryptField(`Group "${name.trim()}" created`),
          senderId: currentUserId,
          senderName: currentUser.name,
          createdAt: new Date(),
        },
      });

      return NextResponse.json(newGroup, { status: 201 });
    }

    // Direct conversation
    let targetRecipientId = recipientId;
    if (!targetRecipientId && recipientEmail) {
      const peerUser = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
      if (peerUser) targetRecipientId = peerUser._id.toString();
    }

    if (!targetRecipientId) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    const peer = await User.findById(targetRecipientId).select("name email avatar isOnline lastSeen statusMessage").lean();

    // Check if direct conversation already exists
    let existingConv = await Conversation.findOne({
      type: "direct",
      participants: { $all: [currentUserId, targetRecipientId], $size: 2 },
    });

    if (existingConv) {
      // If user had cleared/deleted the conversation, un-clear it so it re-appears in chat list!
      if (existingConv.clearedFor && existingConv.clearedFor.length > 0) {
        await Conversation.findByIdAndUpdate(existingConv._id, {
          $pull: { clearedFor: currentUserId },
        });
      }

      return NextResponse.json({
        _id: existingConv._id.toString(),
        type: "direct",
        name: peer ? peer.name : "Contact",
        icon: peer ? peer.avatar : "",
        participants: existingConv.participants,
        participantDetails: [currentUser, peer].filter(Boolean),
        admins: existingConv.admins || [],
        isPinned: (existingConv.isPinnedBy || []).includes(currentUserId),
        disappearingHours: existingConv.disappearingHours || 0,
        lastMessage: existingConv.lastMessage
          ? {
              ...existingConv.lastMessage,
              text: decryptField(existingConv.lastMessage.text),
            }
          : null,
        unreadCount: 0,
        isOnline: peer ? Boolean(peer.isOnline) : false,
        updatedAt: existingConv.updatedAt,
      });
    }

    const newConv = await Conversation.create({
      type: "direct",
      participants: [currentUserId, targetRecipientId],
      lastMessage: {
        text: encryptField("Started a conversation"),
        senderId: currentUserId,
        senderName: currentUser.name,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        _id: newConv._id.toString(),
        type: "direct",
        name: peer ? peer.name : "Contact",
        icon: peer ? peer.avatar : "",
        participants: newConv.participants,
        participantDetails: [currentUser, peer].filter(Boolean),
        admins: [],
        isPinned: false,
        disappearingHours: 0,
        lastMessage: {
          text: "Started a conversation",
          senderId: currentUserId,
          senderName: currentUser.name,
          createdAt: new Date(),
        },
        unreadCount: 0,
        isOnline: peer ? Boolean(peer.isOnline) : false,
        updatedAt: newConv.updatedAt,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST Conversation Error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
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

    const { conversationId, disappearingHours, isPinned } = await req.json();
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId,
    });

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found or unauthorized" }, { status: 404 });
    }

    if (disappearingHours !== undefined) {
      conversation.disappearingHours = Number(disappearingHours);
    }

    if (isPinned !== undefined) {
      if (isPinned) {
        if (!conversation.isPinnedBy) conversation.isPinnedBy = [];
        if (!conversation.isPinnedBy.includes(currentUserId)) {
          conversation.isPinnedBy.push(currentUserId);
        }
      } else if (conversation.isPinnedBy) {
        conversation.isPinnedBy = conversation.isPinnedBy.filter((id: string) => id !== currentUserId);
      }
    }

    await conversation.save();

    return NextResponse.json({
      success: true,
      conversationId: conversation._id.toString(),
      disappearingHours: conversation.disappearingHours,
    });
  } catch (error: any) {
    console.error("PATCH Conversation Error:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

