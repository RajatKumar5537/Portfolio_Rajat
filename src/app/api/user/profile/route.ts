import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, avatar, statusMessage } = await req.json();

    await dbConnect();
    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (avatar) updateData.avatar = avatar.trim();
    if (statusMessage !== undefined) updateData.statusMessage = statusMessage.trim();

    const updatedUser = await User.findOneAndUpdate(
      { email: session.user.email.toLowerCase().trim() },
      { $set: updateData },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        statusMessage: updatedUser.statusMessage,
      },
    });
  } catch (err: any) {
    console.error("Profile update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile" }, { status: 500 });
  }
}
