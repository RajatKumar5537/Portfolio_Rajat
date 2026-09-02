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
    })
      .sort({ lastSeenAt: -1 })
      .lean();

    const now = Date.now();
    const seenMap = new Map<string, boolean>();
    const activeUsers: any[] = [];

    for (const p of presences as any[]) {
      const pEmail = p.userEmail?.toLowerCase().trim() || (p.userId.includes("@") ? p.userId.toLowerCase().trim() : "");
      const key = pEmail || p.userId;

      // Deduplicate to always retain the most recent presence record per user
      if (key && seenMap.has(key)) continue;
      if (key) seenMap.set(key, true);

      const lastSeenDate = p.lastSeenAt ? new Date(p.lastSeenAt) : null;
      // Consider online if heartbeat was within the last 45 seconds (resilient to mobile background throttling)
      const isOnline = lastSeenDate ? (now - lastSeenDate.getTime()) < 45000 : false;

      const isMe = 
        p.userId === currentUserId || 
        p.userId === currentUserEmail ||
        (currentUserEmail && pEmail && pEmail === currentUserEmail) ||
        (currentUser && p.userId === currentUser._id.toString());

      activeUsers.push({
        userId: p.userId,
        userEmail: pEmail,
        userName: p.userName,
        isTyping: isOnline && !!p.isTyping,
        isOnline: isOnline,
        isMe,
        lastSeenAt: lastSeenDate ? lastSeenDate.toISOString() : null,
      });
    }

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

    const lookupQuery = [
      ...(currentUserId ? [{ userId: currentUserId }] : []),
      ...(currentUserEmail ? [{ userId: currentUserEmail }, { userEmail: currentUserEmail }] : []),
    ];

    let presence: any = await ChatPresence.findOne({ $or: lookupQuery });

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
