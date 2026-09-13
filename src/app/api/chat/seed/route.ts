import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import Connection from "@/lib/models/Connection";
import { encryptMessage } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    // Check if demo users already exist
    let user1 = await User.findOne({ email: "rajat@primechat.io" });
    let user2 = await User.findOne({ email: "swarna@primechat.io" });

    const hashedPassword = await bcrypt.hash("prime123", 10);

    if (!user1) {
      user1 = await User.create({
        name: "Rajat",
        email: "rajat@primechat.io",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Rajat",
        statusMessage: "Building next-gen iMessage experience ✨",
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    if (!user2) {
      user2 = await User.create({
        name: "Swarna 🥰",
        email: "swarna@primechat.io",
        password: hashedPassword,
        avatar: "https://api.dicebear.com/7.x/adventurer/svg?seed=Swarna",
        statusMessage: "Celebrating new moments! 🎆",
        isOnline: true,
        lastSeen: new Date(),
      });
    }

    const u1Id = user1._id.toString();
    const u2Id = user2._id.toString();

    // Ensure connection
    let conn = await Connection.findOne({
      $or: [
        { requesterId: u1Id, recipientId: u2Id },
        { requesterId: u2Id, recipientId: u1Id },
      ],
    });

    if (!conn) {
      conn = await Connection.create({
        requesterId: u1Id,
        requesterName: user1.name,
        requesterEmail: user1.email,
        requesterAvatar: user1.avatar,
        recipientId: u2Id,
        recipientName: user2.name,
        recipientEmail: user2.email,
        recipientAvatar: user2.avatar,
        status: "accepted",
      });
    }

    // Ensure conversation
    let conversation = await Conversation.findOne({
      type: "direct",
      participants: { $all: [u1Id, u2Id], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "direct",
        participants: [u1Id, u2Id],
        participantEmails: [user1.email, user2.email],
        lastMessage: {
          text: "Happy New Year! 🎉✨",
          senderId: u2Id,
          senderName: user2.name,
          createdAt: new Date(),
          effect: "fireworks",
        },
      });

      // Add sample messages with Fireworks effect matching Screenshot #2
      const msg1Enc = encryptMessage("Hi 🥰✨");
      await Message.create({
        conversationId: conversation._id.toString(),
        senderId: u1Id,
        senderName: user1.name,
        senderAvatar: user1.avatar,
        content: msg1Enc.content,
        iv: msg1Enc.iv,
        authTag: msg1Enc.authTag,
        effect: "gentle",
        reactions: [{ userId: u2Id, userName: user2.name, emoji: "❤️", createdAt: new Date() }],
        readBy: [{ userId: u2Id, readAt: new Date() }],
      });

      const msg2Enc = encryptMessage("Tingu 🥰");
      await Message.create({
        conversationId: conversation._id.toString(),
        senderId: u2Id,
        senderName: user2.name,
        senderAvatar: user2.avatar,
        content: msg2Enc.content,
        iv: msg2Enc.iv,
        authTag: msg2Enc.authTag,
        effect: "love",
        reactions: [{ userId: u1Id, userName: user1.name, emoji: "🥰", createdAt: new Date() }],
        readBy: [{ userId: u1Id, readAt: new Date() }],
      });

      const msg3Enc = encryptMessage("Happy New Year! 🎉 Check out the fireworks effect!");
      await Message.create({
        conversationId: conversation._id.toString(),
        senderId: u2Id,
        senderName: user2.name,
        senderAvatar: user2.avatar,
        content: msg3Enc.content,
        iv: msg3Enc.iv,
        authTag: msg3Enc.authTag,
        effect: "fireworks",
        reactions: [
          { userId: u1Id, userName: user1.name, emoji: "🔥", createdAt: new Date() },
          { userId: u2Id, userName: user2.name, emoji: "❤️", createdAt: new Date() },
        ],
        readBy: [{ userId: u1Id, readAt: new Date() }],
      });
    }

    return NextResponse.json({
      success: true,
      message: "Seed completed successfully with demo accounts!",
      demoAccounts: [
        { email: "rajat@primechat.io", password: "prime123", name: "Rajat" },
        { email: "swarna@primechat.io", password: "prime123", name: "Swarna 🥰" },
      ],
    });
  } catch (err: any) {
    console.error("Seed error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
