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
      $and: [
        {
          $or: [
            { recipientId: currentUserId },
            { recipientId: currentUserEmail },
          ],
        },
        { isRead: false },
        { isDeleted: { $ne: true } },
        { clearedFor: { $nin: [currentUserId, currentUserEmail] } },
        {
          $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }],
        },
      ],
    });

    // 2. Count pending incoming connection requests waiting for approval
    const pendingRequestsCount = await ChatConnection.countDocuments({
      $or: [{ recipientId: currentUserId }, { recipientEmail: currentUserEmail }],
      status: "pending",
    });

    // 3. Mark incoming messages addressed to current user as delivered (double grey tick)
    await ChatMessage.updateMany(
      {
        $or: [{ recipientId: currentUserId }, { recipientId: currentUserEmail }],
        isDelivered: { $ne: true },
      },
      { $set: { isDelivered: true } }
    );

    return NextResponse.json({ 
      unreadCount: unreadMessagesCount + pendingRequestsCount,
      unreadMessagesCount,
      pendingRequestsCount
    });
  } catch (error: any) {
    console.error("GET Chat Unread Error:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}
