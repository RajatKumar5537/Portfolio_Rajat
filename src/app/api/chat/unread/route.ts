import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import ChatMessage from "@/lib/models/ChatMessage";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    await dbConnect();
    const now = new Date();

    const count = await ChatMessage.countDocuments({
      isRead: false,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    });

    return NextResponse.json({ unreadCount: count });
  } catch (error: any) {
    console.error("GET Chat Unread Error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
