import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";
import { isEncrypted } from "@/lib/crypto";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const expenses = await Expense.find({ userId }).sort({ date: -1 });

    // On-the-fly data migration to encrypt older plaintext records
    let migratedCount = 0;
    for (const exp of expenses) {
      let needsMigration = false;
      const rawDesc = exp.get("description", null, { getters: false });
      const rawAmount = exp.get("amount", null, { getters: false });
      const rawCategory = exp.get("category", null, { getters: false });

      if (rawDesc && !isEncrypted(rawDesc)) needsMigration = true;
      if (rawAmount && !isEncrypted(String(rawAmount))) needsMigration = true;
      if (rawCategory && !isEncrypted(rawCategory)) needsMigration = true;

      if (needsMigration) {
        // Accessing via getters decrypts old plaintext correctly, and re-setting triggers setters to encrypt.
        exp.description = exp.description;
        exp.amount = exp.amount;
        exp.category = exp.category;
        await exp.save();
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`Migrated ${migratedCount} plaintext expenses to encrypted format on the fly.`);
    }

    return NextResponse.json(expenses);
  } catch (error: any) {
    console.error("GET Expenses Error: ", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { date, description, amount, category, type } = await req.json();

    if (!description || amount === undefined || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    const newExpense = await Expense.create({
      userId,
      date: date ? new Date(date) : new Date(),
      description,
      amount: parseFloat(amount),
      category,
      type: type || "Expense",
    });

    return NextResponse.json(newExpense, { status: 201 });
  } catch (error: any) {
    console.error("POST Expense Error: ", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
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
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const deletedExpense = await Expense.findOneAndDelete({ _id: id, userId });

    if (!deletedExpense) {
      return NextResponse.json({ error: "Expense not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error: any) {
    console.error("DELETE Expense Error: ", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
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
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const { date, description, amount, category, type } = await req.json();

    await dbConnect();

    const updated = await Expense.findOneAndUpdate(
      { _id: id, userId },
      { date: date ? new Date(date) : undefined, description, amount: parseFloat(amount), category, type },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Expense not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT Expense Error: ", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}
