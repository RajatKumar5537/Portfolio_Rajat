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

    await dbConnect();
    const now = new Date();

    // Fetch active unexpired messages
    const messages = await ChatMessage.find({
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    })
      .sort({ createdAt: 1 })
      .lean();

    // Mark messages as read in background if requested
    const { searchParams } = new URL(req.url);
    const shouldMarkRead = searchParams.get("markRead") !== "false";
    if (shouldMarkRead) {
      await ChatMessage.updateMany(
        { isRead: false, $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }] },
        { $set: { isRead: true } }
      );
    }

    // Decrypt messages
    const decryptedList = messages.map((msg: any) => {
      if (msg.isDeleted) {
        return {
          _id: msg._id.toString(),
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

    const { sender, text, replyTo, retentionHours = 24 } = await req.json();
    if (!sender || !text || !text.trim()) {
      return NextResponse.json({ error: "Sender and text are required" }, { status: 400 });
    }

    await dbConnect();

    // Encrypt the message text with AES-256-GCM
    const encrypted = encryptMessage(text.trim());

    // Calculate expiration date
    const hours = retentionHours === 12 ? 12 : 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const newMsg = await ChatMessage.create({
      sender: sender.trim(),
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

    const { id, text } = await req.json();
    if (!id || !text || !text.trim()) {
      return NextResponse.json({ error: "Message ID and text are required" }, { status: 400 });
    }

    await dbConnect();

    // Encrypt updated text
    const encrypted = encryptMessage(text.trim());

    const updated = await ChatMessage.findByIdAndUpdate(
      id,
      {
        content: encrypted.content,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        isEdited: true,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({
      _id: updated._id.toString(),
      sender: updated.sender,
      text: text.trim(),
      replyTo: updated.replyTo || null,
      isRead: updated.isRead,
      isEdited: true,
      isDeleted: updated.isDeleted || false,
      retentionHours: updated.retentionHours,
      createdAt: updated.createdAt,
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Message ID is required" }, { status: 400 });
    }

    await dbConnect();
    // Wipe message content and mark as deleted
    const updated = await ChatMessage.findByIdAndUpdate(
      id,
      {
        content: "",
        iv: "",
        authTag: "",
        replyTo: null,
        isDeleted: true,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Message marked as deleted" });
  } catch (error: any) {
    console.error("DELETE Chat Message Error:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
