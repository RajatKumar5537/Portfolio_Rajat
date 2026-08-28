import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, inviteCode } = await req.json();

    if (!email || !password || !inviteCode) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Verify system invite code
    const systemInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!systemInviteCode || inviteCode !== systemInviteCode) {
      return NextResponse.json(
        { error: "Invalid authorization invite code. Reset denied." },
        { status: 403 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Hash the new password securely
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Password Reset Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong during password reset" },
      { status: 500 }
    );
  }
}
