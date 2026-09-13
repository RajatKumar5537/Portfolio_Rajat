import mongoose, { Schema, model, models } from "mongoose";

const ReactionSchema = new Schema(
  {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    emoji: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
      index: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    senderAvatar: {
      type: String,
      default: "",
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
    effect: {
      type: String,
      enum: ["fireworks", "balloons", "confetti", "lasers", "love", "shooting_star", "good_morning", "good_night", "invisible_ink", "slam", "loud", "gentle", null],
      default: null,
    },
    mediaType: {
      type: String,
      enum: ["image", "video", "audio", "file", "call", null],
      default: null,
    },
    mediaData: {
      type: String,
      default: null,
    },
    mediaName: {
      type: String,
      default: null,
    },
    mediaSize: {
      type: String,
      default: null,
    },
    audioDuration: {
      type: Number,
      default: 0,
    },
    reactions: {
      type: [ReactionSchema],
      default: [],
    },
    replyTo: {
      id: { type: String, default: null },
      senderName: { type: String, default: null },
      text: { type: String, default: null },
      mediaType: { type: String, default: null },
    },
    readBy: {
      type: [
        {
          userId: { type: String, required: true },
          userName: { type: String, default: "" },
          readAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    isEdited: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    clearedFor: {
      type: [String],
      default: [],
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    collection: "prime_messages",
  }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, senderId: 1, "readBy.userId": 1 });
MessageSchema.index({ conversationId: 1, clearedFor: 1 });
MessageSchema.index({ conversationId: 1, isPinned: 1 });

if (models.PrimeMessage) {
  delete (models as any).PrimeMessage;
}

const Message = model("PrimeMessage", MessageSchema);
export default Message;
