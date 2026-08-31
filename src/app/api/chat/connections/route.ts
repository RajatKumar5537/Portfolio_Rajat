import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import ChatConnection from "@/lib/models/ChatConnection";
import ChatMessage from "@/lib/models/ChatMessage";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const currentUserEmail = session.user.email?.toLowerCase().trim();

    await dbConnect();

    // Fetch all connections involving current user
    const connections: any[] = await ChatConnection.find({
      $or: [
        { requesterId: currentUserId },
        { recipientId: currentUserId },
        { requesterEmail: currentUserEmail },
        { recipientEmail: currentUserEmail },
      ],
    }).lean();

    const accepted: any[] = [];
    const pendingIncoming: any[] = [];
    const pendingOutgoing: any[] = [];

    for (const conn of connections) {
      const isRequester = conn.requesterId === currentUserId || conn.requesterEmail === currentUserEmail;
      
      if (conn.status === "accepted") {
        const partnerId = isRequester ? conn.recipientId : conn.requesterId;
        const partnerName = isRequester ? conn.recipientName : conn.requesterName;
        accepted.push({
          connectionId: conn._id ? conn._id.toString() : "",
          partnerId,
          partnerName,
          roomId: conn.roomId,
        });
      } else if (conn.status === "pending") {
        if (isRequester) {
          pendingOutgoing.push({
            connectionId: conn._id ? conn._id.toString() : "",
            recipientEmail: conn.recipientEmail,
            recipientName: conn.recipientName,
            createdAt: conn.createdAt,
          });
        } else {
          pendingIncoming.push({
            connectionId: conn._id ? conn._id.toString() : "",
            requesterId: conn.requesterId,
            requesterName: conn.requesterName,
            requesterEmail: conn.requesterEmail,
            createdAt: conn.createdAt,
          });
        }
      }
    }

    return NextResponse.json({
      accepted,
      pendingIncoming,
      pendingOutgoing,
    });
  } catch (error: any) {
    console.error("GET Chat Connections Error:", error);
    return NextResponse.json({ accepted: [], pendingIncoming: [], pendingOutgoing: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Friend email address is required" }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();
    const currentUserEmail = session.user.email?.toLowerCase().trim();
    const currentUserId = (session.user as any).id || currentUserEmail;
    const currentUserName = session.user.name || currentUserEmail?.split("@")[0] || "User";

    if (targetEmail === currentUserEmail) {
      return NextResponse.json({ error: "You cannot send a friend request to yourself" }, { status: 400 });
    }

    await dbConnect();

    // Look up target user by exact email
    const targetUser: any = await User.findOne({ email: targetEmail });
    if (!targetUser) {
      return NextResponse.json(
        { error: "No user found with this exact email address. Please ensure the email is registered." },
        { status: 404 }
      );
    }

    const targetUserId = targetUser._id.toString();
    const targetUserName = targetUser.name || targetEmail.split("@")[0];

    // Deterministic room ID
    const roomId = [currentUserId, targetUserId].sort().join(":");

    // Check existing connection
    const existing: any = await ChatConnection.findOne({
      roomId,
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "You are already connected with this friend" }, { status: 400 });
      }
      if (existing.status === "pending") {
        if (existing.requesterId === currentUserId) {
          return NextResponse.json({ error: "Friend request is already pending acceptance" }, { status: 400 });
        } else {
          // If the other user had sent a request, auto-accept!
          existing.status = "accepted";
          await existing.save();
          return NextResponse.json({ success: true, message: "Friend request accepted! You can now chat securely.", autoAccepted: true });
        }
      }
      // If declined, update to pending again
      existing.status = "pending";
      existing.requesterId = currentUserId;
      existing.requesterName = currentUserName;
      existing.requesterEmail = currentUserEmail!;
      existing.recipientId = targetUserId;
      existing.recipientName = targetUserName;
      existing.recipientEmail = targetEmail;
      await existing.save();
      return NextResponse.json({ success: true, message: "Friend request sent successfully!" });
    }

    // Create new pending connection
    await ChatConnection.create({
      requesterId: currentUserId,
      requesterName: currentUserName,
      requesterEmail: currentUserEmail!,
      recipientId: targetUserId,
      recipientName: targetUserName,
      recipientEmail: targetEmail,
      status: "pending",
      roomId,
    });

    return NextResponse.json({ success: true, message: "Friend request sent! Waiting for acceptance." });
  } catch (error: any) {
    console.error("POST Chat Connection Error:", error);
    return NextResponse.json({ error: "Failed to send friend request" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId, action } = await req.json();
    if (!connectionId || !["accept", "decline"].includes(action)) {
      return NextResponse.json({ error: "Valid connectionId and action ('accept' | 'decline') are required" }, { status: 400 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const currentUserEmail = session.user.email?.toLowerCase().trim();

    await dbConnect();

    const connection: any = await ChatConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection request not found" }, { status: 404 });
    }

    // Verify current user is recipient
    const isRecipient = connection.recipientId === currentUserId || connection.recipientEmail === currentUserEmail;
    if (!isRecipient) {
      return NextResponse.json({ error: "Unauthorized to respond to this request" }, { status: 403 });
    }

    connection.status = action === "accept" ? "accepted" : "declined";
    await connection.save();

    return NextResponse.json({
      success: true,
      status: connection.status,
      message: action === "accept" ? "Friend request accepted! Channel is now active." : "Friend request declined.",
    });
  } catch (error: any) {
    console.error("PUT Chat Connection Error:", error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = (session.user as any).id || session.user.email;
    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID is required" }, { status: 400 });
    }

    await dbConnect();

    const connection: any = await ChatConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (connection.requesterId !== currentUserId && connection.recipientId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete connection and its messages
    await ChatConnection.findByIdAndDelete(connectionId);
    await ChatMessage.deleteMany({ roomId: connection.roomId });

    return NextResponse.json({ success: true, message: "Chat connection and messages removed" });
  } catch (error: any) {
    console.error("DELETE Chat Connection Error:", error);
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 });
  }
}
