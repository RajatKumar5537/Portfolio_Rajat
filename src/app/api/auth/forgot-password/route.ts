import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password, securityPin } = await req.json();

    if (!email || !password || !securityPin) {
      return NextResponse.json(
        { error: "All fields are required (including Security PIN)" },
        { status: 400 }
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

    // Handle legacy user accounts without Security PIN configured
    if (!user.securityPin) {
      return NextResponse.json(
        { error: "This account does not have a Security PIN configured. Please contact the administrator to reset your password." },
        { status: 400 }
      );
    }

    // Verify user-specific Security PIN
    const isPinMatch = await bcrypt.compare(securityPin, user.securityPin);
    if (!isPinMatch) {
      return NextResponse.json(
        { error: "Invalid Security PIN. Reset denied." },
        { status: 403 }
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
