import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ChatMessage from "@/lib/models/ChatMessage";
import ChatConnection from "@/lib/models/ChatConnection";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ unreadCount: 0 });
    }

    const currentUserEmail = session.user.email?.toLowerCase().trim();
    if (!currentUserEmail) {
      return NextResponse.json({ unreadCount: 0 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: currentUserEmail });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || currentUserEmail);
    const now = new Date();

    const recipientIdentifiers = [
      currentUserId,
      currentUserEmail,
      ...(currentUser ? [currentUser._id.toString()] : []),
    ];

    // 1. Count unread messages strictly addressed to current user
    const unreadMessagesCount = await ChatMessage.countDocuments({
      $and: [
        {
          $or: [
            { recipientId: { $in: recipientIdentifiers } },
          ],
        },
        { isRead: false },
        { isDeleted: { $ne: true } },
        { clearedFor: { $nin: recipientIdentifiers } },
        {
          $or: [{ expiresAt: { $gt: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }],
        },
      ],
    });

    // 2. Count pending incoming connection requests waiting for approval
    const pendingRequestsCount = await ChatConnection.countDocuments({
      $or: [{ recipientId: { $in: recipientIdentifiers } }, { recipientEmail: currentUserEmail }],
      status: "pending",
    });

    // 3. Mark incoming messages addressed to current user as delivered (double grey tick + deliveredAt)
    await ChatMessage.updateMany(
      {
        recipientId: { $in: recipientIdentifiers },
        isDelivered: { $ne: true },
      },
      { 
        $set: { 
          isDelivered: true, 
          deliveredAt: new Date() 
        } 
      }
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
