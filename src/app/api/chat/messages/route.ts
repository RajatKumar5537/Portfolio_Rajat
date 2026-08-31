import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import ChatMessage from "@/lib/models/ChatMessage";
import { encryptMessage, decryptMessage } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const { searchParams } = new URL(req.url);
    const recipientId = searchParams.get("recipientId");
    const shouldMarkRead = searchParams.get("markRead") !== "false";

    await dbConnect();
    const now = new Date();

    let query: any = {
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    };

    if (recipientId && recipientId.trim()) {
      // Strict 1-on-1 private room query
      const targetRoomId = [currentUserId, recipientId.trim()].sort().join(":");
      query.roomId = targetRoomId;
    } else {
      // Return messages where current user is a participant
      query.participants = currentUserId;
    }

    const messages = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages directed to current user as read
    if (shouldMarkRead && messages.length > 0) {
      await ChatMessage.updateMany(
        {
          ...query,
          recipientId: currentUserId,
          isRead: false,
        },
        { $set: { isRead: true } }
      );
    }

    // Decrypt messages
    const decryptedList = messages.map((msg: any) => {
      if (msg.isDeleted) {
        return {
          _id: msg._id.toString(),
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
        _id: msg._id.toString(),
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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const { sender, recipientId, text, replyTo, retentionHours = 24 } = await req.json();

    if (!recipientId || !recipientId.trim()) {
      return NextResponse.json({ error: "Recipient is required for private 1-on-1 messaging" }, { status: 400 });
    }

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Message text is required" }, { status: 400 });
    }

    await dbConnect();

    // Derive deterministic 1-on-1 roomId
    const targetRecipientId = recipientId.trim();
    const roomId = [currentUserId, targetRecipientId].sort().join(":");
    const participants = [currentUserId, targetRecipientId];

    // Encrypt the message text with AES-256-GCM
    const encrypted = encryptMessage(text.trim());

    // Calculate expiration date
    const hours = retentionHours === 12 ? 12 : 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const displayName = sender && sender.trim() ? sender.trim() : session.user.name || session.user.email?.split("@")[0] || "User";

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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const { id, text } = await req.json();

    if (!id || !text || !text.trim()) {
      return NextResponse.json({ error: "Message ID and text are required" }, { status: 400 });
    }

    await dbConnect();

    // Verify current user is the sender
    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.senderId !== currentUserId) {
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
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const recipientId = searchParams.get("recipientId");
    const id = searchParams.get("id");

    await dbConnect();

    // Clear whole 1-on-1 room conversation
    if (clearAll) {
      let filter: any = {};
      if (recipientId && recipientId.trim()) {
        filter.roomId = [currentUserId, recipientId.trim()].sort().join(":");
      } else {
        filter.participants = currentUserId;
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
    if (!existing.participants.includes(currentUserId)) {
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
