import mongoose, { Schema, model, models } from "mongoose";

const ChatCallSchema = new Schema(
  {
    callerId: {
      type: String,
      required: true,
      index: true,
    },
    callerName: {
      type: String,
      required: true,
    },
    callerEmail: {
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
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      default: "audio",
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "declined", "ended", "missed"],
      default: "ringing",
      index: true,
    },
    offer: {
      type: String,
      default: "",
    },
    answer: {
      type: String,
      default: "",
    },
    callerCandidates: {
      type: [String],
      default: [],
    },
    recipientCandidates: {
      type: [String],
      default: [],
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

if (models.ChatCall) {
  delete (models as any).ChatCall;
}

const ChatCall = model("ChatCall", ChatCallSchema);

export default ChatCall;
