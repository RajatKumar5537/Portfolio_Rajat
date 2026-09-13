import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import { decryptField } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Message ID is required", { status: 400 });
    }

    await dbConnect();
    const msg = await Message.findById(id).select("mediaData mediaType mediaName").lean();
    if (!msg || !msg.mediaData) {
      return new NextResponse("Media not found", { status: 404 });
    }

    const decrypted = decryptField(msg.mediaData);
    if (!decrypted) {
      return new NextResponse("Failed to decrypt media", { status: 500 });
    }

    // If it's a data URL, stream the binary content with proper headers
    if (decrypted.startsWith("data:")) {
      const commaIndex = decrypted.indexOf(",");
      if (commaIndex !== -1) {
        const meta = decrypted.substring(5, commaIndex);
        const contentType = meta.split(";")[0] || "application/octet-stream";
        const base64Data = decrypted.substring(commaIndex + 1);
        const buffer = Buffer.from(base64Data, "base64");

        return new NextResponse(buffer, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Otherwise return plain or redirect
    return new NextResponse(decrypted, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err: any) {
    console.error("GET Media Error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
