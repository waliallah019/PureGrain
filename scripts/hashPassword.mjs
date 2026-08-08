// scripts/hashPassword.mjs
//
// Generate an ADMIN_PASSWORD_HASH for .env.local.
// Usage:  node scripts/hashPassword.mjs "your-new-password"
//
// Prints a `scrypt$salt$hash` string compatible with lib/auth/password.ts.

import { scryptSync, randomBytes } from "crypto";

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/hashPassword.mjs "your-new-password"');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);
console.log(`scrypt$${salt.toString("hex")}$${hash.toString("hex")}`);
