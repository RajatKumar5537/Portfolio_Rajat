import mongoose, { Schema, model, models } from "mongoose";
import { encrypt, decrypt } from "../crypto";

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
      get: decrypt,
      set: encrypt,
    },
    amount: {
      type: String,
      required: [true, "Amount is required"],
      get: (val: string) => {
        const decrypted = decrypt(val);
        return parseFloat(decrypted) || 0;
      },
      set: (val: any) => {
        const num = parseFloat(String(val)) || 0;
        if (num < 0) throw new Error("Amount cannot be negative");
        return encrypt(String(num));
      },
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
      get: decrypt,
      set: encrypt,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

// Mongoose cache caching to prevent model re-compilation
const Expense = models.Expense || model("Expense", ExpenseSchema);

export default Expense;
