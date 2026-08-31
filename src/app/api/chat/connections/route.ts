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
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();

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
        const myRetentionHours = isRequester ? (conn.requesterRetentionHours || 24) : (conn.recipientRetentionHours || 24);

        accepted.push({
          connectionId: conn._id ? conn._id.toString() : "",
          partnerId,
          partnerName,
          roomId: conn.roomId,
          retentionHours: myRetentionHours,
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
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email || !email.trim()) {
      return NextResponse.json({ error: "Friend email address is required" }, { status: 400 });
    }

    const targetEmail = email.trim().toLowerCase();
    const currentUserEmail = session.user.email.toLowerCase().trim();

    await dbConnect();
    const currentUser = await User.findOne({ email: currentUserEmail });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || currentUserEmail);
    const currentUserName = currentUser?.name || session.user.name || currentUserEmail.split("@")[0] || "User";

    if (targetEmail === currentUserEmail) {
      return NextResponse.json({ error: "You cannot send a friend request to yourself" }, { status: 400 });
    }

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
        if (existing.requesterId === currentUserId || existing.requesterEmail === currentUserEmail) {
          return NextResponse.json({ error: "Friend request is already pending acceptance" }, { status: 400 });
        } else {
          // Auto-accept if the other party also requested
          existing.status = "accepted";
          await existing.save();
          return NextResponse.json({ success: true, message: "Friend request accepted! You can now chat securely.", autoAccepted: true });
        }
      }
      // If declined, update to pending again
      existing.status = "pending";
      existing.requesterId = currentUserId;
      existing.requesterName = currentUserName;
      existing.requesterEmail = currentUserEmail;
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
      requesterEmail: currentUserEmail,
      recipientId: targetUserId,
      recipientName: targetUserName,
      recipientEmail: targetEmail,
      status: "pending",
      roomId,
      requesterRetentionHours: 24,
      recipientRetentionHours: 24,
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
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { connectionId, action, retentionHours } = await req.json();
    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const connection: any = await ChatConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    const isRequester = connection.requesterId === currentUserId || connection.requesterEmail === currentUserEmail;
    const isRecipient = connection.recipientId === currentUserId || connection.recipientEmail === currentUserEmail;

    if (!isRequester && !isRecipient) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update user-specific retention hours (e.g. 12h or 24h)
    if (retentionHours === 12 || retentionHours === 24) {
      if (isRequester) {
        connection.requesterRetentionHours = retentionHours;
      } else {
        connection.recipientRetentionHours = retentionHours;
      }
      await connection.save();
      return NextResponse.json({
        success: true,
        retentionHours,
        message: `Disappearing messages set to ${retentionHours}h for your view.`,
      });
    }

    // Accept / Decline action
    if (action && ["accept", "decline"].includes(action)) {
      if (!isRecipient) {
        return NextResponse.json({ error: "Only the recipient can accept or decline this request" }, { status: 403 });
      }

      connection.status = action === "accept" ? "accepted" : "declined";
      await connection.save();

      return NextResponse.json({
        success: true,
        status: connection.status,
        message: action === "accept" ? "Friend request accepted! Channel is now active." : "Friend request declined.",
      });
    }

    return NextResponse.json({ error: "Invalid action or parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("PUT Chat Connection Error:", error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    const currentUserId = currentUser ? currentUser._id.toString() : ((session.user as any).id || session.user.email);
    const currentUserEmail = session.user.email.toLowerCase().trim();

    const { searchParams } = new URL(req.url);
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json({ error: "Connection ID is required" }, { status: 400 });
    }

    const connection: any = await ChatConnection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (
      connection.requesterId !== currentUserId &&
      connection.recipientId !== currentUserId &&
      connection.requesterEmail !== currentUserEmail &&
      connection.recipientEmail !== currentUserEmail
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete connection and its messages
    await ChatConnection.findByIdAndDelete(connectionId);
    await ChatMessage.deleteMany({ roomId: connection.roomId });

    return NextResponse.json({ success: true, message: "Friend connection removed" });
  } catch (error: any) {
    console.error("DELETE Chat Connection Error:", error);
    return NextResponse.json({ error: "Failed to delete connection" }, { status: 500 });
  }
}
