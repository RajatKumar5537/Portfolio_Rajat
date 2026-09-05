export interface FoodItem {
  name: string;
  defaultUnit: string;        // Grams, ml, Spoons, Slices, Qty, Serving, Bowl, Plate
  defaultSize: number;        // e.g. 100, 15, 1
  gramsEquivalent: number;    // how many grams does 1 unit represent, for database compatibility
  proteinPerBase: number;     // protein in defaultSize
  carbsPerBase: number;       // carbs in defaultSize
  fatsPerBase: number;        // fats in defaultSize
  caloriesPerBase: number;    // calories in defaultSize
  isAvoid?: boolean;
}

export const foodDictionary: FoodItem[] = [
  // Breakfast & Daily Routine Items
  { name: "Milk (₹10 Daily / ~200ml)", defaultUnit: "Pouch", defaultSize: 1, gramsEquivalent: 200, proteinPerBase: 6.4, carbsPerBase: 9.6, fatsPerBase: 6, caloriesPerBase: 120 },
  { name: "Milk (Weekend 500ml)", defaultUnit: "Pouch", defaultSize: 1, gramsEquivalent: 500, proteinPerBase: 16, carbsPerBase: 24, fatsPerBase: 15, caloriesPerBase: 300 },
  { name: "Milk (Toned / Standard)", defaultUnit: "ml", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 3.2, carbsPerBase: 4.8, fatsPerBase: 3, caloriesPerBase: 60 },
  { name: "Milk (Glass / 250ml)", defaultUnit: "Glass", defaultSize: 1, gramsEquivalent: 250, proteinPerBase: 8, carbsPerBase: 12, fatsPerBase: 7.5, caloriesPerBase: 150 },
  { name: "Sattu Powder", defaultUnit: "Spoons", defaultSize: 1, gramsEquivalent: 15, proteinPerBase: 3, carbsPerBase: 10, fatsPerBase: 0.9, caloriesPerBase: 60 },
  { name: "Khajoor (Dates)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 10, proteinPerBase: 0.2, carbsPerBase: 7.5, fatsPerBase: 0, caloriesPerBase: 28 },
  { name: "Kaju (Cashew)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 1.5, proteinPerBase: 0.3, carbsPerBase: 0.5, fatsPerBase: 0.7, caloriesPerBase: 8 },
  { name: "Almond (Badam)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 1.2, proteinPerBase: 0.25, carbsPerBase: 0.25, fatsPerBase: 0.6, caloriesPerBase: 7 },
  { name: "Banana", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 120, proteinPerBase: 1.3, carbsPerBase: 27, fatsPerBase: 0.4, caloriesPerBase: 105 },
  { name: "Poha", defaultUnit: "Plate", defaultSize: 1, gramsEquivalent: 150, proteinPerBase: 4, carbsPerBase: 45, fatsPerBase: 6, caloriesPerBase: 250 },
  { name: "Boiled Egg", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 50, proteinPerBase: 6, carbsPerBase: 0.6, fatsPerBase: 5, caloriesPerBase: 78 },
  { name: "Egg White", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 33, proteinPerBase: 3.6, carbsPerBase: 0.2, fatsPerBase: 0.1, caloriesPerBase: 17 },
  { name: "Omelette (1 Egg)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 60, proteinPerBase: 6.5, carbsPerBase: 0.8, fatsPerBase: 7, caloriesPerBase: 95 },
  { name: "Oats", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 150, proteinPerBase: 6.5, carbsPerBase: 32, fatsPerBase: 3.5, caloriesPerBase: 190 },

  // Meals & Veg/Non-Veg (Base 100g)
  { name: "Paneer (Cottage Cheese)", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 18, carbsPerBase: 4, fatsPerBase: 22, caloriesPerBase: 290 },
  { name: "Chicken Roll", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 200, proteinPerBase: 22, carbsPerBase: 45, fatsPerBase: 15, caloriesPerBase: 400 },
  { name: "Beetroot", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 1.6, carbsPerBase: 10, fatsPerBase: 0.2, caloriesPerBase: 43 },
  { name: "Gajar (Carrot)", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 0.9, carbsPerBase: 10, fatsPerBase: 0.2, caloriesPerBase: 41 },
  { name: "Capsicum", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 0.9, carbsPerBase: 4.6, fatsPerBase: 0.2, caloriesPerBase: 20 },
  { name: "Broccoli", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 2.8, carbsPerBase: 7, fatsPerBase: 0.4, caloriesPerBase: 34 },
  { name: "Grilled Chicken", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 28, carbsPerBase: 0, fatsPerBase: 7, caloriesPerBase: 180 },
  { name: "Chicken Breast (Cooked)", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 31, carbsPerBase: 0, fatsPerBase: 3.6, caloriesPerBase: 165 },
  { name: "KFC Chicken Leg Piece (Drumstick)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 70, proteinPerBase: 14, carbsPerBase: 4, fatsPerBase: 10, caloriesPerBase: 160 },
  { name: "KFC Chicken Breast (Fried)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 170, proteinPerBase: 35, carbsPerBase: 11, fatsPerBase: 21, caloriesPerBase: 390 },
  { name: "Rice (Bowl)", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 150, proteinPerBase: 4, carbsPerBase: 44, fatsPerBase: 0.5, caloriesPerBase: 200 },
  { name: "Dal (Plain Cooked)", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 200, proteinPerBase: 8, carbsPerBase: 24, fatsPerBase: 2, caloriesPerBase: 150 },

  // Odisha Traditional Foods
  { name: "Dalma (Odisha Lentil Stew)", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 250, proteinPerBase: 7, carbsPerBase: 25, fatsPerBase: 2, caloriesPerBase: 150 },
  { name: "Pakhala Bhata (Fermented Rice)", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 300, proteinPerBase: 4.5, carbsPerBase: 42, fatsPerBase: 3, caloriesPerBase: 220 },
  { name: "Machha Besara (Fish Curry)", defaultUnit: "Serving", defaultSize: 1, gramsEquivalent: 150, proteinPerBase: 22, carbsPerBase: 6, fatsPerBase: 14, caloriesPerBase: 240 },
  { name: "Rohu Fish Curry", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 18, carbsPerBase: 2, fatsPerBase: 7, caloriesPerBase: 140 },
  { name: "Rohu Fish Fried", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 19, carbsPerBase: 1, fatsPerBase: 12, caloriesPerBase: 200 },
  { name: "Chena Poda (Cheese Sweet)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 50, proteinPerBase: 5, carbsPerBase: 22, fatsPerBase: 4.5, caloriesPerBase: 150 },
  { name: "Santula (Odisha Veg Stew)", defaultUnit: "Bowl", defaultSize: 1, gramsEquivalent: 200, proteinPerBase: 2, carbsPerBase: 15, fatsPerBase: 1.5, caloriesPerBase: 80 },
  { name: "Saga Bhaja (Fried Greens)", defaultUnit: "Grams", defaultSize: 100, gramsEquivalent: 1, proteinPerBase: 3, carbsPerBase: 8, fatsPerBase: 6, caloriesPerBase: 90 },

  // Avoid Items (Ice creams)
  { name: "Amul Cookie Crunch Cone", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 120, proteinPerBase: 3.5, carbsPerBase: 28, fatsPerBase: 13, caloriesPerBase: 240, isAvoid: true },
  { name: "Amul Tricone Chocolate Cone (50 Rs)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 120, proteinPerBase: 4, carbsPerBase: 34, fatsPerBase: 14, caloriesPerBase: 280, isAvoid: true },
  { name: "Butterscotch Ice Cream (Cup)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 100, proteinPerBase: 3.5, carbsPerBase: 24, fatsPerBase: 10, caloriesPerBase: 200, isAvoid: true },
  { name: "Vanilla Ice Cream (Cup)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 100, proteinPerBase: 3.5, carbsPerBase: 22, fatsPerBase: 9, caloriesPerBase: 180, isAvoid: true },
  { name: "Amul Rajbhog Ice Cream (Cup)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 100, proteinPerBase: 4, carbsPerBase: 26, fatsPerBase: 12, caloriesPerBase: 230, isAvoid: true },
  { name: "Kulfi Ice Cream (Stick)", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 70, proteinPerBase: 4, carbsPerBase: 22, fatsPerBase: 11, caloriesPerBase: 200, isAvoid: true },
  { name: "Standard Ice Cream Cone", defaultUnit: "Qty", defaultSize: 1, gramsEquivalent: 100, proteinPerBase: 3.5, carbsPerBase: 24, fatsPerBase: 10, caloriesPerBase: 200, isAvoid: true }
];
