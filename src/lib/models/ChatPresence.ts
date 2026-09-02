import mongoose, { Schema, model, models } from "mongoose";

const ChatPresenceSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    userEmail: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    isTyping: {
      type: Boolean,
      default: false,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const ChatPresence = models.ChatPresence || model("ChatPresence", ChatPresenceSchema);

export default ChatPresence;
