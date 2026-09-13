import mongoose, { Schema, model, models } from "mongoose";

const PresenceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userEmail: {
      type: String,
      lowercase: true,
    },
    userName: {
      type: String,
      required: true,
    },
    activeConversationId: {
      type: String,
      default: null,
    },
    isTypingIn: {
      type: String, // conversationId where user is currently typing
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "prime_presences",
  }
);

if (models.PrimePresence) {
  delete (models as any).PrimePresence;
}

const Presence = model("PrimePresence", PresenceSchema);
export default Presence;
