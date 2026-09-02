import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ChatCall from "@/lib/models/ChatCall";
import ChatMessage from "@/lib/models/ChatMessage";
import { encryptMessage } from "@/lib/crypto";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUserEmail = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email: currentUserEmail });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || currentUserEmail);

    const { searchParams } = new URL(req.url);
    const callId = searchParams.get("callId");

    if (callId) {
      const call = await ChatCall.findById(callId).lean();
      if (!call) {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }
      return NextResponse.json({ call });
    }

    // Check for incoming ringing calls for the current user created within last 45 seconds
    const cutoff = new Date(Date.now() - 45 * 1000);
    const incomingCall = await ChatCall.findOne({
      $or: [{ recipientId: currentUserId }, { recipientEmail: currentUserEmail }],
      status: "ringing",
      createdAt: { $gte: cutoff },
    })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ incomingCall: incomingCall || null });
  } catch (error: any) {
    console.error("GET Chat Call Error:", error);
    return NextResponse.json({ error: "Failed to fetch call status" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { recipientId, recipientName, recipientEmail, offer, candidates, callType } = await req.json();
    if (!recipientId && !recipientEmail) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    await dbConnect();
    const currentUserEmail = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email: currentUserEmail });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || currentUserEmail);
    const currentUserName = currentUser?.name || session.user.name || currentUserEmail.split("@")[0] || "User";

    let targetEmail = (recipientEmail || "").toLowerCase().trim();
    let targetUserId = recipientId || "";
    let targetUserName = recipientName || "Friend";

    if (!targetUserId && targetEmail) {
      const targetUser = await User.findOne({ email: targetEmail });
      if (targetUser) {
        targetUserId = targetUser._id.toString();
        targetUserName = targetUser.name || targetEmail.split("@")[0];
      }
    }

    const roomId = [currentUserId, targetUserId || targetEmail].sort().join(":");

    // Cancel any previous ringing calls between these two users
    await ChatCall.updateMany(
      { roomId, status: "ringing" },
      { $set: { status: "missed", endedAt: new Date() } }
    );

    const call = await ChatCall.create({
      callerId: currentUserId,
      callerName: currentUserName,
      callerEmail: currentUserEmail,
      recipientId: targetUserId || targetEmail,
      recipientName: targetUserName,
      recipientEmail: targetEmail,
      roomId,
      callType: callType === "video" ? "video" : "audio",
      status: "ringing",
      offer: offer || "",
      callerCandidates: candidates ? (Array.isArray(candidates) ? candidates.map((c: any) => typeof c === "string" ? c : JSON.stringify(c)) : [JSON.stringify(candidates)]) : [],
    });

    return NextResponse.json({ success: true, callId: call._id.toString(), call });
  } catch (error: any) {
    console.error("POST Chat Call Error:", error);
    return NextResponse.json({ error: "Failed to initiate call" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { callId, action, answer, candidate, durationSec } = await req.json();
    if (!callId) {
      return NextResponse.json({ error: "callId is required" }, { status: 400 });
    }

    await dbConnect();
    const currentUserEmail = session.user.email.toLowerCase().trim();
    const currentUser = await User.findOne({ email: currentUserEmail });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || currentUserEmail);

    const call: any = await ChatCall.findById(callId);
    if (!call) {
      return NextResponse.json({ error: "Call session not found" }, { status: 404 });
    }

    const isCaller = call.callerId === currentUserId || call.callerEmail === currentUserEmail;
    const isRecipient = call.recipientId === currentUserId || call.recipientEmail === currentUserEmail;

    if (!isCaller && !isRecipient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (action === "answer") {
      call.status = "accepted";
      call.answer = answer || "";
      call.startedAt = new Date();
      if (candidate) {
        call.recipientCandidates.push(typeof candidate === "string" ? candidate : JSON.stringify(candidate));
      }
      await call.save();
      return NextResponse.json({ success: true, call });
    }

    if (action === "ice-candidate") {
      if (candidate) {
        const candidateStr = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
        const updateQuery = isCaller 
          ? { $addToSet: { callerCandidates: candidateStr } } 
          : { $addToSet: { recipientCandidates: candidateStr } };
        await ChatCall.findByIdAndUpdate(callId, updateQuery);
      }
      return NextResponse.json({ success: true });
    }

    if (action === "decline") {
      call.status = "declined";
      call.endedAt = new Date();
      await call.save();

      // Log missed call in chat
      try {
        const isVideo = call.callType === "video";
        const iconAndLabel = isVideo ? "🎥 Missed video call" : "📞 Missed voice call";
        const encrypted = encryptMessage(iconAndLabel);
        await ChatMessage.create({
          senderId: call.callerId,
          recipientId: call.recipientId,
          roomId: call.roomId,
          participants: [call.callerId, call.recipientId],
          sender: call.callerName,
          content: encrypted.content,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          isDelivered: true,
          isRead: false,
          mediaType: null,
          mediaDataUrl: null,
          mediaName: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } catch (logErr) {
        console.error("Error logging declined call message:", logErr);
      }

      return NextResponse.json({ success: true, call });
    }

    if (action === "end") {
      const now = new Date();
      call.status = "ended";
      call.endedAt = now;
      if (durationSec !== undefined) {
        call.durationSec = durationSec;
      } else if (call.startedAt) {
        call.durationSec = Math.max(0, Math.floor((now.getTime() - new Date(call.startedAt).getTime()) / 1000));
      }
      await call.save();

      // Log completed call in chat
      try {
        const isVideo = call.callType === "video";
        const prefix = isVideo ? "🎥 Video call" : "📞 Voice call";
        const mins = Math.floor(call.durationSec / 60);
        const secs = call.durationSec % 60;
        const durText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        const logText = call.durationSec > 0 ? `${prefix} • ${durText}` : `${prefix} ended`;

        const encrypted = encryptMessage(logText);
        await ChatMessage.create({
          senderId: currentUserId,
          recipientId: isCaller ? call.recipientId : call.callerId,
          roomId: call.roomId,
          participants: [call.callerId, call.recipientId],
          sender: isCaller ? call.callerName : call.recipientName,
          content: encrypted.content,
          iv: encrypted.iv,
          authTag: encrypted.authTag,
          isDelivered: true,
          isRead: true,
          mediaType: null,
          mediaDataUrl: null,
          mediaName: null,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
      } catch (logErr) {
        console.error("Error logging call end message:", logErr);
      }

      return NextResponse.json({ success: true, call });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT Chat Call Error:", error);
    return NextResponse.json({ error: "Failed to update call" }, { status: 500 });
  }
}
