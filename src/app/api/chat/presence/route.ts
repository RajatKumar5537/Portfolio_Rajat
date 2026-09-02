import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ChatPresence from "@/lib/models/ChatPresence";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ activeUsers: [] });
    }

    await dbConnect();
    const currentUserEmail = session.user.email?.toLowerCase().trim();
    const currentUser = currentUserEmail ? await User.findOne({ email: currentUserEmail }) : null;
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);

    // Return presences from the last 7 days so lastSeenAt timestamp is available when offline
    const weekThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const presences = await ChatPresence.find({
      lastSeenAt: { $gt: weekThreshold },
    }).lean();

    const now = Date.now();

    const activeUsers = presences.map((p: any) => {
      const lastSeenDate = p.lastSeenAt ? new Date(p.lastSeenAt) : null;
      // Consider online if heartbeat was within the last 15 seconds
      const isOnline = lastSeenDate ? (now - lastSeenDate.getTime()) < 15000 : false;
      const pEmail = p.userEmail?.toLowerCase().trim();

      const isMe = 
        p.userId === currentUserId || 
        p.userId === currentUserEmail ||
        (currentUserEmail && pEmail && pEmail === currentUserEmail);

      return {
        userId: p.userId,
        userEmail: pEmail || "",
        userName: p.userName,
        isTyping: isOnline && !!p.isTyping,
        isOnline: isOnline,
        isMe,
        lastSeenAt: lastSeenDate ? lastSeenDate.toISOString() : null,
      };
    });

    return NextResponse.json({ activeUsers });
  } catch (error: any) {
    console.error("GET Chat Presence Error:", error);
    return NextResponse.json({ activeUsers: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { isTyping = false, customName } = await req.json();
    await dbConnect();

    const currentUserEmail = session.user.email?.toLowerCase().trim() || "";
    const currentUser = currentUserEmail ? await User.findOne({ email: currentUserEmail }) : null;
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const defaultName = currentUser?.name || session.user.name || currentUserEmail.split("@")[0] || "User";
    const userName = customName && customName.trim() ? customName.trim() : defaultName;

    // Safe lookup and update avoiding MongoServerError on $or upsert
    let presence: any = await ChatPresence.findOne({
      $or: [{ userId: currentUserId }, { userEmail: currentUserEmail }],
    });

    if (presence) {
      presence.userId = currentUserId;
      presence.userEmail = currentUserEmail;
      presence.userName = userName;
      presence.isTyping = !!isTyping;
      presence.lastSeenAt = new Date();
      await presence.save();
    } else {
      await ChatPresence.create({
        userId: currentUserId,
        userEmail: currentUserEmail,
        userName,
        isTyping: !!isTyping,
        lastSeenAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Chat Presence Error:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
