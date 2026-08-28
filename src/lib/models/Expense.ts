import mongoose, { Schema, model, models } from "mongoose";

const ExpenseSchema = new Schema(
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
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
    },
    type: {
      type: String,
      required: true,
      enum: ["Income", "Expense"],
      default: "Expense",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      default: "Others",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Mongoose cache caching to prevent model re-compilation
const Expense = models.Expense || model("Expense", ExpenseSchema);

export default Expense;
