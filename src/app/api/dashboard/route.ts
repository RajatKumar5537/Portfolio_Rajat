import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";
import StudyLog from "@/lib/models/StudyLog";
import FoodLog from "@/lib/models/FoodLog";
import WellnessLog from "@/lib/models/WellnessLog";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    // Fetch all user records in parallel for fast loading
    const [expenses, studyLogs, foodLogs, wellnessLogs] = await Promise.all([
      Expense.find({ userId }).sort({ date: -1 }),
      StudyLog.find({ userId }).sort({ date: -1 }),
      FoodLog.find({ userId }).sort({ date: -1 }),
      WellnessLog.find({ userId }).sort({ date: -1, createdAt: -1 }),
    ]);

    return NextResponse.json({
      expenses,
      studyLogs,
      foodLogs,
      wellnessLogs,
    });
  } catch (error: any) {
    console.error("GET Dashboard Data Error: ", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
