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
      enum: [12, 24, 0],
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
