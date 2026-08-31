import mongoose, { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    participants: {
      type: [String],
      required: true,
      index: true,
    },
    clearedFor: {
      type: [String],
      default: [],
      index: true,
    },
    sender: {
      type: String,
      required: [true, "Sender is required"],
      trim: true,
    },
    content: {
      type: String,
      default: "",
    },
    iv: {
      type: String,
      default: "",
    },
    authTag: {
      type: String,
      default: "",
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
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Delete existing model in memory to allow updated schema in Next.js dev/prod
if (models.ChatMessage) {
  delete (models as any).ChatMessage;
}

const ChatMessage = model("ChatMessage", ChatMessageSchema);

export default ChatMessage;
