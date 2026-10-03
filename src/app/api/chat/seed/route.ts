import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Disabled in production to prevent unauthorized account creation
  return new NextResponse("Not Found", { status: 404 });
}
