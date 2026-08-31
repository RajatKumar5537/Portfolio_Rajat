import { NextResponse } from "next/server";

export async function GET() {
  // Public user listing is disabled for zero-knowledge privacy
  return NextResponse.json({ contacts: [] });
}
