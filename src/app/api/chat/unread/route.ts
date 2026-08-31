import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import ChatMessage from "@/lib/models/ChatMessage";
import ChatConnection from "@/lib/models/ChatConnection";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const currentUserEmail = session.user.email?.toLowerCase().trim();

    await dbConnect();
    const now = new Date();

    // 1. Count unread messages strictly addressed to current user
    const unreadMessagesCount = await ChatMessage.countDocuments({
      recipientId: currentUserId,
      isRead: false,
      $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
    });

    // 2. Count pending incoming connection requests waiting for approval
    const pendingRequestsCount = await ChatConnection.countDocuments({
      $or: [{ recipientId: currentUserId }, { recipientEmail: currentUserEmail }],
      status: "pending",
    });

    return NextResponse.json({ unreadCount: unreadMessagesCount + pendingRequestsCount });
  } catch (error: any) {
    console.error("GET Chat Unread Error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
