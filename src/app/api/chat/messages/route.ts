import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import mongoose, { isValidObjectId } from "mongoose";
import User from "@/lib/models/User";
import ChatMessage from "@/lib/models/ChatMessage";
import ChatConnection from "@/lib/models/ChatConnection";
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
    const rawRecipientId = searchParams.get("recipientId")?.trim() || "";
    const rawRoomId = searchParams.get("roomId")?.trim() || "";
    const rawConnectionId = searchParams.get("connectionId")?.trim() || "";
    const shouldMarkRead = searchParams.get("markRead") !== "false";
    const now = new Date();

    let targetConnection: any = null;

    if (rawConnectionId && isValidObjectId(rawConnectionId)) {
      targetConnection = await ChatConnection.findById(rawConnectionId);
    }

    if (!targetConnection && rawRoomId) {
      targetConnection = await ChatConnection.findOne({ roomId: rawRoomId });
    }

    if (!targetConnection && rawRecipientId) {
      let targetRecipientId = rawRecipientId;
      let targetRecipientEmail = "";

      if (rawRecipientId.includes("@")) {
        targetRecipientEmail = rawRecipientId.toLowerCase();
        const targetUser = await User.findOne({ email: targetRecipientEmail });
        if (targetUser) targetRecipientId = targetUser._id.toString();
      } else if (isValidObjectId(rawRecipientId)) {
        const targetUser = await User.findById(rawRecipientId);
        if (targetUser) targetRecipientEmail = targetUser.email.toLowerCase();
      }

      targetConnection = await ChatConnection.findOne({
        $or: [
          { roomId: [currentUserId, targetRecipientId].sort().join(":") },
          { roomId: [currentUserId, targetRecipientId].sort().join("_") },
          { $and: [{ requesterId: currentUserId }, { recipientId: targetRecipientId }] },
          { $and: [{ requesterId: targetRecipientId }, { recipientId: currentUserId }] },
          ...(targetRecipientEmail ? [
            { $and: [{ requesterEmail: currentUserEmail }, { recipientEmail: targetRecipientEmail }] },
            { $and: [{ requesterEmail: targetRecipientEmail }, { recipientEmail: currentUserEmail }] },
            { $and: [{ requesterId: currentUserId }, { recipientEmail: targetRecipientEmail }] },
            { $and: [{ requesterId: targetRecipientId }, { recipientEmail: currentUserEmail }] },
          ] : []),
        ],
      });
    }

    if (!targetConnection) {
      return NextResponse.json([]);
    }

    // Verify current user is a party to this connection
    const isRequester = targetConnection.requesterId === currentUserId || targetConnection.requesterEmail === currentUserEmail;
    const isRecipient = targetConnection.recipientId === currentUserId || targetConnection.recipientEmail === currentUserEmail;
    if (!isRequester && !isRecipient) {
      return NextResponse.json({ error: "Unauthorized access to this chat room" }, { status: 403 });
    }

    const myRetentionHours = isRequester ? (targetConnection.requesterRetentionHours || 24) : (targetConnection.recipientRetentionHours || 24);
    const myClearedAt = isRequester ? targetConnection.requesterClearedAt : targetConnection.recipientClearedAt;

    const retentionCutoff = new Date(Date.now() - (myRetentionHours || 24) * 60 * 60 * 1000);
    const effectiveEarliestDate = myClearedAt && new Date(myClearedAt) > retentionCutoff ? new Date(myClearedAt) : retentionCutoff;

    const query: any = {
      roomId: targetConnection.roomId,
      clearedFor: { $nin: [currentUserId, currentUserEmail] },
      createdAt: { $gt: effectiveEarliestDate },
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }],
    };

    const messages: any[] = await ChatMessage.find(query)
      .sort({ createdAt: 1 })
      .lean();

    if (messages.length > 0) {
      if (shouldMarkRead) {
        await ChatMessage.updateMany(
          {
            $and: [
              query,
              {
                $or: [
                  { recipientId: currentUserId },
                  { recipientId: currentUserEmail },
                  ...(currentUser ? [{ recipientId: currentUser._id.toString() }] : []),
                ],
              },
            ],
          },
          { 
            $set: { 
              isRead: true, 
              isDelivered: true,
              readAt: new Date()
            } 
          }
        );
      } else {
        await ChatMessage.updateMany(
          {
            $and: [
              query,
              {
                $or: [
                  { recipientId: currentUserId },
                  { recipientId: currentUserEmail },
                  ...(currentUser ? [{ recipientId: currentUser._id.toString() }] : []),
                ],
              },
              { isDelivered: false },
            ],
          },
          { 
            $set: { 
              isDelivered: true,
              deliveredAt: new Date()
            } 
          }
        );
      }
    }

    const decryptedList = messages.map((msg: any) => {
      const isDirectedToMe = msg.recipientId === currentUserId || msg.recipientId === currentUserEmail;
      const isMsgRead = (shouldMarkRead && isDirectedToMe) ? true : (msg.isRead || false);
      const isMsgDelivered = isDirectedToMe ? true : (msg.isDelivered || false);

      if (msg.isDeleted) {
        return {
          _id: msg._id ? msg._id.toString() : "",
          senderId: msg.senderId,
          recipientId: msg.recipientId,
          sender: msg.sender,
          text: "This message was deleted",
          replyTo: null,
          isRead: isMsgRead,
          isDelivered: isMsgDelivered,
          deliveredAt: msg.deliveredAt || (isMsgDelivered ? (msg.updatedAt || msg.createdAt) : null),
          readAt: msg.readAt || (isMsgRead ? (msg.updatedAt || msg.createdAt) : null),
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

      let messageText = plainText;
      let mediaType: "image" | "video" | null = null;
      let mediaData: string | null = null;
      let mediaName: string | null = null;

      try {
        if (plainText.startsWith("{") && plainText.endsWith("}")) {
          const parsed = JSON.parse(plainText);
          if (parsed && typeof parsed === "object") {
            messageText = parsed.text || "";
            mediaType = parsed.mediaType || null;
            mediaData = parsed.mediaData || null;
            mediaName = parsed.mediaName || null;
          }
        }
      } catch (_) {
        messageText = plainText;
      }

      return {
        _id: msg._id ? msg._id.toString() : "",
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        sender: msg.sender,
        text: messageText,
        mediaType,
        mediaData,
        mediaName,
        replyTo: msg.replyTo || null,
        isRead: isMsgRead,
        isDelivered: isMsgDelivered,
        deliveredAt: msg.deliveredAt || (isMsgDelivered ? (msg.updatedAt || msg.createdAt) : null),
        readAt: msg.readAt || (isMsgRead ? (msg.updatedAt || msg.createdAt) : null),
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

    const { sender, recipientId, connectionId, roomId, text, mediaType, mediaData, mediaName, replyTo, retentionHours } = await req.json();

    if ((!recipientId && !connectionId && !roomId) || (!text?.trim() && !mediaData)) {
      return NextResponse.json({ error: "Recipient and message text or media are required" }, { status: 400 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();
    const displayName = sender || currentUser?.name || session.user.name || "Anonymous";

    let connection: any = null;
    if (connectionId && isValidObjectId(connectionId)) {
      connection = await ChatConnection.findById(connectionId);
    }
    if (!connection && roomId) {
      connection = await ChatConnection.findOne({ roomId });
    }
    if (!connection && recipientId) {
      let targetRecipientId = recipientId;
      const recipientUser = await User.findOne({
        $or: [{ _id: isValidObjectId(recipientId) ? recipientId : null }, { email: recipientId.toLowerCase().trim() }],
      });
      if (recipientUser) {
        targetRecipientId = recipientUser._id.toString();
      }

      connection = await ChatConnection.findOne({
        $or: [
          { requesterId: currentUserId, recipientId: targetRecipientId },
          { requesterId: targetRecipientId, recipientId: currentUserId },
          { requesterEmail: currentUserEmail, recipientEmail: recipientUser?.email || recipientId },
          { requesterEmail: recipientUser?.email || recipientId, recipientEmail: currentUserEmail },
        ],
        status: "accepted",
      });
    }

    if (!connection || connection.status !== "accepted") {
      return NextResponse.json(
        { error: "You can only message connected friends. Send a friend request first." },
        { status: 403 }
      );
    }

    const isRequester = connection.requesterId === currentUserId || connection.requesterEmail === currentUserEmail;
    const targetRecipientId = isRequester ? connection.recipientId : connection.requesterId;
    const targetRecipientEmail = isRequester ? connection.recipientEmail : connection.requesterEmail;
    const resolvedRoomId = connection.roomId;
    const participants = [currentUserId, targetRecipientId, currentUserEmail, targetRecipientEmail].filter(Boolean);

    const payloadObj = {
      text: text ? text.trim() : "",
      mediaType: mediaType || null,
      mediaData: mediaData || null,
      mediaName: mediaName || null,
    };
    const encrypted = encryptMessage(JSON.stringify(payloadObj));

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newMsg = await ChatMessage.create({
      senderId: currentUserId,
      recipientId: targetRecipientId,
      roomId: resolvedRoomId,
      participants,
      clearedFor: [],
      sender: displayName,
      content: encrypted.content,
      iv: encrypted.iv,
      authTag: encrypted.authTag,
      replyTo: replyTo ? {
        id: replyTo.id,
        sender: replyTo.sender,
        text: replyTo.text,
      } : null,
      retentionHours: retentionHours || 24,
      expiresAt,
      isDelivered: false,
      isRead: false,
      isEdited: false,
      isDeleted: false,
    });

    return NextResponse.json({
      _id: newMsg._id.toString(),
      senderId: newMsg.senderId,
      recipientId: newMsg.recipientId,
      sender: newMsg.sender,
      text: text ? text.trim() : "",
      mediaType: mediaType || null,
      mediaData: mediaData || null,
      mediaName: mediaName || null,
      replyTo: newMsg.replyTo || null,
      isRead: false,
      isDelivered: false,
      deliveredAt: null,
      readAt: null,
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

    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.senderId !== currentUserId && existing.senderId !== session.user.email) {
      return NextResponse.json({ error: "You can only edit messages you sent" }, { status: 403 });
    }

    const payloadObj = {
      text: text ? text.trim() : "",
      mediaType: existing.mediaType || null,
      mediaData: existing.mediaDataUrl || null,
      mediaName: existing.mediaName || null,
    };
    const encrypted = encryptMessage(JSON.stringify(payloadObj));

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
      mediaType: existing.mediaType || null,
      mediaData: existing.mediaDataUrl || null,
      mediaName: existing.mediaName || null,
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
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const rawRecipientId = searchParams.get("recipientId")?.trim() || "";
    const rawRoomId = searchParams.get("roomId")?.trim() || "";
    const rawConnectionId = searchParams.get("connectionId")?.trim() || "";
    const id = searchParams.get("id");

    if (clearAll) {
      let targetConnection: any = null;
      if (rawConnectionId && isValidObjectId(rawConnectionId)) {
        targetConnection = await ChatConnection.findById(rawConnectionId);
      }
      if (!targetConnection && rawRoomId) {
        targetConnection = await ChatConnection.findOne({ roomId: rawRoomId });
      }
      if (!targetConnection && rawRecipientId) {
        targetConnection = await ChatConnection.findOne({
          $or: [
            { roomId: [currentUserId, rawRecipientId].sort().join(":") },
            { $and: [{ requesterId: currentUserId }, { recipientId: rawRecipientId }] },
            { $and: [{ requesterId: rawRecipientId }, { recipientId: currentUserId }] },
          ],
        });
      }

      if (targetConnection) {
        await ChatMessage.updateMany(
          { roomId: targetConnection.roomId },
          { $addToSet: { clearedFor: { $each: [currentUserId, currentUserEmail] } } }
        );

        const now = new Date();
        if (targetConnection.requesterId === currentUserId || targetConnection.requesterEmail === currentUserEmail) {
          targetConnection.requesterClearedAt = now;
        } else {
          targetConnection.recipientClearedAt = now;
        }
        await targetConnection.save();
      }

      return NextResponse.json({ success: true, message: "Conversation cleared for your view only." });
    }

    if (!id) {
      return NextResponse.json({ error: "Message ID or clearAll=true is required" }, { status: 400 });
    }

    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (existing.senderId !== currentUserId && existing.senderId !== currentUserEmail) {
      return NextResponse.json({ error: "Unauthorized to delete this message for everyone" }, { status: 403 });
    }

    existing.content = "";
    existing.iv = "";
    existing.authTag = "";
    existing.replyTo = null;
    existing.isDeleted = true;
    await existing.save();

    return NextResponse.json({ success: true, message: "Message deleted for everyone" });
  } catch (error: any) {
    console.error("DELETE Chat Message Error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
