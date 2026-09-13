import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Call from "@/lib/models/Call";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
import { encryptMessage } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let currentUserId = (session.user as any).id;
    if (!currentUserId) {
      const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      currentUserId = currentUser._id.toString();
    }

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const callId = searchParams.get("callId");

    if (callId) {
      const call = await Call.findById(callId).lean();
      return NextResponse.json(call);
    }

    // Check for active or incoming calls for this user
    const activeCall = await Call.findOne({
      $or: [{ callerId: currentUserId }, { recipientId: currentUserId }],
      status: { $in: ["ringing", "accepted"] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(activeCall || null);
  } catch (error: any) {
    console.error("GET Call Error:", error);
    return NextResponse.json({ error: "Failed to fetch call" }, { status: 500 });
  }
}

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

    const {
      action,
      callId,
      conversationId,
      recipientId,
      callType,
      offer,
      answer,
      candidate,
      isCaller,
    } = await req.json();

    // 1. INITIATE A CALL
    if (action === "initiate") {
      if (!conversationId || !recipientId) {
        return NextResponse.json({ error: "conversationId and recipientId are required" }, { status: 400 });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }

      // Terminate any previous dangling calls
      await Call.updateMany(
        {
          $or: [{ callerId: currentUserId }, { recipientId: currentUserId }],
          status: { $in: ["ringing", "accepted"] },
        },
        { status: "ended", endedAt: new Date() }
      );

      const newCall = await Call.create({
        conversationId,
        callerId: currentUserId,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar || "",
        recipientId: recipient._id.toString(),
        recipientName: recipient.name,
        recipientAvatar: recipient.avatar || "",
        callType: callType || "audio",
        status: "ringing",
        offer: offer || "",
        answer: "",
        callerCandidates: [],
        recipientCandidates: [],
        startedAt: new Date(),
      });

      return NextResponse.json(newCall, { status: 201 });
    }

    // Existing call modifications
    if (!callId) {
      return NextResponse.json({ error: "callId is required for this action" }, { status: 400 });
    }

    const call = await Call.findById(callId);
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // 2. ACCEPT
    if (action === "accept") {
      const updateData: any = { status: "accepted" };
      if (answer) {
        updateData.answer = typeof answer === "string" ? answer : JSON.stringify(answer);
      }
      const updatedCall = await Call.findByIdAndUpdate(callId, updateData, { new: true });
      return NextResponse.json({ success: true, call: updatedCall });
    }

    // 3. DECLINE / END
    if (action === "decline" || action === "end") {
      const endedAt = new Date();
      const existing: any = await Call.findById(callId).lean();
      const durationSec = existing?.startedAt
        ? Math.max(0, Math.floor((endedAt.getTime() - new Date(existing.startedAt).getTime()) / 1000))
        : 0;
      const updatedCall = await Call.findByIdAndUpdate(
        callId,
        {
          status: action === "decline" ? "declined" : "ended",
          endedAt,
          durationSec,
        },
        { new: true }
      );

      // Log call into conversation message history if not already ended/declined
      if (existing && existing.status !== "ended" && existing.status !== "declined") {
        try {
          const isVideo = existing.callType === "video";
          let callText = "";
          if (action === "decline") {
            callText = isVideo ? "🎥 Missed video call" : "📞 Missed audio call";
          } else if (existing.status === "accepted" && durationSec > 0) {
            const mins = Math.floor(durationSec / 60);
            const secs = durationSec % 60;
            const durText = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
            callText = isVideo ? `🎥 Video call • ${durText}` : `📞 Audio call • ${durText}`;
          } else if (existing.status === "ringing") {
            callText = isVideo ? "🎥 Cancelled video call" : "📞 Cancelled call";
          } else {
            callText = isVideo ? "🎥 Video call ended" : "📞 Audio call ended";
          }

          const encrypted = encryptMessage(callText);
          await Message.create({
            conversationId: existing.conversationId,
            senderId: existing.callerId,
            senderName: existing.callerName || "User",
            senderAvatar: existing.callerAvatar || "",
            content: encrypted.content,
            iv: encrypted.iv,
            authTag: encrypted.authTag,
            mediaType: "call",
            audioDuration: durationSec,
            readBy: [{ userId: existing.recipientId, readAt: endedAt }],
          });

          // Sync conversation last message
          await Conversation.findByIdAndUpdate(existing.conversationId, {
            $set: {
              lastMessage: {
                text: callText,
                senderId: existing.callerId,
                senderName: existing.callerName,
                createdAt: endedAt,
                mediaType: "call",
              },
              updatedAt: endedAt,
            },
          });
        } catch (logErr) {
          console.error("Failed to log call history message:", logErr);
        }
      }

      return NextResponse.json({ success: true, call: updatedCall });
    }

    // 4. SIGNAL OFFER
    if (action === "signal-offer") {
      const updatedCall = await Call.findByIdAndUpdate(
        callId,
        { offer: typeof offer === "string" ? offer : JSON.stringify(offer) },
        { new: true }
      );
      return NextResponse.json({ success: true, call: updatedCall });
    }

    // 5. SIGNAL ANSWER
    if (action === "signal-answer") {
      const updatedCall = await Call.findByIdAndUpdate(
        callId,
        { answer: typeof answer === "string" ? answer : JSON.stringify(answer) },
        { new: true }
      );
      return NextResponse.json({ success: true, call: updatedCall });
    }

    // 6. ICE CANDIDATE (Atomic $push prevents VersionError and lost candidates)
    if (action === "candidate") {
      if (candidate) {
        const candStr = typeof candidate === "string" ? candidate : JSON.stringify(candidate);
        const updateField = isCaller ? "callerCandidates" : "recipientCandidates";
        await Call.findByIdAndUpdate(callId, {
          $push: { [updateField]: candStr },
        });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Call Error:", error);
    return NextResponse.json({ error: "Failed to process call signaling" }, { status: 500 });
  }
}
