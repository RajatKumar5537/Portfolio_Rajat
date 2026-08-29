import mongoose, { Schema, model, models } from "mongoose";

const FoodLogSchema = new Schema(
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
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
    },
    portionGrams: {
      type: Number,
      required: [true, "Portion size in grams is required"],
      min: [0, "Portion size cannot be negative"],
    },
    proteinPer100g: {
      type: Number,
      required: [true, "Protein content per 100g is required"],
      min: [0, "Protein content cannot be negative"],
    },
    calculatedProtein: {
      type: Number,
      required: true,
      min: [0, "Calculated protein cannot be negative"],
    },
    portion: {
      type: Number,
      required: true,
      min: [0, "Portion cannot be negative"],
      default: 100,
    },
    portionUnit: {
      type: String,
      required: true,
      default: "Grams",
    },
    calories: {
      type: Number,
      required: true,
      min: [0, "Calories cannot be negative"],
      default: 0,
    },
    carbs: {
      type: Number,
      required: true,
      min: [0, "Carbs cannot be negative"],
      default: 0,
    },
    fats: {
      type: Number,
      required: true,
      min: [0, "Fats cannot be negative"],
      default: 0,
    },
    isAvoid: {
      type: Boolean,
      default: false,
    },
    mealType: {
      type: String,
      required: [true, "Meal type is required"],
      enum: ["Breakfast", "Lunch", "Dinner", "Snack"],
      default: "Snack",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate protein before saving the document
FoodLogSchema.pre("validate", function (next) {
  if (this.portionGrams !== undefined && this.proteinPer100g !== undefined) {
    this.calculatedProtein = parseFloat(
      ((this.portionGrams * this.proteinPer100g) / 100).toFixed(2)
    );
  }
  next();
});

const FoodLog = models.FoodLog || model("FoodLog", FoodLogSchema);

export default FoodLog;
