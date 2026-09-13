import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Message from "@/lib/models/Message";

export const dynamic = "force-dynamic";

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

    const { messageId, emoji } = await req.json();

    if (!messageId || !emoji) {
      return NextResponse.json({ error: "messageId and emoji are required" }, { status: 400 });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    const existingIndex = message.reactions.findIndex((r: any) => r.userId === currentUserId);

    if (existingIndex > -1) {
      if (message.reactions[existingIndex].emoji === emoji) {
        // Toggle off (remove)
        message.reactions.splice(existingIndex, 1);
      } else {
        // Change reaction emoji
        message.reactions[existingIndex].emoji = emoji;
        message.reactions[existingIndex].createdAt = new Date();
      }
    } else {
      // Add reaction
      message.reactions.push({
        userId: currentUserId,
        userName: currentUser.name,
        emoji,
        createdAt: new Date(),
      });
    }

    await message.save();

    return NextResponse.json({
      success: true,
      messageId: message._id.toString(),
      reactions: message.reactions,
    });
  } catch (error: any) {
    console.error("Tapback Reaction Error:", error);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
