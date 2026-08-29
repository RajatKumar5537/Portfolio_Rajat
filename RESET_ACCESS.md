# Password & Security PIN Reset Guide
If a user forgets their password or Security PIN, run this command in the project root:
`npx tsx scripts/reset-user.ts`
Follow the interactive prompts to enter the user's email, new password, and new 6-digit PIN.
Ensure your database connection URI is defined in your `.env` or `.env.local` file.
