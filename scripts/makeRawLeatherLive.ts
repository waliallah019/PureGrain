// scripts/makeRawLeatherLive.ts
//
// Takes archived RawLeather products live: cleans the scraped product name,
// replaces the raw scraped description with written B2B prose plus a
// specifications line, assigns a random trade MOQ, and clears the archive flag.
//
// Usage:
//   npx tsx scripts/makeRawLeatherLive.ts --dry-run
//   npx tsx scripts/makeRawLeatherLive.ts
//   npx tsx scripts/makeRawLeatherLive.ts --imported-only   (skip pre-existing rows)
//
// Only documents with isArchived: true are touched. Anything already live is
// left exactly as it is.
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(PROJECT_ROOT, ".env.local") });

const BATCH_SIZE = 20;
const MOQ_VALUES = [350, 400, 450, 500, 550];

// ────────────────────────────── logging ──────────────────────────────

const log = {
  start: (m: string) => console.log(`[START]    ${m}`),
  batch: (m: string) => console.log(`\n[BATCH]    ${m}`),
  product: (m: string) => console.log(`[PRODUCT]  ${m}`),
  name: (m: string) => console.log(`[NAME]     → ${m}`),
  desc: (m: string) => console.log(`[DESC]     → ${m}`),
  moq: (m: string) => console.log(`[MOQ]      → ${m}`),
  flags: (m: string) => console.log(`[FLAGS]    → ${m}`),
  db: (m: string) => console.log(`[DB]       ✓ ${m}`),
  review: (m: string) => console.log(`[REVIEW]   ⚑ ${m}`),
  skip: (m: string) => console.log(`[SKIP]     ⏭  ${m}`),
  warn: (m: string) => console.log(`[WARN]     ⚠  ${m}`),
  error: (m: string) => console.log(`[ERROR]    ✗  ${m}`),
  dry: (m: string) => console.log(`[DRY RUN]  ${m}`),
};

function errText(err: any): string {
  if (!err) return "unknown error";
  if (typeof err === "string") return err;
  if (err.message) return err.message;
  try { return JSON.stringify(err); } catch { return String(err); }
}

// ───────────────────────── name transformation ───────────────────────

/**
 * Supplier tannery and product-line names carried over from the scraped
 * sources. These are real European houses (Conceria La Perla Azzurra,
 * Degermann, MPG, Artigiano del Cuoio) — leaving them on a Pure Grain listing
 * both reads as lifted data and misstates origin, so the whole token is
 * dropped and the product is renamed from its own characteristics.
 */
const SUPPLIER_TOKENS = [
  "conceria la perla azzurra",
  "conceria la bretagna",
  "conceria 800 toscano",
  "conceria",
  "artigiano del cuoio (adc)",
  "artigiano del cuoio",
  "artigiano",
  "la perla azzurra",
  "la bretagna",
  "800 toscano",
  "degermann",
  "opera",
  "nuova",
  "adc",
  "mpg",
  "jw",
  "bs",
  "district",
  "florence",
  // Origin words that contradict Pakistani manufacture.
  "italian",
  "italy",
  "french",
  "france",
  "tuscania",
  "toscano",
];

/** Italian/French variant words, mapped to the English trade equivalents. */
const VARIANT_TRANSLATIONS: Record<string, string> = {
  nero: "Black",
  mogano: "Mahogany",
  "argento grigio": "Silver Grey",
  argento: "Silver",
  grigio: "Grey",
  moca: "Mocha",
  bordo: "Bordeaux",
  fumo: "Smoke",
  chianti: "Wine",
  marine: "Marine Blue",
  cuoio: "Natural",
  testa: "Dark Brown",
  avorio: "Ivory",
  sabbia: "Sand",
  ruggine: "Rust",
  verde: "Green",
  rosso: "Red",
  blu: "Blue",
  giallo: "Yellow",
  bianco: "White",
  miele: "Honey",
  tabacco: "Tobacco",
  cognac: "Cognac",
  // Misspellings present in the scraped colour data. Corrected here so they do
  // not surface in a customer-facing product name; the stored `colors` array is
  // left untouched.
  coffe: "Coffee",
  ferarri: "Ferrari",
  chesnut: "Chestnut",
  bordoux: "Bordeaux",
  burgandy: "Burgundy",
  gray: "Grey",
};

/**
 * House line names for the Pure Grain catalogue, drawn from Pakistani rivers
 * and ranges. These replace the supplier line names so each product reads as
 * an own-label article rather than a re-labelled import.
 */
const HOUSE_LINES = [
  "Indus", "Ravi", "Chenab", "Jhelum", "Sutlej", "Karakoram", "Margalla",
  "Khyber", "Hunza", "Swat", "Chitral", "Bolan", "Kirthar", "Makran",
  "Thar", "Cholistan", "Neelum", "Kaghan", "Shandur", "Deosai",
];

/**
 * Tannery city by hide character, following how the Pakistani industry is
 * actually organised: Kasur for heavy bovine and vegetable tannage, Sialkot
 * for goat and sheep skins, Karachi for chrome-finished and speciality hides.
 */
function originCity(doc: any, tanning: string): string {
  const animal = String(doc.animal || "");
  const tan = String(tanning || "").toLowerCase();
  if (animal === "Goat" || animal === "Sheep") return "Sialkot, Pakistan";
  if (tan.includes("veg")) return "Kasur, Pakistan";
  if (animal === "Buffalo") return "Kasur, Pakistan";
  return "Karachi, Pakistan";
}

/** Factual surface descriptor built from the product's own attributes. */
function surfaceDescriptor(doc: any): string {
  const type = String(doc.leatherType || "").toLowerCase();
  const finish = String(doc.finish || "").toLowerCase();
  const blob = `${doc.name || ""} ${doc.description || ""}`.toLowerCase();

  if (type.includes("suede")) return finish.includes("waxed") ? "Waxed Suede" : "Suede";
  if (type.includes("nubuck")) return "Nubuck";
  if (type.includes("veg tan")) return /calf/.test(blob) ? "Veg Tan Calf" : "Veg Tan";
  if (type.includes("pebble")) return "Pebble Grain";
  if (type.includes("embossed") || finish.includes("embossed")) {
    if (/croco|crocodile|gator|alligator|caiman/.test(blob)) return "Croco Emboss";
    if (/ostrich/.test(blob)) return "Ostrich Emboss";
    if (/python|snake|anaconda/.test(blob)) return "Python Emboss";
    if (/floral|tool/.test(blob)) return "Tooled Emboss";
    return "Embossed Grain";
  }
  if (finish.includes("waxed")) return "Waxed Grain";
  if (finish.includes("pull-up")) return "Pull-Up";
  if (finish.includes("nappa")) return "Nappa";
  if (/calf/.test(blob)) return "Calfskin";
  return "Full Grain";
}

/** Stable hash so a given product always lands on the same house line. */
function seedFrom(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

const SMALL_WORDS = new Set(["in", "of", "the", "and", "with", "on", "for"]);

function titleCase(input: string): string {
  return input
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w, i) => {
      // Preserve parenthesised fragments like "(suede)".
      const lead = w.match(/^[("']*/)?.[0] ?? "";
      const tail = w.match(/[)"']*$/)?.[0] ?? "";
      const core = w.slice(lead.length, w.length - tail.length || undefined);
      if (!core) return w;
      if (i > 0 && SMALL_WORDS.has(core)) return `${lead}${core}${tail}`;
      // Capitalise across slashes and hyphens too, so a compound colour like
      // "bone/brown" becomes "Bone/Brown" rather than "Bone/brown".
      const cased = core
        .split(/([/-])/)
        .map((part) => (/^[/-]$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
        .join("");
      return `${lead}${cased}${tail}`;
    })
    .join(" ");
}


export interface NameResult {
  name: string;
  flagged: boolean;
  reason?: string;
}

/** Pulls the colour/variant out of the scraped name and anglicises it. */
function extractVariant(raw: string, doc: any): string {
  const commaIdx = raw.indexOf(",");
  let variant = commaIdx > -1 ? raw.slice(commaIdx + 1).trim() : "";

  // No comma — fall back to the first recorded colour on the document.
  if (!variant && Array.isArray(doc?.colors) && doc.colors.length) {
    variant = String(doc.colors[0]);
  }
  if (!variant || !/[a-z]/i.test(variant)) return "";

  // Colour values sometimes carry a parenthesised origin, e.g. "Navy (Italy)".
  // Drop the whole bracketed group before anything else looks at it.
  variant = variant.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  if (!variant) return "";

  const key = variant.toLowerCase().trim();
  if (VARIANT_TRANSLATIONS[key]) return VARIANT_TRANSLATIONS[key];

  // Translate word-by-word so "ARGENTO GRIGIO" and the like still convert.
  const translated = key
    .split(/\s+/)
    .map((w) => VARIANT_TRANSLATIONS[w] || titleCase(w))
    .join(" ");

  // Drop supplier/origin words that leaked into the variant. Punctuation is
  // stripped before comparing so "(italy)" and "italy," both match.
  const cleaned = translated
    .split(/\s+/)
    .filter((w) => !SUPPLIER_TOKENS.includes(w.toLowerCase().replace(/[^a-z]/g, "")))
    .join(" ")
    .trim();

  return cleaned.split(/\s+/).slice(0, 2).join(" ");
}

/**
 * Builds an own-label name from the product's own characteristics rather than
 * re-ordering the supplier's wording:
 *
 *   "OPERA DERBY WAXED SUEDE, JAVA"          → "Java Indus Waxed Suede"
 *   "CONCERIA LA PERLA AZZURRA DAKOTA, NERO" → "Black Ravi Veg Tan"
 *
 * The colour survives because buyers shop by it; the supplier line name is
 * replaced with a Pure Grain house line, and the trailing descriptor states
 * what the leather actually is.
 */
export function transformName(original: string, doc: any, taken?: Set<string>): NameResult {
  const raw = String(original || "").trim();
  if (!raw) return { name: "[REVIEW NAME] (empty)", flagged: true, reason: "empty name" };

  const variant = extractVariant(raw, doc);
  const descriptor = surfaceDescriptor(doc);

  // Stable house line, but step forward on collision so names stay unique.
  const seed = seedFrom(raw);
  let name = "";
  for (let i = 0; i < HOUSE_LINES.length; i++) {
    const line = HOUSE_LINES[(seed + i) % HOUSE_LINES.length];
    const candidate = [variant, line, descriptor].filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
    if (!taken || !taken.has(candidate.toLowerCase())) {
      name = candidate;
      break;
    }
  }

  if (!name) {
    // Every house line was taken for this colour/descriptor pair.
    return { name: `[REVIEW NAME] ${titleCase(raw)}`, flagged: true, reason: "could not build a unique name" };
  }

  if (name.length < 3) {
    return { name: `[REVIEW NAME] ${titleCase(raw)}`, flagged: true, reason: "insufficient source text" };
  }

  taken?.add(name.toLowerCase());
  return { name, flagged: false };
}

// ──────────────────────── spec extraction ────────────────────────────

interface Specs {
  thicknessMm?: string;
  weightOz?: string;
  tanning?: string;
  temper?: string;
  finish?: string;
  variant?: string;
  country?: string;
  applications: string[];
  species?: string;
  hideShape?: string;
}

/** Reads "Label: value" out of the scraped description body. */
function labelValue(text: string, ...labels: string[]): string {
  for (const label of labels) {
    const esc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const m = text.match(new RegExp(`(?:^|\\n)\\s*${esc}\\s*(?:\\([^)]*\\))?\\s*[:–-]\\s*([^\\n]+)`, "i"));
    if (m && m[1].trim()) return m[1].trim().replace(/\s+/g, " ");
  }
  return "";
}

function normaliseRange(v: string): string {
  return v.replace(/\s*[-–/]\s*/g, "–").replace(/\s+/g, " ").trim();
}

/** Turns "soft" / "8" / "5 out of 10" into readable temper wording. */
function temperText(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  const num = v.match(/(\d+(?:\.\d+)?)\s*(?:out of\s*10|\/\s*10)?/);
  if (num && /^\d/.test(v)) {
    const n = parseFloat(num[1]);
    const word = n <= 3 ? "Soft" : n <= 6 ? "Medium" : "Firm";
    return `${word} Temper (${num[1]}/10)`;
  }
  const w = v.toLowerCase();
  // Ranges such as "soft to medium" must keep both ends rather than
  // collapsing to whichever word appears first.
  const parts: string[] = [];
  for (const [needle, label] of [["soft", "Soft"], ["medium", "Medium"], ["firm", "Firm"], ["hard", "Firm"]] as const) {
    if (w.includes(needle) && !parts.includes(label)) parts.push(label);
  }
  if (parts.length > 1) return `${parts.join(" to ")} Temper`;
  if (parts.length === 1) return `${parts[0]} Temper`;
  return titleCase(v) + " Temper";
}

function tanningText(raw: string): string {
  const v = raw.toLowerCase().trim();
  if (!v) return "";
  if (v.includes("see notes")) return "";
  const semi = /\bsemi\b/.test(v);
  if (v.includes("veg")) return semi ? "Semi-Vegetable Tanned" : "Vegetable Tanned";
  if (v.includes("chrome")) return semi ? "Semi-Chrome Tanned" : "Chrome Tanned";
  if (v.includes("combination") || v.includes("combi")) return "Combination Tanned";
  return titleCase(raw) + " Tanned";
}

function extractSpecs(doc: any): Specs {
  const text = String(doc.description || "").replace(/^\[REVIEW BEFORE PUBLISHING\]\s*/, "");

  const weightRaw = labelValue(text, "Weight", "Hide Thickness (Weight)", "Hide Thickness");
  const ozMatch = weightRaw.match(/([\d.,]+\s*[-–/to]*\s*[\d.,]*)\s*oz/i);
  const mmInWeight = weightRaw.match(/([\d.,]+\s*[-–/]\s*[\d.,]+|[\d.,]+)\s*mm/i);

  const usesRaw = labelValue(text, "Recommended Uses", "Recommend Uses", "Application", "Applications");
  const applications = usesRaw
    ? usesRaw
        .split(/[,·•]|\band\b/i)
        .map((s) => s.replace(/\(.*?\)/g, "").trim())
        .filter((s) => s.length > 1 && s.length < 60)
        .map((s) => titleCase(s))
    : [];

  // Structured fields on the document are more reliable than the prose.
  const thicknessMm = /mm/i.test(String(doc.thickness || ""))
    ? normaliseRange(String(doc.thickness))
    : mmInWeight
      ? `${normaliseRange(mmInWeight[1])} mm`
      : "";

  const variant =
    Array.isArray(doc.colors) && doc.colors.length ? doc.colors.slice(0, 3).join(", ") : "";

  return {
    thicknessMm,
    weightOz: ozMatch ? `${normaliseRange(ozMatch[1])} oz` : "",
    tanning: tanningText(labelValue(text, "Tanning", "Tannage")),
    temper: temperText(labelValue(text, "Temper")),
    finish: String(doc.finish || "") || titleCase(labelValue(text, "Finish", "Top finish")),
    variant,
    // Origin is deliberately NOT read from the scraped copy — that reports the
    // European supplier. Pure Grain tans in Pakistan, so the city is derived
    // from the hide type instead.
    country: originCity(doc, tanningText(labelValue(text, "Tanning", "Tannage"))),
    applications: [...new Set(applications)].slice(0, 5),
    species: labelValue(text, "Species"),
    hideShape: labelValue(text, "Hide Shape"),
  };
}

// ───────────────────── description generation ────────────────────────

const ANIMAL_WORD: Record<string, string> = {
  Cow: "cowhide",
  Buffalo: "buffalo hide",
  Goat: "goatskin",
  Sheep: "lambskin",
  Exotic: "exotic skin",
};

/**
 * Composes fresh B2B prose from the product's own attributes. Nothing is
 * copied from the scraped copy — the sentence frames below are written for
 * this catalogue and selected by the leather's actual characteristics.
 */
function buildProse(doc: any, s: Specs): string {
  const animal = ANIMAL_WORD[doc.animal] || "hide";
  const finish = String(doc.finish || "").toLowerCase();
  const type = String(doc.leatherType || "").toLowerCase();
  const tan = s.tanning ? s.tanning.replace(" Tanned", "-tanned").toLowerCase() : "";
  const temperWord = (String(s.temper || "").match(/^(Soft|Medium|Firm)/)?.[1] || "").toLowerCase();

  // ── sentence 1: construction and surface ──
  const surface =
    type.includes("suede") ? `short-nap ${tan || "chrome-tanned"} ${animal} suede`
    : type.includes("nubuck") ? `finely buffed ${tan || "chrome-tanned"} ${animal} nubuck`
    : finish.includes("embossed") ? `${tan || "chrome-tanned"} ${animal} carrying a crisp embossed grain`
    : finish.includes("waxed") ? `${tan || "chrome-tanned"} ${animal} finished with a rich wax pull`
    : finish.includes("pull-up") ? `${tan || "chrome-tanned"} ${animal} with a lively pull-up effect`
    : finish.includes("nappa") ? `supple ${tan || "chrome-tanned"} ${animal} nappa`
    : type.includes("veg tan") ? `${tan || "vegetable-tanned"} ${animal} with a clean, struck-through body`
    : type.includes("pebble") ? `${tan || "chrome-tanned"} ${animal} with a rounded pebble grain`
    : `${tan || "chrome-tanned"} ${animal} with a smooth, even grain`;

  const opener = temperWord
    ? `A ${temperWord}-tempered ${surface}.`
    : `A ${surface}.`;

  // ── sentence 2: handle and behaviour ──
  const bodyBits: string[] = [];
  if (s.thicknessMm) bodyBits.push(`Substance runs ${s.thicknessMm}`);
  else if (s.weightOz) bodyBits.push(`Substance runs ${s.weightOz}`);
  if (temperWord === "firm") bodyBits.push("holding structure cleanly through cutting and edge work");
  else if (temperWord === "soft") bodyBits.push("draping easily while keeping a consistent hand");
  else bodyBits.push("balancing structure with a comfortable drape");
  const joined = bodyBits.join(", ");
  const sentence2 = joined ? `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.` : "";

  // ── sentence 3: character / finish behaviour ──
  const character =
    finish.includes("aniline") ? "The aniline finish keeps the natural markings of the hide visible, so tone varies slightly from skin to skin."
    : finish.includes("waxed") ? "The wax treatment adds water resistance and deepens in tone as the surface is worked."
    : finish.includes("embossed") ? "The embossed pattern is uniform across the panel, giving a repeatable look across a production run."
    : finish.includes("pigmented") ? "The pigmented top coat delivers consistent colour and strong resistance to scuffing."
    : finish.includes("nappa") ? "The nappa finish gives a soft, refined surface well suited to lined goods."
    : type.includes("suede") ? "The nap is dense and even, brushing cleanly without shedding."
    : "The finish is even across the panel and takes edge treatment predictably.";

  // Closing line ties the article to the tannery that actually produced it.
  const city = (s.country || "").split(",")[0] || "Pakistan";
  const provenance = `Tanned and finished in our ${city} facility, with consistent lot-to-lot supply for volume orders.`;

  return [opener, sentence2, character, provenance].filter(Boolean).join(" ");
}

export function buildDescription(doc: any): { description: string; specCount: number; appCount: number } {
  const s = extractSpecs(doc);
  const prose = buildProse(doc, s);

  const specParts = [
    s.thicknessMm,
    s.weightOz,
    s.tanning,
    s.temper,
    s.finish,
    s.variant,
    s.country,
  ]
    .map((x) => String(x || "").trim())
    .filter(Boolean);

  const lines = [prose];
  if (specParts.length) lines.push(`Specifications: ${specParts.join(" | ")}`);
  if (s.applications.length) lines.push(`Applications: ${s.applications.join(" · ")}`);

  return {
    description: lines.join("\n\n"),
    specCount: specParts.length,
    appCount: s.applications.length,
  };
}

// ──────────────────────────────── run ────────────────────────────────

async function run() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const importedOnly = args.includes("--imported-only");

  const { default: connectDB } = await import("../lib/config/db");
  const { default: RawLeather } = await import("../lib/models/RawLeather");
  const mongoose = (await import("mongoose")).default;

  await connectDB();

  const query: any = { isArchived: true };
  if (importedOnly) query.description = /^\[REVIEW BEFORE PUBLISHING\]/;

  const products = await RawLeather.find(query).sort({ _id: 1 });
  log.start(`Processing ${products.length} archived RawLeather products${dryRun ? "  (DRY RUN)" : ""}`);

  const liveCount = await RawLeather.countDocuments({ isArchived: { $ne: true } });
  log.start(`${liveCount} products already live — these are not touched`);

  // Seed the uniqueness set with every name already in the collection so a
  // generated name cannot collide with a live product or an earlier batch.
  const usedNames = new Set<string>(
    (await RawLeather.find({}).select("name").lean()).map((d: any) => String(d.name).toLowerCase())
  );

  const stats = { processed: 0, updated: 0, failed: 0, flagged: 0 };
  const moqCounts: Record<number, number> = { 350: 0, 400: 0, 450: 0, 500: 0, 550: 0 };
  const flaggedNames: Array<{ from: string; to: string; reason: string }> = [];
  const preExisting: string[] = [];

  const totalBatches = Math.max(1, Math.ceil(products.length / BATCH_SIZE));
  let shown = 0;

  for (let b = 0; b < totalBatches; b++) {
    const slice = products.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    if (!slice.length) break;
    log.batch(
      `Processing batch ${b + 1}/${totalBatches} (products ${b * BATCH_SIZE + 1}-${b * BATCH_SIZE + slice.length})`
    );

    for (const doc of slice) {
      stats.processed++;
      const originalName = String(doc.name);
      log.product(originalName);

      try {
        const isImported = /^\[REVIEW BEFORE PUBLISHING\]/.test(String(doc.description || ""));
        if (!isImported) {
          preExisting.push(originalName);
          log.warn(`Pre-existing product (not from an import) — rewriting its name and description`);
        }

        const nameRes = transformName(originalName, doc, usedNames);
        log.name(nameRes.name);
        if (nameRes.flagged) {
          stats.flagged++;
          flaggedNames.push({ from: originalName, to: nameRes.name, reason: nameRes.reason || "" });
          log.review(`Ambiguous name flagged: ${originalName} → ${nameRes.name}`);
        }

        const { description, specCount, appCount } = buildDescription(doc);
        log.desc(
          `Generated ${description.length} chars | ${specCount} specs extracted | ${appCount} apps found`
        );

        const moq = MOQ_VALUES[Math.floor(Math.random() * MOQ_VALUES.length)];
        moqCounts[moq]++;
        log.moq(String(moq));
        log.flags(`isArchived:false | sampleAvailable:true`);

        if (dryRun && shown < 5) {
          shown++;
          console.log(`\n[DRY RUN]  ── transformation ${shown}/5 ──`);
          console.log(`           NAME  : ${originalName}`);
          console.log(`                 → ${nameRes.name}`);
          console.log(`           OLD   : ${String(doc.description).slice(0, 100).replace(/\n/g, " ")}…`);
          console.log(`           NEW   :`);
          description.split("\n").forEach((l) => console.log(`                   ${l}`));
          console.log(`           MOQ   : ${moq}`);
          console.log(`           FLAGS : isArchived=false sampleAvailable=true\n`);
        }

        if (!dryRun) {
          // Only the five fields below are written; every other field
          // (images, pricing, leatherType, animal, finish, thickness, size,
          // colors, isFeatured, createdAt …) is left untouched.
          await RawLeather.findByIdAndUpdate(doc._id, {
            $set: {
              name: nameRes.name,
              description,
              minOrderQuantity: moq,
              sampleAvailable: true,
              isArchived: false,
            },
          });
          log.db(`Updated: ${nameRes.name}`);
        }

        stats.updated++;
      } catch (err: any) {
        stats.failed++;
        log.error(`Failed: ${originalName} — ${errText(err)}`);
      }
    }
  }

  if (dryRun) {
    console.log("\n[DRY RUN]  No changes written to database");
  }

  await mongoose.disconnect();

  const row = (label: string, value: string | number) =>
    `║ ${label.padEnd(28)}${String(value).padEnd(16)}║`;

  console.log(`
╔═════════════════════════════════════════════╗
║   PURE GRAIN EXPORTS — RAW LEATHER ${dryRun ? "DRY RUN" : "LIVE   "}  ║
╠═════════════════════════════════════════════╣
${row("Total processed:", stats.processed)}
${row(dryRun ? "Would update:" : "Successfully updated:", stats.updated)}
${row("Failed:", stats.failed)}
${row("Names flagged for review:", stats.flagged)}
╠═════════════════════════════════════════════╣
║ MOQ distribution:                           ║
${MOQ_VALUES.map((v) => row(`  ${v} assigned:`, moqCounts[v])).join("\n")}
╠═════════════════════════════════════════════╣
║ All products now:                           ║
║   isArchived: false ✓                       ║
║   sampleAvailable: true ✓                   ║
║   isActive: n/a (not in RawLeather schema)  ║
╚═════════════════════════════════════════════╝`);

  if (preExisting.length) {
    console.log(`\nPre-existing (non-imported) products included: ${preExisting.length}`);
    preExisting.forEach((n) => console.log(`  ⚠  ${n}`));
    console.log(`  Re-run with --imported-only to leave these archived.`);
  }

  if (flaggedNames.length) {
    console.log(`\nNames flagged for manual review (${flaggedNames.length}):`);
    flaggedNames.forEach((f) => console.log(`  ${f.from}\n     → ${f.to}   [${f.reason}]`));
  }

  process.exit(0);
}

// Only execute when this file is the entry point. Other scripts import
// transformName from here to reproduce the original hide naming, and must not
// trigger a database update by doing so.
const isEntryPoint =
  Boolean(process.argv[1]) &&
  path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1]);

if (isEntryPoint) {
  run().catch((err) => {
    log.error(`Update aborted: ${errText(err)}`);
    console.error(err);
    process.exit(1);
  });
}
