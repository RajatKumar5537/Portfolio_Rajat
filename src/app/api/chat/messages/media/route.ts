import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Conversation from "@/lib/models/Conversation";
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
    const msg = await Message.findById(id).select("mediaData mediaType mediaName conversationId").lean();
    if (!msg || !msg.mediaData) {
      return new NextResponse("Media not found", { status: 404 });
    }

    // Authorization: Verify user is a member of this conversation
    if (msg.conversationId) {
      const conv = await Conversation.findById(msg.conversationId).select("participants participantEmails").lean();
      if (conv) {
        const userId = (session.user as any)?.id || session.user.email;
        const userEmail = session.user.email;
        const isParticipant =
          conv.participants?.includes(userId) ||
          conv.participants?.includes(userEmail) ||
          conv.participantEmails?.includes(userEmail);

        if (!isParticipant) {
          return new NextResponse("Forbidden", { status: 403 });
        }
      }
    }

    const decrypted = decryptField(msg.mediaData);
    if (!decrypted) {
      return new NextResponse("Failed to decrypt media", { status: 500 });
    }

    // If it's a data URL, stream the binary content with private non-cached headers
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
            "Cache-Control": "private, no-cache, no-store, must-revalidate",
            "Content-Length": buffer.length.toString(),
          },
        });
      }
    }

    // Otherwise return plain or redirect with private headers
    return new NextResponse(decrypted, {
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (err: any) {
    console.error("GET Media Error:", err);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
