import mongoose, { Schema, model, models } from "mongoose";

const ChatConnectionSchema = new Schema(
  {
    requesterId: {
      type: String,
      required: true,
      index: true,
    },
    requesterName: {
      type: String,
      required: true,
    },
    requesterEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    recipientId: {
      type: String,
      required: true,
      index: true,
    },
    recipientName: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined"],
      default: "pending",
      index: true,
    },
    roomId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness for a pair
ChatConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

const ChatConnection = models.ChatConnection || model("ChatConnection", ChatConnectionSchema);

export default ChatConnection;
