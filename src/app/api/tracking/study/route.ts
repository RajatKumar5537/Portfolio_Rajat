import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import StudyLog from "@/lib/models/StudyLog";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const logs = await StudyLog.find({ userId }).sort({ date: -1 });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET StudyLogs Error: ", error);
    return NextResponse.json({ error: "Failed to fetch study logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { date, topic, durationMinutes, completed, objective } = await req.json();

    if (!topic || durationMinutes === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const newLog = await StudyLog.create({
      userId,
      date: date ? new Date(date) : new Date(),
      topic,
      durationMinutes: parseInt(durationMinutes),
      completed: completed ?? true,
      objective: objective || "",
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error("POST StudyLog Error: ", error);
    return NextResponse.json({ error: "Failed to create study log" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "StudyLog ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const deletedLog = await StudyLog.findOneAndDelete({ _id: id, userId });

    if (!deletedLog) {
      return NextResponse.json({ error: "Study log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Study log deleted successfully" });
  } catch (error: any) {
    console.error("DELETE StudyLog Error: ", error);
    return NextResponse.json({ error: "Failed to delete study log" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "StudyLog ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const { topic, durationMinutes, date } = await req.json();

    await dbConnect();

    const updated = await StudyLog.findOneAndUpdate(
      { _id: id, userId },
      { topic, durationMinutes: parseInt(durationMinutes), date: date ? new Date(date) : undefined },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Study log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT StudyLog Error: ", error);
    return NextResponse.json({ error: "Failed to update study log" }, { status: 500 });
  }
}
