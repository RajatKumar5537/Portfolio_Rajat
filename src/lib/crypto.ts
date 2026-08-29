import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
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

export function encrypt(text: string): string {
  if (text === null || text === undefined) return "";
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
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
    const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
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
