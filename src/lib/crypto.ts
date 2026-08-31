import crypto from "crypto";

const ALGORITHM_CBC = "aes-256-cbc";
const ALGORITHM_GCM = "aes-256-gcm";
const PREFIX = "enc:";

// Derives a secure 32-byte key from NEXTAUTH_SECRET if ENCRYPTION_KEY is not defined in env.
const getSecretKey = (): Buffer => {
  if (process.env.ENCRYPTION_KEY) {
    try {
      return Buffer.from(process.env.ENCRYPTION_KEY, "hex");
    } catch {
      // fallback if key is invalid hex
    }
  }
  return crypto.scryptSync(
    process.env.NEXTAUTH_SECRET || "default-fallback-personal-tracker-key-2808",
    "personal-tracker-salt",
    32
  );
};

const SECRET_KEY = getSecretKey();

/* =========================================================
   1. Standard String Field Encryption (Used by Expenses)
   ========================================================= */

export function encrypt(text: string): string {
  if (text === null || text === undefined) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_CBC, SECRET_KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${PREFIX}${iv.toString("hex")}:${encrypted}`;
}

export function decrypt(text: string): string {
  if (!text || typeof text !== "string" || !text.startsWith(PREFIX)) {
    return text; // Return as-is if not encrypted (supports existing plaintext data)
  }
  try {
    const parts = text.substring(PREFIX.length).split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(ALGORITHM_CBC, SECRET_KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption failed:", err);
    return text; // Fallback to raw string
  }
}

export function isEncrypted(text: string): boolean {
  return typeof text === "string" && text.startsWith(PREFIX);
}

/* =========================================================
   2. Secret Chat AES-256-GCM Encryption (Used by Chat)
   ========================================================= */

export interface EncryptedData {
  content: string;
  iv: string;
  authTag: string;
}

export function encryptMessage(text: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM_GCM, SECRET_KEY, iv);
  
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return {
    content: encrypted,
    iv: iv.toString("hex"),
    authTag,
  };
}

export function decryptMessage(data: EncryptedData): string {
  try {
    if (!data.content || !data.iv || !data.authTag) return "";
    const iv = Buffer.from(data.iv, "hex");
    const authTag = Buffer.from(data.authTag, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM_GCM, SECRET_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(data.content, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Failed to decrypt message:", err);
    return "[Encrypted Message - Unable to Decrypt]";
  }
}
