import mongoose, { Schema, model, models } from "mongoose";

const UserSettingsSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userEmail: {
      type: String,
      index: true,
    },
    pfSettings: {
      enabled: { type: Boolean, default: false },
      employeeContribution: { type: Number, default: 0 },
      employerContribution: { type: Number, default: 0 },
      healthInsuranceDeduction: { type: Number, default: 0 },
      initialCorpus: { type: Number, default: 0 },
      startMonth: { type: String, default: "2024-10" },
      pfPeriods: {
        type: [
          new Schema(
            { from: String, to: String, employee: Number, employer: Number },
            { _id: false }
          ),
        ],
        default: [],
      },
      healthPeriods: {
        type: [new Schema({ from: String, to: String, amount: Number }, { _id: false })],
        default: [],
      },
      termPeriods: {
        type: [new Schema({ from: String, to: String, amount: Number }, { _id: false })],
        default: [],
      },
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

if (models.UserSettings) {
  delete models.UserSettings;
}

const UserSettings = model("UserSettings", UserSettingsSchema);

export default UserSettings;
