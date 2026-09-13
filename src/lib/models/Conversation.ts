import mongoose, { Schema, model, models } from "mongoose";

const ConversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      default: "direct",
      index: true,
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    icon: {
      type: String,
      default: "",
    },
    participants: {
      type: [String],
      required: true,
      index: true,
    },
    participantEmails: {
      type: [String],
      default: [],
      index: true,
    },
    admins: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: String,
      default: "",
    },
    isPinnedBy: {
      type: [String],
      default: [],
      index: true,
    },
    disappearingHours: {
      type: Number,
      default: 0, // 0 = disabled
    },
    lastMessage: {
      text: { type: String, default: "" },
      senderId: { type: String, default: "" },
      senderName: { type: String, default: "" },
      createdAt: { type: Date, default: Date.now },
      mediaType: { type: String, default: null },
      effect: { type: String, default: null },
    },
    customWallpaper: {
      type: String,
      default: "",
    },
    clearedFor: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "prime_conversations",
  }
);

ConversationSchema.index({ updatedAt: -1 });
ConversationSchema.index({ participants: 1, updatedAt: -1 });

if (models.PrimeConversation) {
  delete (models as any).PrimeConversation;
}

const Conversation = model("PrimeConversation", ConversationSchema);
export default Conversation;
