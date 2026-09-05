import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import UserSettings from "@/lib/models/UserSettings";
import User from "@/lib/models/User";
import mongoose from "mongoose";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase() || "";
    const isRajatUser = userEmail === "kumarrajatpradhan5537@gmail.com";

    await dbConnect();

    let userId = (session.user as any).id;
    if (!userId && userEmail) {
      const u = await User.findOne({ email: userEmail });
      if (u) userId = u._id;
    }

    const query = {
      $or: [
        ...(userId && mongoose.Types.ObjectId.isValid(userId) ? [{ userId: new mongoose.Types.ObjectId(userId) }] : []),
        ...(userEmail ? [{ userEmail }] : []),
      ],
    };

    let settings = query.$or.length > 0 ? await UserSettings.findOne(query) : null;

    if (!settings) {
      const defaultPf = {
        enabled: isRajatUser,
        employeeContribution: isRajatUser ? 1800 : 0,
        employerContribution: isRajatUser ? 1800 : 0,
        healthInsuranceDeduction: isRajatUser ? 505 : 0,
        initialCorpus: 0,
        startMonth: isRajatUser ? "2024-10" : "2024-10",
      };

      const defaultBudgets = isRajatUser
        ? {
            Home: 25000,
            Ajit: 15000,
            "Delhi Room": 12000,
            Swarna: 8000,
            SIP: 5000,
            "Health Insurance": 505,
            "Term Insurance": 1500,
            Travel: 5000,
            Others: 8000,
          }
        : { Others: 10000 };

      const defaultExpenseCats = isRajatUser
        ? [
            "Home",
            "Delhi Room",
            "Swarna",
            "Ajit",
            "SIP",
            "Health Insurance",
            "Term Insurance",
            "Travel",
            "Others",
          ]
        : ["Others"];

      const defaultIncomeCats = isRajatUser
        ? ["Salary", "Bonus", "Others"]
        : ["Salary", "Others"];

      settings = await UserSettings.create({
        userId: userId || new mongoose.Types.ObjectId(),
        userEmail,
        pfSettings: defaultPf,
        categoryBudgets: defaultBudgets,
        expenseCategories: defaultExpenseCats,
        incomeCategories: defaultIncomeCats,
      });
    }

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET UserSettings Error: ", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session.user.email?.toLowerCase() || "";
    await dbConnect();

    let userId = (session.user as any).id;
    if (!userId && userEmail) {
      const u = await User.findOne({ email: userEmail });
      if (u) userId = u._id;
    }

    const body = await req.json();
    const { pfSettings, categoryBudgets, expenseCategories, incomeCategories } = body;

    const updateData: any = {
      ...(userEmail ? { userEmail } : {}),
      ...(userId ? { userId } : {}),
    };
    if (pfSettings !== undefined) updateData.pfSettings = pfSettings;
    if (categoryBudgets !== undefined) updateData.categoryBudgets = categoryBudgets;
    if (expenseCategories !== undefined) updateData.expenseCategories = expenseCategories;
    if (incomeCategories !== undefined) updateData.incomeCategories = incomeCategories;

    const query = {
      $or: [
        ...(userId && mongoose.Types.ObjectId.isValid(userId) ? [{ userId: new mongoose.Types.ObjectId(userId) }] : []),
        ...(userEmail ? [{ userEmail }] : []),
      ],
    };

    const settings = await UserSettings.findOneAndUpdate(
      query.$or.length > 0 ? query : { userEmail },
      { $set: updateData },
      { new: true, upsert: true }
    );

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("POST UserSettings Error: ", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 }
    );
  }
}
