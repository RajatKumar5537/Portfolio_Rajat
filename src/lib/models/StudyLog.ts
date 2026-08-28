import mongoose, { Schema, model, models } from "mongoose";

const StudyLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: [true, "Duration is required"],
      min: [0, "Duration cannot be negative"],
      default: 0,
    },
    completed: {
      type: Boolean,
      default: true,
    },
    objective: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const StudyLog = models.StudyLog || model("StudyLog", StudyLogSchema);

export default StudyLog;
