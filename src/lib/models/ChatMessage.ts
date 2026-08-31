import mongoose, { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    sender: {
      type: String,
      required: [true, "Sender is required"],
      trim: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    iv: {
      type: String,
      required: true,
    },
    authTag: {
      type: String,
      required: true,
    },
    replyTo: {
      id: { type: String, default: null },
      sender: { type: String, default: null },
      text: { type: String, default: null },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    retentionHours: {
      type: Number,
      default: 24,
      enum: [12, 24, 0], // 0 for permanent if needed
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index automatically cleans up expired messages in MongoDB
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compiling model in Next.js HMR
const ChatMessage = models.ChatMessage || model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
