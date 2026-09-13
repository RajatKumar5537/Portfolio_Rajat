import mongoose, { Schema, model, models } from "mongoose";

const ConnectionSchema = new Schema(
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
    },
    requesterAvatar: {
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
    recipientEmail: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    recipientAvatar: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "blocked"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "prime_connections",
  }
);

ConnectionSchema.index({ requesterId: 1, recipientId: 1 }, { unique: true });

if (models.PrimeConnection) {
  delete (models as any).PrimeConnection;
}

const Connection = model("PrimeConnection", ConnectionSchema);
export default Connection;
