import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import WellnessLog from "@/lib/models/WellnessLog";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const logs = await WellnessLog.find({ userId }).sort({ date: -1, createdAt: -1 });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET WellnessLogs Error: ", error);
    return NextResponse.json({ error: "Failed to fetch wellness logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { date, type } = body;

    if (!type || !["exercise", "sleep"].includes(type)) {
      return NextResponse.json({ error: "Invalid or missing type" }, { status: 400 });
    }

    await dbConnect();

    // Block duplicate sleep logs for the same calendar date
    if (type === "sleep") {
      const searchDate = date ? new Date(date) : new Date();
      const startOfDay = new Date(searchDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(searchDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingSleep = await WellnessLog.findOne({
        userId,
        type: "sleep",
        date: { $gte: startOfDay, $lte: endOfDay }
      });

      if (existingSleep) {
        return NextResponse.json(
          { error: "already record submited for the date update the next sleep time" },
          { status: 400 }
        );
      }
    }

    const logData: any = {
      userId,
      date: date ? new Date(date) : new Date(),
      type,
    };

    if (type === "exercise") {
      const { activityName, durationMinutes, intensity, caloriesBurned, notes } = body;
      if (!activityName || durationMinutes === undefined) {
        return NextResponse.json({ error: "Missing required exercise fields" }, { status: 400 });
      }
      logData.exercise = {
        activityName,
        durationMinutes: parseFloat(durationMinutes),
        intensity: intensity || "Medium",
        caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : 0,
        notes: notes || "",
      };
    } else if (type === "sleep") {
      const { sleepHours, sleepQuality, notes } = body;
      if (sleepHours === undefined) {
        return NextResponse.json({ error: "Missing sleep hours" }, { status: 400 });
      }
      logData.sleep = {
        sleepHours: parseFloat(sleepHours),
        sleepQuality: sleepQuality || "Good",
        notes: notes || "",
      };
    }

    const newLog = await WellnessLog.create(logData);
    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error("POST WellnessLog Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to create wellness log" }, { status: 500 });
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
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const deletedLog = await WellnessLog.findOneAndDelete({ _id: id, userId });

    if (!deletedLog) {
      return NextResponse.json({ error: "Wellness log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Wellness log deleted successfully" });
  } catch (error: any) {
    console.error("DELETE WellnessLog Error: ", error);
    return NextResponse.json({ error: "Failed to delete wellness log" }, { status: 500 });
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
      return NextResponse.json({ error: "Log ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { date, type } = body;

    await dbConnect();

    const updateData: any = {};
    if (date) updateData.date = new Date(date);

    if (type === "exercise") {
      const { activityName, durationMinutes, intensity, caloriesBurned, notes } = body;
      updateData.exercise = {
        activityName,
        durationMinutes: parseFloat(durationMinutes),
        intensity: intensity || "Medium",
        caloriesBurned: caloriesBurned ? parseFloat(caloriesBurned) : 0,
        notes: notes || "",
      };
    } else if (type === "sleep") {
      const { sleepHours, sleepQuality, notes } = body;
      updateData.sleep = {
        sleepHours: parseFloat(sleepHours),
        sleepQuality: sleepQuality || "Good",
        notes: notes || "",
      };
    }

    const updated = await WellnessLog.findOneAndUpdate(
      { _id: id, userId },
      updateData,
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Wellness log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT WellnessLog Error: ", error);
    return NextResponse.json({ error: "Failed to update wellness log" }, { status: 500 });
  }
}
