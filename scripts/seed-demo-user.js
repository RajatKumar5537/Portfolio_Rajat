const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Load .env manually
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env");
  process.exit(1);
}

// Crypto helpers matching src/lib/crypto.ts
const ALGORITHM_CBC = "aes-256-cbc";
const PREFIX = "enc:";

const SECRET_KEY = process.env.ENCRYPTION_KEY
  ? Buffer.from(process.env.ENCRYPTION_KEY, "hex")
  : crypto.scryptSync(
      process.env.NEXTAUTH_SECRET || "default-fallback-personal-tracker-key-2808",
      "personal-tracker-salt",
      32
    );

function encrypt(text) {
  if (text === null || text === undefined) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_CBC, SECRET_KEY, iv);
  let encrypted = cipher.update(String(text), "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${PREFIX}${iv.toString("hex")}:${encrypted}`;
}

// Define Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  securityPin: { type: String },
}, { timestamps: true });

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  description: { type: String, required: true },
  amount: { type: String, required: true },
  type: { type: String, required: true, enum: ["Income", "Expense"], default: "Expense" },
  category: { type: String, required: true, default: "Others" },
}, { timestamps: true });

const UserSettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userEmail: { type: String, index: true },
  pfSettings: {
    enabled: { type: Boolean, default: false },
    employeeContribution: { type: Number, default: 0 },
    employerContribution: { type: Number, default: 0 },
    healthInsuranceDeduction: { type: Number, default: 0 },
    initialCorpus: { type: Number, default: 0 },
    startMonth: { type: String, default: "2024-10" },
  },
  categoryBudgets: { type: mongoose.Schema.Types.Mixed, default: {} },
  expenseCategories: { type: [String], default: [] },
  incomeCategories: { type: [String], default: [] },
}, { timestamps: true });

const FoodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  foodName: { type: String, required: true },
  portionGrams: { type: Number, required: true },
  proteinPer100g: { type: Number, required: true },
  calculatedProtein: { type: Number, required: true },
  portion: { type: Number, default: 100 },
  portionUnit: { type: String, default: "Grams" },
  calories: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  isAvoid: { type: Boolean, default: false },
  mealType: { type: String, enum: ["Breakfast", "Lunch", "Dinner", "Snack"], default: "Snack" },
}, { timestamps: true });

const StudyLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  topic: { type: String, required: true },
  durationMinutes: { type: Number, required: true, default: 0 },
  completed: { type: Boolean, default: true },
  objective: { type: String, default: "" },
}, { timestamps: true });

const WellnessLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: Date, required: true, default: Date.now },
  type: { type: String, required: true, enum: ["exercise", "sleep"] },
  exercise: {
    activityName: { type: String },
    durationMinutes: { type: Number },
    intensity: { type: String, enum: ["Low", "Medium", "High"], default: "Medium" },
    caloriesBurned: { type: Number },
    notes: { type: String, default: "" },
  },
  sleep: {
    sleepHours: { type: Number },
    sleepQuality: { type: String, enum: ["Poor", "Fair", "Good", "Excellent"], default: "Good" },
    notes: { type: String },
  },
}, { timestamps: true });

const RoadmapSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  startDate: { type: Date, default: Date.now },
  duration: { type: Number, default: 6 },
  durationUnit: { type: String, enum: ["months", "days"], default: "months" },
  milestones: [{
    id: { type: Number, required: true },
    name: { type: String, required: true },
    desc: { type: String, default: "" }
  }]
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const Expense = mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
const UserSettings = mongoose.models.UserSettings || mongoose.model("UserSettings", UserSettingsSchema);
const FoodLog = mongoose.models.FoodLog || mongoose.model("FoodLog", FoodLogSchema);
const StudyLog = mongoose.models.StudyLog || mongoose.model("StudyLog", StudyLogSchema);
const WellnessLog = mongoose.models.WellnessLog || mongoose.model("WellnessLog", WellnessLogSchema);
const Roadmap = mongoose.models.Roadmap || mongoose.model("Roadmap", RoadmapSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const targetEmail = "kumarrajatpradhan5364@gmail.com".toLowerCase();

  // 1. Find or create user
  let user = await User.findOne({ email: targetEmail });
  if (!user) {
    const hashedPassword = await bcrypt.hash("DemoPassword123!", 12);
    const hashedPin = await bcrypt.hash("1234", 12);
    user = await User.create({
      name: "Rajat Pradhan (Demo)",
      email: targetEmail,
      password: hashedPassword,
      securityPin: hashedPin,
    });
    console.log(`Created user ${targetEmail} with ID: ${user._id}`);
  } else {
    console.log(`Found existing user ${targetEmail} with ID: ${user._id}`);
  }

  const userId = user._id;

  // 2. Clear previous dummy entries for this demo user to avoid duplicate bloat
  await Promise.all([
    Expense.deleteMany({ userId }),
    FoodLog.deleteMany({ userId }),
    StudyLog.deleteMany({ userId }),
    WellnessLog.deleteMany({ userId }),
    Roadmap.deleteMany({ userId }),
    UserSettings.deleteMany({ userId }),
  ]);
  console.log("Cleaned existing data for demo user.");

  // 3. User Settings & PF
  await UserSettings.create({
    userId,
    userEmail: targetEmail,
    pfSettings: {
      enabled: true,
      employeeContribution: 1800,
      employerContribution: 1800,
      healthInsuranceDeduction: 502,
      initialCorpus: 15000,
      startMonth: "2025-01",
    },
    categoryBudgets: {
      "Home": 25000,
      "Delhi Room": 12000,
      "Ajit": 15000,
      "Swarna": 8000,
      "SIP": 5000,
      "Health Insurance": 502,
      "Term Insurance": 1500,
      "Groceries": 7000,
      "Travel": 5000,
      "Others": 6000,
    },
    expenseCategories: [
      "Home",
      "Delhi Room",
      "Ajit",
      "Swarna",
      "SIP",
      "Health Insurance",
      "Term Insurance",
      "Groceries",
      "Travel",
      "Others"
    ],
    incomeCategories: ["Salary", "Bonus", "Freelance", "Investment Returns", "Others"],
  });
  console.log("Created UserSettings & PF configuration.");

  // 4. Generate Expenses & Incomes across 2025 and 2026 (including recent July, August, September 2026)
  const expenseDocs = [];

  // Helper to add encrypted expense
  const addTx = (dateStr, description, amount, category, type = "Expense") => {
    expenseDocs.push({
      userId,
      date: new Date(dateStr),
      description: encrypt(description),
      amount: encrypt(String(amount)),
      category: encrypt(category),
      type,
    });
  };

  // Generate monthly recurring transactions from Jan 2025 to Sep 2026 (21 months)
  const monthsData = [
    // 2025
    { year: 2025, month: 1, salary: 68000, home: 20000, room: 11000, sip: 5000, groceries: 6200, travel: 3200, other: 3500 },
    { year: 2025, month: 2, salary: 68000, home: 21000, room: 11000, sip: 5000, groceries: 5800, travel: 2800, other: 4100 },
    { year: 2025, month: 3, salary: 68000, home: 20000, room: 11000, sip: 5000, groceries: 6400, travel: 4500, other: 3200, bonus: 15000 },
    { year: 2025, month: 4, salary: 70000, home: 22000, room: 11500, sip: 5000, groceries: 6100, travel: 3100, other: 4500 },
    { year: 2025, month: 5, salary: 70000, home: 20000, room: 11500, sip: 5000, groceries: 5900, travel: 3600, other: 3800 },
    { year: 2025, month: 6, salary: 70000, home: 23000, room: 11500, sip: 5000, groceries: 6500, travel: 4200, other: 4000 },
    { year: 2025, month: 7, salary: 70000, home: 21000, room: 11500, sip: 5000, groceries: 6000, travel: 3400, other: 3900 },
    { year: 2025, month: 8, salary: 70000, home: 22000, room: 11500, sip: 5000, groceries: 6300, travel: 3800, other: 4200 },
    { year: 2025, month: 9, salary: 70000, home: 20000, room: 11500, sip: 5000, groceries: 6100, travel: 3500, other: 3700 },
    { year: 2025, month: 10, salary: 72000, home: 24000, room: 12000, sip: 5000, groceries: 6800, travel: 4900, other: 5200, bonus: 20000 },
    { year: 2025, month: 11, salary: 72000, home: 21000, room: 12000, sip: 5000, groceries: 6200, travel: 3600, other: 4100 },
    { year: 2025, month: 12, salary: 72000, home: 22000, room: 12000, sip: 5000, groceries: 6700, travel: 5100, other: 4800 },
    // 2026
    { year: 2026, month: 1, salary: 75000, home: 22000, room: 12000, sip: 5000, groceries: 6300, travel: 3800, other: 4200 },
    { year: 2026, month: 2, salary: 75000, home: 21000, room: 12000, sip: 5000, groceries: 6100, travel: 3400, other: 3900 },
    { year: 2026, month: 3, salary: 75000, home: 23000, room: 12000, sip: 5000, groceries: 6600, travel: 4600, other: 4500, bonus: 25000 },
    { year: 2026, month: 4, salary: 75000, home: 22000, room: 12000, sip: 5000, groceries: 6400, travel: 3900, other: 4100 },
    { year: 2026, month: 5, salary: 75000, home: 24000, room: 12000, sip: 5000, groceries: 6800, travel: 4200, other: 4700 },
    { year: 2026, month: 6, salary: 75000, home: 21000, room: 12000, sip: 5000, groceries: 6200, travel: 3700, other: 3800 },
    { year: 2026, month: 7, salary: 75000, home: 22000, room: 12000, sip: 5000, groceries: 6500, travel: 4100, other: 4400 },
    { year: 2026, month: 8, salary: 75000, home: 23000, room: 12000, sip: 5000, groceries: 6700, travel: 4300, other: 4900 },
    { year: 2026, month: 9, salary: 75000, home: 22000, room: 12000, sip: 5000, groceries: 6400, travel: 3900, other: 4100 },
  ];

  monthsData.forEach(({ year, month, salary, home, room, sip, groceries, travel, other, bonus }) => {
    const mStr = String(month).padStart(2, "0");
    
    // Inflow: Salary
    addTx(`${year}-${mStr}-01`, "Monthly Net Salary Credit", salary, "Salary", "Income");
    if (bonus) {
      addTx(`${year}-${mStr}-15`, "Performance Quarterly Bonus", bonus, "Bonus", "Income");
    }

    // Core Expenses
    addTx(`${year}-${mStr}-02`, "Family & Home Expense Transfer", home, "Home", "Expense");
    addTx(`${year}-${mStr}-03`, "Delhi Room Rent & Maintenance", room, "Delhi Room", "Expense");
    addTx(`${year}-${mStr}-05`, "Nifty 50 Index Mutual Fund SIP", sip, "SIP", "Expense");
    addTx(`${year}-${mStr}-07`, "Monthly Groceries & Supermarket", groceries, "Groceries", "Expense");
    addTx(`${year}-${mStr}-12`, "Metro Card Recharge & Local Commute", travel, "Travel", "Expense");
    addTx(`${year}-${mStr}-18`, "Term Life Insurance Premium (HDFC)", 1500, "Term Insurance", "Expense");
    addTx(`${year}-${mStr}-22`, "Broadband Internet & Mobile Recharge", 1299, "Others", "Expense");
    addTx(`${year}-${mStr}-26`, "Weekend Dining & Cafe with Friends", other - 1299, "Others", "Expense");
  });

  // Recent September 2026 detailed transactions
  addTx("2026-09-02", "Swiggy Food Delivery - Healthy Dinner Bowl", 340, "Others", "Expense");
  addTx("2026-09-03", "Blinkit Quick Groceries - Milk, Oats, Fruits", 460, "Groceries", "Expense");
  addTx("2026-09-04", "Uber Ride - Tech Meetup Gurugram", 380, "Travel", "Expense");
  addTx("2026-09-05", "Freelance UI Consulting Consultation", 8500, "Freelance", "Income");

  await Expense.insertMany(expenseDocs);
  console.log(`Inserted ${expenseDocs.length} encrypted Income/Expense records.`);

  // 5. Food & Nutrition Logs
  const foodLogsData = [
    // Today & recent days
    { date: "2026-09-06", mealType: "Breakfast", foodName: "Rolled Oats with Whey Protein & Berries", portionGrams: 100, proteinPer100g: 28, calories: 380, carbs: 48, fats: 7 },
    { date: "2026-09-06", mealType: "Snack", foodName: "Boiled Eggs (3 whites + 1 whole) with Toast", portionGrams: 150, proteinPer100g: 14, calories: 240, carbs: 16, fats: 9 },
    { date: "2026-09-06", mealType: "Lunch", foodName: "Grilled Paneer with Brown Rice & Broccoli", portionGrams: 280, proteinPer100g: 11, calories: 510, carbs: 54, fats: 18 },
    { date: "2026-09-06", mealType: "Snack", foodName: "Greek Yogurt with Crushed Almonds", portionGrams: 140, proteinPer100g: 12, calories: 190, carbs: 14, fats: 6 },
    { date: "2026-09-06", mealType: "Dinner", foodName: "Yellow Dal Tadka with Paneer Bhurji & 2 Roti", portionGrams: 300, proteinPer100g: 10, calories: 470, carbs: 50, fats: 15 },

    { date: "2026-09-05", mealType: "Breakfast", foodName: "Peanut Butter Banana Toast with Whey Shake", portionGrams: 120, proteinPer100g: 25, calories: 420, carbs: 52, fats: 12 },
    { date: "2026-09-05", mealType: "Lunch", foodName: "Tofu Stir-Fry with Quinoa & Bell Peppers", portionGrams: 260, proteinPer100g: 12, calories: 460, carbs: 48, fats: 14 },
    { date: "2026-09-05", mealType: "Dinner", foodName: "Mixed Dal Khichdi with Curd & Roasted Papad", portionGrams: 320, proteinPer100g: 8, calories: 440, carbs: 62, fats: 10 },

    { date: "2026-09-04", mealType: "Breakfast", foodName: "Egg Omelette (3 Eggs) with Multigrain Toast", portionGrams: 180, proteinPer100g: 15, calories: 360, carbs: 22, fats: 16 },
    { date: "2026-09-04", mealType: "Lunch", foodName: "Rajma Masala with Steamed Basmati Rice & Salad", portionGrams: 300, proteinPer100g: 9, calories: 490, carbs: 68, fats: 11 },
    { date: "2026-09-04", mealType: "Dinner", foodName: "Grilled Soya Chunks with Veggie Pulao", portionGrams: 250, proteinPer100g: 18, calories: 480, carbs: 55, fats: 12 },

    { date: "2026-09-03", mealType: "Breakfast", foodName: "Oatmeal with Almond Milk, Chia Seeds & Banana", portionGrams: 120, proteinPer100g: 18, calories: 390, carbs: 58, fats: 8 },
    { date: "2026-09-03", mealType: "Lunch", foodName: "Palak Paneer with 2 Whole Wheat Rotis", portionGrams: 280, proteinPer100g: 11, calories: 490, carbs: 44, fats: 20 },
    { date: "2026-09-03", mealType: "Dinner", foodName: "Moong Dal Cheela (2 pcs) with Mint Chutney", portionGrams: 200, proteinPer100g: 14, calories: 380, carbs: 42, fats: 10 },
  ];

  const foodDocs = foodLogsData.map(f => ({
    userId,
    date: new Date(f.date),
    foodName: f.foodName,
    portionGrams: f.portionGrams,
    proteinPer100g: f.proteinPer100g,
    calculatedProtein: parseFloat(((f.portionGrams * f.proteinPer100g) / 100).toFixed(2)),
    portion: f.portionGrams,
    portionUnit: "Grams",
    calories: f.calories,
    carbs: f.carbs,
    fats: f.fats,
    mealType: f.mealType,
    isAvoid: false,
  }));

  await FoodLog.insertMany(foodDocs);
  console.log(`Inserted ${foodDocs.length} FoodLog nutrition entries.`);

  // 6. Study & Learning Logs
  const studyData = [
    { date: "2026-09-06", topic: "Next.js 16 App Router & Server Actions Architecture", durationMinutes: 90, objective: "Studied caching layers, on-demand revalidation, and RSC streaming patterns" },
    { date: "2026-09-05", topic: "System Design: Scalable Microservices & Redis Caching", durationMinutes: 75, objective: "Designed distributed cache invalidation and token bucket rate limiters" },
    { date: "2026-09-04", topic: "Advanced TypeScript Generics & Type Gymnastics", durationMinutes: 60, objective: "Practiced mapped types, conditional types, and infer keyword" },
    { date: "2026-09-03", topic: "MongoDB Indexing Strategies & Query Optimization", durationMinutes: 60, objective: "Analyzed explain plans, compound indexes, and aggregation stages" },
    { date: "2026-09-02", topic: "Docker Multi-stage Builds & Alpine Production Setup", durationMinutes: 45, objective: "Minimized container image size and configured non-root security" },
    { date: "2026-09-01", topic: "AWS Cloud: ECS, S3 & CloudFront Distribution", durationMinutes: 80, objective: "Configured CDN caching behaviors and secure S3 presigned URL uploads" },
    { date: "2026-08-30", topic: "PostgreSQL vs MongoDB: ACID vs Document Benchmarks", durationMinutes: 60, objective: "Evaluated replication topologies and distributed transaction locks" },
    { date: "2026-08-28", topic: "Full-Stack Security: OAuth 2.0, JWT & CSRF Mitigation", durationMinutes: 60, objective: "Implemented HttpOnly cookie token rotation and CSRF protection" },
  ];

  const studyDocs = studyData.map(s => ({
    userId,
    date: new Date(s.date),
    topic: s.topic,
    durationMinutes: s.durationMinutes,
    completed: true,
    objective: s.objective,
  }));

  await StudyLog.insertMany(studyDocs);
  console.log(`Inserted ${studyDocs.length} StudyLog entries.`);

  // 7. Wellness Logs (Exercise & Sleep)
  const wellnessData = [
    { date: "2026-09-06", type: "exercise", exercise: { activityName: "Push Day: Bench Press, Incline DB & Triceps", durationMinutes: 65, intensity: "High", caloriesBurned: 420, notes: "Felt strong on barbell press, hit PR on incline dumbbells" } },
    { date: "2026-09-06", type: "sleep", sleep: { sleepHours: 7.5, sleepQuality: "Good", notes: "Consistent sleep schedule, no screen 30m before bed" } },

    { date: "2026-09-05", type: "exercise", exercise: { activityName: "Pull Day: Deadlifts, Lat Pulldowns & Bicep Curls", durationMinutes: 70, intensity: "High", caloriesBurned: 480, notes: "Solid back activation, focused on eccentric contractions" } },
    { date: "2026-09-05", type: "sleep", sleep: { sleepHours: 8.0, sleepQuality: "Excellent", notes: "Deep restorative sleep after heavy workout" } },

    { date: "2026-09-04", type: "exercise", exercise: { activityName: "Leg Day: Barbell Squats, Bulgarian Split Squats", durationMinutes: 60, intensity: "High", caloriesBurned: 460, notes: "High volume leg session, stretched thoroughly after" } },
    { date: "2026-09-04", type: "sleep", sleep: { sleepHours: 7.2, sleepQuality: "Good", notes: "Woke up energized before alarm" } },

    { date: "2026-09-03", type: "exercise", exercise: { activityName: "Morning 5K Outdoor Run & Core Workout", durationMinutes: 40, intensity: "Medium", caloriesBurned: 330, notes: "Maintained steady 5:40 min/km pace around park" } },
    { date: "2026-09-03", type: "sleep", sleep: { sleepHours: 7.8, sleepQuality: "Excellent", notes: "Room kept cool, restful uninterrupted sleep" } },
  ];

  const wellnessDocs = wellnessData.map(w => ({
    userId,
    date: new Date(w.date),
    type: w.type,
    exercise: w.exercise,
    sleep: w.sleep,
  }));

  await WellnessLog.insertMany(wellnessDocs);
  console.log(`Inserted ${wellnessDocs.length} WellnessLog entries.`);

  // 8. Learning Roadmap
  await Roadmap.create({
    userId,
    startDate: new Date("2026-01-01"),
    duration: 12,
    durationUnit: "months",
    milestones: [
      { id: 1, name: "Master Next.js 16 & React Server Components", desc: "RSC data patterns, streaming SSR, Server Actions, middleware and route handlers" },
      { id: 2, name: "Advanced Backend & Database Systems", desc: "MongoDB indexing, Mongoose aggregations, Redis pub/sub caching, and PostgreSQL integration" },
      { id: 3, name: "Cloud Architecture & DevOps with Docker/AWS", desc: "Multi-stage Docker builds, AWS ECS, S3 storage, CloudFront CDN, and CI/CD pipelines" },
      { id: 4, name: "High Scale Distributed System Design", desc: "Microservices design, load balancing, message brokers, WebSockets, and zero-trust security" },
    ]
  });
  console.log("Created Roadmap milestones.");

  console.log("\n========================================================");
  console.log("DEMO DATA SEEDING COMPLETE!");
  console.log(`Demo Account Email: ${targetEmail}`);
  console.log("========================================================\n");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed script error:", err);
  process.exit(1);
});
