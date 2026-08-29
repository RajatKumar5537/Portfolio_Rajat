import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password, inviteCode, securityPin } = await req.json();

    if (!name || !email || !password || !inviteCode || !securityPin) {
      return NextResponse.json(
        { error: "All fields are required (including Security PIN)" },
        { status: 400 }
      );
    }

    if (!/^\d{4,6}$/.test(securityPin)) {
      return NextResponse.json(
        { error: "Security PIN must be a 4 to 6 digit number" },
        { status: 400 }
      );
    }

    // Enforce strict registration check via environment invite code
    const systemInviteCode = process.env.REGISTRATION_INVITE_CODE;
    if (!systemInviteCode || inviteCode !== systemInviteCode) {
      return NextResponse.json(
        { error: "Invalid registration invite code. Access denied." },
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

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash credentials securely
    const hashedPassword = await bcrypt.hash(password, 12);
    const hashedPin = await bcrypt.hash(securityPin, 12);

    // Create the new User
    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      securityPin: hashedPin,
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: newUser._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration Error: ", error);
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
