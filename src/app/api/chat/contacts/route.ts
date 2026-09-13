import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Connection from "@/lib/models/Connection";
import Conversation from "@/lib/models/Conversation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const searchEmail = searchParams.get("search")?.toLowerCase().trim();

    // If searching for users to add
    if (searchEmail) {
      const users = await User.find({
        $and: [
          { _id: { $ne: currentUserId } },
          {
            $or: [
              { email: { $regex: searchEmail, $options: "i" } },
              { name: { $regex: searchEmail, $options: "i" } },
            ],
          },
        ],
      })
        .select("name email avatar isOnline statusMessage")
        .limit(10)
        .lean();

      return NextResponse.json(users);
    }

    // Otherwise return contacts and connection requests
    const connections = await Connection.find({
      $or: [{ requesterId: currentUserId }, { recipientId: currentUserId }],
    }).sort({ updatedAt: -1 }).lean();

    const accepted: any[] = [];
    const pendingIncoming: any[] = [];
    const pendingOutgoing: any[] = [];

    // Also get live online status from User
    const peerIds = connections.map((c) =>
      c.requesterId === currentUserId ? c.recipientId : c.requesterId
    );
    const liveUsers = await User.find({ _id: { $in: peerIds } }).select("isOnline lastSeen statusMessage avatar").lean();
    const liveMap = new Map(liveUsers.map((u) => [u._id.toString(), u]));

    for (const c of connections) {
      const isRequester = c.requesterId === currentUserId;
      const peerId = isRequester ? c.recipientId : c.requesterId;
      const liveData = liveMap.get(peerId);

      const contactObj = {
        _id: c._id.toString(),
        userId: peerId,
        name: isRequester ? c.recipientName : c.requesterName,
        email: isRequester ? c.recipientEmail : c.requesterEmail,
        avatar: liveData?.avatar || (isRequester ? c.recipientAvatar : c.requesterAvatar),
        statusMessage: liveData?.statusMessage || "Available",
        isOnline: Boolean(liveData?.isOnline),
        lastSeen: liveData?.lastSeen,
        status: c.status,
      };

      if (c.status === "accepted") {
        accepted.push(contactObj);
      } else if (c.status === "pending") {
        if (isRequester) {
          pendingOutgoing.push(contactObj);
        } else {
          pendingIncoming.push(contactObj);
        }
      }
    }

    return NextResponse.json({
      contacts: accepted,
      pendingIncoming,
      pendingOutgoing,
    });
  } catch (error: any) {
    console.error("GET Contacts Error:", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
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

    const { email, userId } = await req.json();

    let targetUser: any = null;
    if (userId) {
      targetUser = await User.findById(userId);
    } else if (email) {
      targetUser = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetUserId = targetUser._id.toString();
    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: "You cannot add yourself" }, { status: 400 });
    }

    // Check existing connection
    let existing = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, recipientId: targetUserId },
        { requesterId: targetUserId, recipientId: currentUserId },
      ],
    });

    if (existing) {
      if (existing.status === "accepted") {
        return NextResponse.json({ error: "Already in contacts" }, { status: 400 });
      }
      if (existing.status === "pending") {
        return NextResponse.json({ error: "Request is already pending" }, { status: 400 });
      }
      // Re-activate declined/blocked
      existing.status = "pending";
      existing.requesterId = currentUserId;
      existing.requesterName = currentUser.name;
      existing.requesterEmail = currentUser.email;
      existing.recipientId = targetUserId;
      existing.recipientName = targetUser.name;
      existing.recipientEmail = targetUser.email;
      await existing.save();
      return NextResponse.json({ success: true, connection: existing });
    }

    const newConnection = await Connection.create({
      requesterId: currentUserId,
      requesterName: currentUser.name,
      requesterEmail: currentUser.email,
      requesterAvatar: currentUser.avatar || "",
      recipientId: targetUserId,
      recipientName: targetUser.name,
      recipientEmail: targetUser.email,
      recipientAvatar: targetUser.avatar || "",
      status: "pending",
    });

    return NextResponse.json({ success: true, connection: newConnection }, { status: 201 });
  } catch (error: any) {
    console.error("POST Connection Error:", error);
    return NextResponse.json({ error: "Failed to send request" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
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

    const { connectionId, status } = await req.json();

    if (!connectionId || !["accepted", "declined", "blocked"].includes(status)) {
      return NextResponse.json({ error: "Valid connectionId and status are required" }, { status: 400 });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (connection.recipientId !== currentUserId && connection.requesterId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    connection.status = status;
    await connection.save();

    // If accepted, ensure a conversation exists
    if (status === "accepted") {
      let conv = await Conversation.findOne({
        type: "direct",
        participants: { $all: [connection.requesterId, connection.recipientId], $size: 2 },
      });

      if (!conv) {
        conv = await Conversation.create({
          type: "direct",
          participants: [connection.requesterId, connection.recipientId],
          lastMessage: {
            text: "Connected on iMessage ✨",
            senderId: currentUserId,
            senderName: currentUser.name,
            createdAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({ success: true, status: connection.status });
  } catch (error: any) {
    console.error("PUT Connection Error:", error);
    return NextResponse.json({ error: "Failed to update connection" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
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

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const connectionId = searchParams.get("connectionId");

    if (!connectionId) {
      return NextResponse.json({ error: "connectionId is required" }, { status: 400 });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return NextResponse.json({ error: "Connection not found" }, { status: 404 });
    }

    if (connection.requesterId !== currentUserId && connection.recipientId !== currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await Connection.findByIdAndDelete(connectionId);
    return NextResponse.json({ success: true, message: "Contact removed" });
  } catch (error: any) {
    console.error("DELETE Connection Error:", error);
    return NextResponse.json({ error: "Failed to remove contact" }, { status: 500 });
  }
}
