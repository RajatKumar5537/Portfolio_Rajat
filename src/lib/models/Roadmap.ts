import mongoose, { Schema, model, models } from "mongoose";

const MilestoneSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true, trim: true },
  desc: { type: String, default: "", trim: true }
});

const RoadmapSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    startDate: {
      type: Date,
      default: () => new Date("2026-08-25T00:00:00")
    },
    duration: {
      type: Number,
      default: 6
    },
    durationUnit: {
      type: String,
      enum: ["months", "days"],
      default: "months"
    },
    milestones: [MilestoneSchema]
  },
  {
    timestamps: true
  }
);

const Roadmap = models.Roadmap || model("Roadmap", RoadmapSchema);

export default Roadmap;
