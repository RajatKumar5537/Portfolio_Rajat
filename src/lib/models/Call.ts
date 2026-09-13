import mongoose, { Schema, model, models } from "mongoose";

const CallSchema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    callerId: {
      type: String,
      required: true,
      index: true,
    },
    callerName: {
      type: String,
      required: true,
    },
    callerAvatar: {
      type: String,
      default: "",
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
    recipientAvatar: {
      type: String,
      default: "",
    },
    callType: {
      type: String,
      enum: ["audio", "video"],
      default: "audio",
    },
    status: {
      type: String,
      enum: ["ringing", "accepted", "declined", "ended", "missed", "busy"],
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
    collection: "prime_calls",
  }
);

if (models.PrimeCall) {
  delete (models as any).PrimeCall;
}

const Call = model("PrimeCall", CallSchema);
export default Call;
