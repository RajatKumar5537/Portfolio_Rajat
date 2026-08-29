import mongoose, { Schema, model, models } from "mongoose";

const WellnessLogSchema = new Schema(
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
    type: {
      type: String,
      required: [true, "Log type is required (exercise or sleep)"],
      enum: ["exercise", "sleep"],
    },
    // Exercise specific fields
    exercise: {
      activityName: { type: String, trim: true },
      durationMinutes: { type: Number, min: 0 },
      intensity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
      caloriesBurned: { type: Number, min: 0 },
      notes: { type: String, trim: true, default: "" },
    },
    // Sleep specific fields
    sleep: {
      sleepHours: { type: Number, min: 0 },
      sleepQuality: { type: String, enum: ["Poor", "Fair", "Good", "Excellent"], default: "Good" },
      notes: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

const WellnessLog = models.WellnessLog || model("WellnessLog", WellnessLogSchema);

export default WellnessLog;
