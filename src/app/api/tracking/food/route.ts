import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import FoodLog from "@/lib/models/FoodLog";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const logs = await FoodLog.find({ userId }).sort({ date: -1 });
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("GET FoodLogs Error: ", error);
    return NextResponse.json({ error: "Failed to fetch food logs" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { date, foodName, portionGrams, proteinPer100g, mealType, portion, portionUnit, calories, carbs, fats, isAvoid } = await req.json();

    if (!foodName || portionGrams === undefined || proteinPer100g === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await dbConnect();

    // Mongoose pre-validate hook will handle calculatedProtein computation.
    const newLog = await FoodLog.create({
      userId,
      date: date ? new Date(date) : new Date(),
      foodName,
      portionGrams: parseFloat(portionGrams),
      proteinPer100g: parseFloat(proteinPer100g),
      portion: portion !== undefined ? parseFloat(portion) : parseFloat(portionGrams),
      portionUnit: portionUnit || "Grams",
      calories: calories !== undefined ? parseFloat(calories) : 0,
      carbs: carbs !== undefined ? parseFloat(carbs) : 0,
      fats: fats !== undefined ? parseFloat(fats) : 0,
      isAvoid: isAvoid ?? false,
      mealType: mealType || "Snack",
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error: any) {
    console.error("POST FoodLog Error: ", error);
    return NextResponse.json({ error: error.message || "Failed to create food log" }, { status: 500 });
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
      return NextResponse.json({ error: "FoodLog ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    await dbConnect();

    const deletedLog = await FoodLog.findOneAndDelete({ _id: id, userId });

    if (!deletedLog) {
      return NextResponse.json({ error: "Food log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ message: "Food log deleted successfully" });
  } catch (error: any) {
    console.error("DELETE FoodLog Error: ", error);
    return NextResponse.json({ error: "Failed to delete food log" }, { status: 500 });
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
      return NextResponse.json({ error: "FoodLog ID is required" }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const { date, foodName, portionGrams, proteinPer100g, mealType, portion, portionUnit, calories, carbs, fats, isAvoid } = await req.json();

    const calculatedProtein = (parseFloat(portionGrams) * parseFloat(proteinPer100g)) / 100;

    await dbConnect();

    const updated = await FoodLog.findOneAndUpdate(
      { _id: id, userId },
      {
        date: date ? new Date(date) : undefined,
        foodName,
        portionGrams: parseFloat(portionGrams),
        proteinPer100g: parseFloat(proteinPer100g),
        mealType,
        calculatedProtein,
        portion: portion !== undefined ? parseFloat(portion) : undefined,
        portionUnit,
        calories: calories !== undefined ? parseFloat(calories) : undefined,
        carbs: carbs !== undefined ? parseFloat(carbs) : undefined,
        fats: fats !== undefined ? parseFloat(fats) : undefined,
        isAvoid,
      },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Food log not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("PUT FoodLog Error: ", error);
    return NextResponse.json({ error: "Failed to update food log" }, { status: 500 });
  }
}
