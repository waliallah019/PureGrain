// scripts/fixAnlineTypo.mjs
//
// Renames the mistyped RawLeatherType "Anline" -> "Semi-Aniline" and re-points
// any RawLeather documents that reference the old spelling, so nothing is left
// orphaned (an unmatched leatherType makes the admin edit form reject the row
// with "Invalid Leather Type selected" and breaks type filtering).
//
// Usage:
//   node scripts/fixAnlineTypo.mjs --dry-run   # report only, no writes
//   node scripts/fixAnlineTypo.mjs             # apply
//
// Re-run safe: if "Semi-Aniline" already exists the duplicate "Anline" record
// is removed instead of renamed (the unique index would reject a rename).

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const OLD = "Anline";
const NEW = "Semi-Aniline";

const dryRun = process.argv.includes("--dry-run");

async function run() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set");
    process.exit(1);
  }
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  const types = db.collection("rawleathertypes");
  const hides = db.collection("rawleathers");

  const oldType = await types.findOne({ name: OLD });
  const newType = await types.findOne({ name: NEW });
  const affected = await hides.countDocuments({ leatherType: OLD });

  console.log(`mode              : ${dryRun ? "DRY RUN (no writes)" : "APPLY"}`);
  console.log(`type "${OLD}"      : ${oldType ? "found (" + oldType._id + ")" : "not found"}`);
  console.log(`type "${NEW}": ${newType ? "already exists (" + newType._id + ")" : "does not exist"}`);
  console.log(`hides using "${OLD}": ${affected}`);

  if (!oldType && affected === 0) {
    console.log("\nNothing to do — already fixed.");
    await mongoose.disconnect();
    return;
  }

  if (dryRun) {
    console.log("\nWould:");
    if (oldType && !newType) console.log(`  - rename type "${OLD}" -> "${NEW}"`);
    if (oldType && newType) console.log(`  - delete duplicate type "${OLD}" (target already exists)`);
    if (affected) console.log(`  - update ${affected} hide(s) leatherType "${OLD}" -> "${NEW}"`);
    await mongoose.disconnect();
    return;
  }

  // Re-point the hides FIRST so no document is ever left pointing at a
  // type name that no longer exists.
  if (affected > 0) {
    const r = await hides.updateMany({ leatherType: OLD }, { $set: { leatherType: NEW } });
    console.log(`\nupdated hides   : ${r.modifiedCount}`);
  }

  if (oldType && newType) {
    await types.deleteOne({ _id: oldType._id });
    console.log(`removed duplicate type "${OLD}"`);
  } else if (oldType) {
    await types.updateOne({ _id: oldType._id }, { $set: { name: NEW } });
    console.log(`renamed type    : "${OLD}" -> "${NEW}"`);
  }

  // Verify
  const stillOld = await hides.countDocuments({ leatherType: OLD });
  const nowNew = await hides.countDocuments({ leatherType: NEW });
  const typeNames = (await types.find({}).toArray()).map((t) => t.name).sort();
  console.log(`\nverify: hides still "${OLD}" = ${stillOld} (want 0)`);
  console.log(`verify: hides now "${NEW}"   = ${nowNew}`);
  console.log(`verify: types = ${typeNames.join(", ")}`);

  await mongoose.disconnect();
}

run().catch((e) => {
  console.error("failed:", e.message);
  process.exit(1);
});
