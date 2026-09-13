import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { action, currentPassword, newPassword, securityPin } = body;

    // 1. UPDATE PASSWORD
    if (action === "update-password" || newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Current password is required" }, { status: 400 });
      }

      const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
      }

      user.password = await bcrypt.hash(newPassword, 12);
      await user.save();

      return NextResponse.json({ success: true, message: "Password updated successfully" });
    }

    // 2. UPDATE OR CONFIGURE SECURITY PIN
    if (action === "update-pin" || securityPin) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Please enter your current password to update Security PIN" }, { status: 400 });
      }

      const isCurrentMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      const pinStr = String(securityPin).trim();
      if (!/^\d{4,6}$/.test(pinStr)) {
        return NextResponse.json({ error: "Security PIN must be 4 to 6 digits" }, { status: 400 });
      }

      user.securityPin = await bcrypt.hash(pinStr, 10);
      await user.save();

      return NextResponse.json({ success: true, message: "Security PIN updated successfully" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Password/PIN Update Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update security credentials" }, { status: 500 });
  }
}
