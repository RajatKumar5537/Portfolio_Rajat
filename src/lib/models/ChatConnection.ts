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
    requesterRetentionHours: {
      type: Number,
      default: 24,
    },
    recipientRetentionHours: {
      type: Number,
      default: 24,
    },
    requesterClearedAt: {
      type: Date,
      default: null,
    },
    recipientClearedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness for a pair
ChatConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

if (models.ChatConnection) {
  delete (models as any).ChatConnection;
}

const ChatConnection = model("ChatConnection", ChatConnectionSchema);

export default ChatConnection;
