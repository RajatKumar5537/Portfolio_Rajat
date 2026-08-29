import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import readline from "readline";
import fs from "fs";
import path from "path";

// Simple manual env file parser to eliminate external dotenv dependency
function loadEnv() {
  const paths = [
    path.resolve(process.cwd(), ".env.local"),
    path.resolve(process.cwd(), ".env")
  ];
  for (const envPath of paths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      content.split("\n").forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
          const firstEquals = trimmed.indexOf("=");
          const key = trimmed.slice(0, firstEquals).trim();
          let val = trimmed.slice(firstEquals + 1).trim();
          // Remove wrapping quotes if present
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    }
  }
}

// Load env files
loadEnv();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function main() {
  console.log("\n=========================================");
  console.log("   PERSONAL DASHBOARD: ACCESS RESET TOOL  ");
  console.log("=========================================\n");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ Error: MONGODB_URI is not defined in your environment (.env or .env.local).");
    rl.close();
    process.exit(1);
  }

  const emailInput = await askQuestion("Enter the email address of the account: ");
  if (!emailInput || !emailInput.includes("@")) {
    console.error("❌ Error: Please enter a valid email address.");
    rl.close();
    process.exit(1);
  }

  const email = emailInput.trim().toLowerCase();

  const newPassword = await askQuestion("Enter new Password (leave blank to keep current): ");
  const newPin = await askQuestion("Enter new 4-to-6 digit Security PIN (leave blank to keep current): ");

  if (!newPassword && !newPin) {
    console.log("ℹ️ No new password or PIN entered. Exiting without making changes.");
    rl.close();
    process.exit(0);
  }

  if (newPin && !/^\d{4,6}$/.test(newPin)) {
    console.error("❌ Error: Security PIN must be a 4-to-6 digit number.");
    rl.close();
    process.exit(1);
  }

  if (newPassword && newPassword.length < 6) {
    console.error("❌ Error: Password must be at least 6 characters long.");
    rl.close();
    process.exit(1);
  }

  try {
    console.log("\nConnecting to database...");
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    if (!db) {
      throw new Error("Could not establish database connection.");
    }
    const usersCollection = db.collection("users");

    // Check if user exists
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.error(`❌ Error: No user account found with email: ${email}`);
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`Found account: "${user.name}"`);

    const updateDoc: any = {};

    if (newPassword) {
      console.log("Hashing new password...");
      updateDoc.password = await bcrypt.hash(newPassword, 12);
    }

    if (newPin) {
      console.log("Hashing new Security PIN...");
      updateDoc.securityPin = await bcrypt.hash(newPin, 12);
    }

    console.log("Saving changes to database...");
    const result = await usersCollection.updateOne(
      { _id: user._id },
      { $set: updateDoc }
    );

    if (result.modifiedCount > 0) {
      console.log("=========================================");
      console.log(" 🎉 SUCCESS: Account access updated successfully!");
      if (newPassword) console.log(" - Password updated successfully.");
      if (newPin) console.log(" - Security PIN updated successfully.");
      console.log("=========================================");
    } else {
      console.log("⚠️ Document was not modified. Please verify inputs.");
    }

  } catch (err: any) {
    console.error("❌ Database connection error:", err.message || err);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

main();
