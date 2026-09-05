import mongoose, { Schema, model, models } from "mongoose";

const UserSettingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    pfSettings: {
      enabled: { type: Boolean, default: false },
      employeeContribution: { type: Number, default: 0 },
      employerContribution: { type: Number, default: 0 },
      healthInsuranceDeduction: { type: Number, default: 0 },
      initialCorpus: { type: Number, default: 0 },
      startMonth: { type: String, default: "2024-01" },
    },
    categoryBudgets: {
      type: Schema.Types.Mixed,
      default: {},
    },
    expenseCategories: {
      type: [String],
      default: [],
    },
    incomeCategories: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const UserSettings = models.UserSettings || model("UserSettings", UserSettingsSchema);

export default UserSettings;
