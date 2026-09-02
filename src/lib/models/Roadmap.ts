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
      default: () => new Date()
    },
    duration: {
      type: Number,
      default: 1
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
