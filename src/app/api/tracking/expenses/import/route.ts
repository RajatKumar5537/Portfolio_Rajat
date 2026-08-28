import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import Expense from "@/lib/models/Expense";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { transactions } = await req.json();

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: "Invalid payload: transactions must be an array" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Map and sanitize transactions
    const sanitizedTransactions = transactions.map((t: any) => ({
      userId,
      date: t.date ? new Date(t.date) : new Date(),
      description: t.description || t.note || "Imported Transaction",
      amount: Math.abs(parseFloat(t.amount)) || 0, // Make sure amount is positive
      type: t.type === "Income" ? "Income" : "Expense",
      category: t.category || "Others",
    }));

    // Deduplicate against existing transactions in the database to prevent double imports
    const existing = await Expense.find({ userId });
    
    // Create a fast-lookup set of unique keys representing existing transactions
    const existingKeys = new Set(
      existing.map((e) =>
        `${new Date(e.date).toDateString()}_${e.description}_${e.amount}_${e.type}_${e.category}`
      )
    );

    // Filter out duplicates from incoming transactions
    const newTransactions = sanitizedTransactions.filter((t) => {
      const key = `${new Date(t.date).toDateString()}_${t.description}_${t.amount}_${t.type}_${t.category}`;
      return !existingKeys.has(key);
    });

    if (newTransactions.length === 0) {
      return NextResponse.json({
        message: "No new transactions to import. All entries were identified as duplicates.",
        importedCount: 0,
      });
    }

    // Bulk insert the filtered list
    const result = await Expense.insertMany(newTransactions);

    return NextResponse.json({
      message: `Successfully imported ${result.length} transactions.`,
      importedCount: result.length,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Bulk Import Error: ", error);
    return NextResponse.json({ error: "Failed to perform bulk import" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const result = await Expense.deleteMany({ userId });

    return NextResponse.json({
      message: `Successfully cleared all ${result.deletedCount} transactions.`,
      deletedCount: result.deletedCount,
    });

  } catch (error: any) {
    console.error("Clear Imports Error: ", error);
    return NextResponse.json({ error: "Failed to clear database records" }, { status: 500 });
  }
}
