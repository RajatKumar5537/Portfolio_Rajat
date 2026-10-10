import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import { decrypt } from "@/lib/crypto";
import Expense from "@/lib/models/Expense";
import StudyLog from "@/lib/models/StudyLog";
import FoodLog from "@/lib/models/FoodLog";
import WellnessLog from "@/lib/models/WellnessLog";

export const dynamic = "force-dynamic";

type Range = { start: Date; end: Date };

let indexesReady: Promise<unknown> | null = null;

function ensureIndexes() {
  if (!indexesReady) {
    indexesReady = Promise.all([
      Expense.collection.createIndex({ userId: 1, date: -1 }),
      StudyLog.collection.createIndex({ userId: 1, date: -1 }),
      FoodLog.collection.createIndex({ userId: 1, date: -1 }),
      WellnessLog.collection.createIndex({ userId: 1, date: -1 }),
    ]).catch((err) => {
      indexesReady = null;
      console.error("Dashboard index setup failed:", err);
    });
  }
  return indexesReady;
}

function utcMonthRange(year: number, monthIndex: number): Range {
  return {
    start: new Date(Date.UTC(year, monthIndex, 1)),
    end: new Date(Date.UTC(year, monthIndex + 1, 1)),
  };
}

function utcYearRange(year: number): Range {
  return {
    start: new Date(Date.UTC(year, 0, 1)),
    end: new Date(Date.UTC(year + 1, 0, 1)),
  };
}

function utcDayRange(ymd: string): Range | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return null;
  const start = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) return null;
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

function localDayRange(ymd: string, tzOffsetMin: number): Range | null {
  const utc = utcDayRange(ymd);
  if (!utc) return null;
  const start = new Date(utc.start.getTime() + tzOffsetMin * 60_000);
  return { start, end: new Date(start.getTime() + 86_400_000) };
}

function dateClause(range: Range) {
  return { date: { $gte: range.start, $lt: range.end } };
}

function readAmount(value: unknown) {
  const decrypted = decrypt(typeof value === "string" ? value : "");
  return parseFloat(decrypted) || 0;
}

function readCategory(value: unknown) {
  const decrypted = decrypt(typeof value === "string" ? value : "");
  return decrypted || "Others";
}

async function sumNet(filter: Record<string, unknown> | null) {
  if (!filter) return 0;
  const docs = await Expense.find(filter).select("amount type").lean();
  let net = 0;
  for (const doc of docs) {
    const amount = readAmount(doc.amount);
    if (doc.type === "Income") net += amount;
    else if (doc.type === "Expense") net -= amount;
  }
  return net;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({
        expenses: [],
        studyLogs: [],
        foodLogs: [],
        wellnessLogs: [],
        streakLogs: [],
        years: [],
        previousBalance: 0,
      });
    }

    const url = new URL(req.url);
    const month = Number(url.searchParams.get("month") ?? new Date().getMonth());
    const year = Number(url.searchParams.get("year") ?? new Date().getFullYear());
    const nowYear = Number(url.searchParams.get("nowYear") ?? new Date().getFullYear());
    const tzOffsetMin = Number(url.searchParams.get("tz") ?? "0");
    const selectedDate = url.searchParams.get("date");
    const today = url.searchParams.get("today");

    await dbConnect();
    await ensureIndexes();

    const ownerId = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const owner = { userId: ownerId };
    let expenseFilter: Record<string, unknown> = owner;
    let previousFilter: Record<string, unknown> | null = null;
    let periodRange: Range | null = null;

    if (selectedDate) {
      const day = utcDayRange(selectedDate);
      if (day) {
        periodRange = day;
        expenseFilter = { ...owner, ...dateClause(day) };
        previousFilter = { ...owner, date: { $lt: day.start } };
      }
    } else if (month === -1 && year === -1) {
      previousFilter = null;
    } else if (month === -1 && Number.isFinite(year)) {
      periodRange = utcYearRange(year);
      expenseFilter = { ...owner, ...dateClause(periodRange) };
      previousFilter = { ...owner, ...dateClause(utcYearRange(year - 1)) };
    } else if (year === -1 && month >= 0 && month <= 11) {
      expenseFilter = { ...owner, $expr: { $eq: [{ $month: "$date" }, month + 1] } };
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? nowYear - 1 : nowYear;
      previousFilter = { ...owner, ...dateClause(utcMonthRange(prevYear, prevMonth)) };
    } else if (month >= 0 && month <= 11 && Number.isFinite(year)) {
      periodRange = utcMonthRange(year, month);
      expenseFilter = { ...owner, ...dateClause(periodRange) };
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      previousFilter = { ...owner, ...dateClause(utcMonthRange(prevYear, prevMonth)) };
    }

    const todayRange = today ? localDayRange(today, Number.isFinite(tzOffsetMin) ? tzOffsetMin : 0) : null;
    const scope = { ...expenseFilter };
    delete scope.userId;
    const foodFilter = todayRange && Object.keys(scope).length
      ? { ...owner, $or: [scope, dateClause(todayRange)] }
      : expenseFilter;
    const periodFilter = expenseFilter;

    const [expenseDocs, previousBalance, studyLogs, foodLogs, wellnessLogs, streakLogs, yearGroups] = await Promise.all([
      Expense.find(expenseFilter).select("date amount type category").sort({ date: -1 }).lean(),
      sumNet(previousFilter),
      StudyLog.find(periodFilter).select("date topic durationMinutes status completed").sort({ date: -1 }).lean(),
      FoodLog.find(foodFilter).select("date calculatedProtein calories carbs fats").sort({ date: -1 }).lean(),
      WellnessLog.find(periodFilter).select("date type exercise.durationMinutes sleep.sleepHours").sort({ date: -1 }).lean(),
      StudyLog.find(owner).select("date status completed").sort({ date: -1 }).lean(),
      Expense.aggregate([
        { $match: owner },
        { $group: { _id: { $year: "$date" } } },
        { $sort: { _id: -1 } },
      ]),
    ]);

    const expenses = expenseDocs.map((doc) => ({
      date: doc.date,
      type: doc.type,
      amount: readAmount(doc.amount),
      category: readCategory(doc.category),
    }));

    const years = yearGroups
      .map((row) => Number(row._id))
      .filter((value) => Number.isFinite(value));

    return NextResponse.json({
      expenses,
      studyLogs,
      foodLogs,
      wellnessLogs,
      streakLogs,
      years,
      previousBalance,
    });
  } catch (error) {
    console.error("GET Dashboard Data Error: ", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
