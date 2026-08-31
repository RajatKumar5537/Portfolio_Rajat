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
    const threshold = new Date(Date.now() - 8000); // active in the last 8 seconds

    const activePresences = await ChatPresence.find({
      lastSeenAt: { $gt: threshold },
    }).lean();

    const currentUserId = (session.user as any).id || session.user.email;

    const activeUsers = activePresences.map((p: any) => ({
      userId: p.userId,
      userName: p.userName,
      isTyping: !!p.isTyping,
      isMe: p.userId === currentUserId,
      lastSeenAt: p.lastSeenAt,
    }));

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
    const defaultName = session.user.name || session.user.email?.split("@")[0] || "User";
    const userName = customName && customName.trim() ? customName.trim() : defaultName;

    await dbConnect();

    await ChatPresence.findOneAndUpdate(
      { userId },
      {
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
