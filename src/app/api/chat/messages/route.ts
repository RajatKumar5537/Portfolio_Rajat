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
    const rawRecipientId = searchParams.get("recipientId");
    const shouldMarkRead = searchParams.get("markRead") !== "false";
    const now = new Date();

    let targetRecipientId = rawRecipientId?.trim() || "";
    let targetRecipientEmail = "";

    if (targetRecipientId) {
      if (targetRecipientId.includes("@")) {
        targetRecipientEmail = targetRecipientId.toLowerCase();
        const targetUser = await User.findOne({ email: targetRecipientEmail });
        if (targetUser) {
          targetRecipientId = targetUser._id.toString();
        }
      } else if (isValidObjectId(targetRecipientId)) {
        const targetUser = await User.findById(targetRecipientId);
        if (targetUser) {
          targetRecipientEmail = targetUser.email.toLowerCase();
        }
      } else {
        const targetUser = await User.findOne({ email: targetRecipientId.toLowerCase() });
        if (targetUser) {
          targetRecipientId = targetUser._id.toString();
          targetRecipientEmail = targetUser.email.toLowerCase();
        }
      }
    }

    // Lookup connection settings (user-specific retention & clear timestamp)
    let myRetentionHours = 24;
    let myClearedAt: Date | null = null;
    let connRoomId: string | null = null;

    if (targetRecipientId) {
      const conn: any = await ChatConnection.findOne({
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

      if (conn) {
        connRoomId = conn.roomId;
        const isRequester = conn.requesterId === currentUserId || conn.requesterEmail === currentUserEmail;
        myRetentionHours = isRequester ? (conn.requesterRetentionHours || 24) : (conn.recipientRetentionHours || 24);
        myClearedAt = isRequester ? conn.requesterClearedAt : conn.recipientClearedAt;
      }
    }

    // Calculate user's retention cutoff date
    const retentionCutoff = new Date(Date.now() - (myRetentionHours || 24) * 60 * 60 * 1000);
    const effectiveEarliestDate = myClearedAt && new Date(myClearedAt) > retentionCutoff ? new Date(myClearedAt) : retentionCutoff;

    const userSelfIds = [currentUserId, currentUserEmail].filter(Boolean);
    const userTargetIds = [targetRecipientId, targetRecipientEmail, rawRecipientId].filter(Boolean);

    let query: any = {};

    if (targetRecipientId) {
      const possibleRoomIds = [
        ...(connRoomId ? [connRoomId] : []),
        [currentUserId, targetRecipientId].sort().join(":"),
        [currentUserId, targetRecipientId].sort().join("_"),
        ...(targetRecipientEmail ? [
          [currentUserEmail, targetRecipientEmail].sort().join(":"),
          [currentUserEmail, targetRecipientEmail].sort().join("_"),
          [currentUserId, targetRecipientEmail].sort().join(":"),
          [currentUserId, targetRecipientEmail].sort().join("_"),
        ] : []),
      ];

      query = {
        $and: [
          {
            $or: [
              { roomId: { $in: possibleRoomIds } },
              { $and: [{ senderId: { $in: userSelfIds } }, { recipientId: { $in: userTargetIds } }] },
              { $and: [{ senderId: { $in: userTargetIds } }, { recipientId: { $in: userSelfIds } }] },
              { participants: { $all: [currentUserId, targetRecipientId] } },
              ...(targetRecipientEmail ? [
                { participants: { $all: [currentUserEmail, targetRecipientEmail] } },
                { participants: { $all: [currentUserId, targetRecipientEmail] } },
              ] : []),
            ],
          },
          // Filter out messages cleared by current user
          {
            clearedFor: { $nin: [currentUserId, currentUserEmail] },
          },
          // Filter by user's personal retention & clear cutoff
          {
            createdAt: { $gt: effectiveEarliestDate },
          },
          {
            $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }],
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
              { senderId: currentUserEmail },
              { recipientId: currentUserEmail },
            ],
          },
          {
            clearedFor: { $nin: [currentUserId, currentUserEmail] },
          },
          {
            createdAt: { $gt: effectiveEarliestDate },
          },
          {
            $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }],
          },
        ],
      };
    }

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

      return {
        _id: msg._id ? msg._id.toString() : "",
        senderId: msg.senderId,
        recipientId: msg.recipientId,
        sender: msg.sender,
        text: plainText,
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

    const { sender, recipientId, text, replyTo, retentionHours } = await req.json();

    if (!recipientId || !text || !text.trim()) {
      return NextResponse.json({ error: "Recipient and message text are required" }, { status: 400 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();
    const displayName = sender || currentUser?.name || session.user.name || "Anonymous";

    let targetRecipientId = recipientId;
    const recipientUser = await User.findOne({
      $or: [{ _id: isValidObjectId(recipientId) ? recipientId : null }, { email: recipientId.toLowerCase().trim() }],
    });
    if (recipientUser) {
      targetRecipientId = recipientUser._id.toString();
    }

    const connection: any = await ChatConnection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: targetRecipientId },
        { requesterId: targetRecipientId, recipientId: currentUserId },
        { requesterEmail: currentUserEmail, recipientEmail: recipientUser?.email || recipientId },
        { requesterEmail: recipientUser?.email || recipientId, recipientEmail: currentUserEmail },
      ],
      status: "accepted",
    });

    if (!connection) {
      return NextResponse.json(
        { error: "You can only message connected friends. Send a friend request first." },
        { status: 403 }
      );
    }

    const roomId = connection.roomId || [currentUserId, targetRecipientId].sort().join(":");
    const participants = [currentUserId, targetRecipientId, currentUserEmail, recipientUser?.email || recipientId].filter(Boolean);

    const encrypted = encryptMessage(text.trim());

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newMsg = await ChatMessage.create({
      senderId: currentUserId,
      recipientId: targetRecipientId,
      roomId,
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
      text: text.trim(),
      replyTo: newMsg.replyTo || null,
      isRead: false,
      isDelivered: false,
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
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const clearAll = searchParams.get("clearAll") === "true";
    const recipientId = searchParams.get("recipientId");
    const id = searchParams.get("id");

    // "Clear Conversation" -> Only clears for the requesting user! (Other friend keeps conversation intact)
    if (clearAll) {
      let targetRecipientId = recipientId?.trim() || "";
      let targetRecipientEmail = "";

      if (targetRecipientId) {
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
      }

      const targetRoomId = targetRecipientId ? [currentUserId, targetRecipientId].sort().join(":") : "";

      const roomFilter = targetRoomId
        ? {
            $or: [
              { roomId: targetRoomId },
              { participants: { $all: [currentUserId, targetRecipientId] } },
              ...(targetRecipientEmail ? [{ participants: { $all: [currentUserEmail, targetRecipientEmail] } }] : []),
            ],
          }
        : {
            $or: [{ participants: currentUserId }, { participants: currentUserEmail }],
          };

      // Add current user to clearedFor on all room messages (so only current user's view is cleared)
      await ChatMessage.updateMany(roomFilter, {
        $addToSet: { clearedFor: { $each: [currentUserId, currentUserEmail] } },
      });

      // Update connection cleared timestamp
      if (targetRecipientId) {
        const now = new Date();
        const conn: any = await ChatConnection.findOne({
          $or: [
            { roomId: targetRoomId },
            { $and: [{ requesterId: currentUserId }, { recipientId: targetRecipientId }] },
            { $and: [{ requesterId: targetRecipientId }, { recipientId: currentUserId }] },
          ],
        });

        if (conn) {
          if (conn.requesterId === currentUserId || conn.requesterEmail === currentUserEmail) {
            conn.requesterClearedAt = now;
          } else {
            conn.recipientClearedAt = now;
          }
          await conn.save();
        }
      }

      return NextResponse.json({ success: true, message: "Conversation cleared for your view only." });
    }

    // Individual message "Delete for Everyone"
    if (!id) {
      return NextResponse.json({ error: "Message ID or clearAll=true is required" }, { status: 400 });
    }

    const existing = await ChatMessage.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    // Verify user is sender or participant
    if (existing.senderId !== currentUserId && existing.senderId !== currentUserEmail) {
      return NextResponse.json({ error: "Unauthorized to delete this message for everyone" }, { status: 403 });
    }

    // Wipe sensitive payload and mark as deleted for everyone (WhatsApp style)
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
