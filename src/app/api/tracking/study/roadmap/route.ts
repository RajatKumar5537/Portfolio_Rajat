import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Roadmap from "@/lib/models/Roadmap";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const roadmap = await Roadmap.findOne({ userId });
    
    // If no roadmap exists, we return a default structure so client can initialize
    return NextResponse.json(roadmap || { default: true });
  } catch (error: any) {
    console.error("GET Roadmap Error: ", error);
    return NextResponse.json({ error: "Failed to fetch roadmap" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { startDate, duration, durationUnit, milestones } = await req.json();

    await dbConnect();

    const roadmap = await Roadmap.findOneAndUpdate(
      { userId },
      {
        startDate: startDate ? new Date(startDate) : undefined,
        duration: duration !== undefined ? parseInt(duration) : undefined,
        durationUnit,
        milestones
      },
      { new: true, upsert: true }
    );

    return NextResponse.json(roadmap);
  } catch (error: any) {
    console.error("POST Roadmap Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to update roadmap" }, { status: 500 });
  }
}
