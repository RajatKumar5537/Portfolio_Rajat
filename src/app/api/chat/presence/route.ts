import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import ChatPresence from "@/lib/models/ChatPresence";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ activeUsers: [] });
    }

    await dbConnect();
    // Return presences from the last 7 days so lastSeenAt timestamp is available when offline
    const weekThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const presences = await ChatPresence.find({
      lastSeenAt: { $gt: weekThreshold },
    }).lean();

    const currentUserId = (session.user as any).id || session.user.email;
    const currentUserEmail = session.user.email?.toLowerCase().trim();

    const activeUsers = presences.map((p: any) => {
      const lastSeenDate = p.lastSeenAt ? new Date(p.lastSeenAt) : null;
      const isOnline = lastSeenDate ? (Date.now() - lastSeenDate.getTime()) < 8000 : false;
      const pEmail = p.userEmail?.toLowerCase().trim();

      const isMe = 
        p.userId === currentUserId || 
        (currentUserEmail && p.userId.toLowerCase() === currentUserEmail) ||
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
    const userId = (session.user as any).id || session.user.email;
    const userEmail = session.user.email?.toLowerCase().trim() || "";
    const defaultName = session.user.name || session.user.email?.split("@")[0] || "User";
    const userName = customName && customName.trim() ? customName.trim() : defaultName;

    await dbConnect();

    await ChatPresence.findOneAndUpdate(
      { $or: [{ userId }, { userEmail: userEmail }] },
      {
        userId,
        userEmail,
        userName,
        isTyping: !!isTyping,
        lastSeenAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Chat Presence Error:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
