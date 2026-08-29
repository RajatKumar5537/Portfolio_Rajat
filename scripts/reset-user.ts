import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import readline from "readline";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env or .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

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

  const client = new MongoClient(uri);

  try {
    console.log("\nConnecting to database...");
    await client.connect();
    
    // Extract db name from connection string or default to 'personal-tracker'
    const dbName = uri.includes("personal-tracker") ? "personal-tracker" : undefined;
    const db = client.db(dbName);
    const usersCollection = db.collection("users");

    // Check if user exists
    const user = await usersCollection.findOne({ email });
    if (!user) {
      console.error(`❌ Error: No user account found with email: ${email}`);
      rl.close();
      await client.close();
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
    await client.close();
  }
}

main();
