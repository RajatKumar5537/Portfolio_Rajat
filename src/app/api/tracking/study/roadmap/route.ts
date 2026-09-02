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
    const userEmail = session.user.email?.toLowerCase();
    await dbConnect();

    const roadmap = await Roadmap.findOne({ userId });
    
    if (roadmap) {
      return NextResponse.json(roadmap);
    }

    if (userEmail === "kumarrajatpradhan5537@gmail.com") {
      return NextResponse.json({
        default: false,
        startDate: "2026-08-25T00:00:00",
        duration: 6,
        durationUnit: "months",
        milestones: [
          { id: 1, name: "Month 1: Advanced TS & Clean Architecture", desc: "Domain Driven Design, Design Patterns, SOLID practices." },
          { id: 2, name: "Month 2: Algorithms & SDET Best Practices", desc: "Complex data structures, runtime optimization, design patterns in automation." },
          { id: 3, name: "Month 3: High-Scale System Design", desc: "Microservices, caching strategies, distributed systems architectures." },
          { id: 4, name: "Month 4: Cloud Infrastructure & DevOps", desc: "CI/CD integration, Docker, Kubernetes, AWS resources setup." },
          { id: 5, name: "Month 5: Event-Driven & Async Pipelines", desc: "Kafka message brokers, Redis cache layer validation, real-time message streams." },
          { id: 6, name: "Month 6: Capstone Project & QE Leadership", desc: "Custom test suites, scale-load tests, end-to-end framework assembly." },
        ]
      });
    }

    return NextResponse.json({
      default: true,
      startDate: new Date().toISOString().split("T")[0],
      duration: 1,
      durationUnit: "months",
      milestones: []
    });
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
