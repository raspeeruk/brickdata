#!/usr/bin/env npx tsx

/**
 * Download EPC data for London by querying each postcode outward code.
 * This avoids the EPC API's 10K result limit per query.
 *
 * Usage:
 *   npx tsx scripts/download-epc.ts              # Download all London outward codes
 *   npx tsx scripts/download-epc.ts --resume      # Skip already-downloaded codes
 *   npx tsx scripts/download-epc.ts --code SW1A   # Download a single outward code
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// ── Config ──────────────────────────────────────────────────────────

const API_BASE = "https://epc.opendatacommunities.org/api/v1";
const PAGE_SIZE = 5000;
const RATE_LIMIT_MS = 150;

const ROOT = process.cwd();
const DATA_DIR = join(ROOT, "data", "epc");
const PROGRESS_FILE = join(ROOT, ".tmp", "epc-progress.json");

// ── London borough codes (for filtering) ────────────────────────────

const LONDON_LA_CODES = new Set([
  "E09000001", "E09000002", "E09000003", "E09000004", "E09000005",
  "E09000006", "E09000007", "E09000008", "E09000009", "E09000010",
  "E09000011", "E09000012", "E09000013", "E09000014", "E09000015",
  "E09000016", "E09000017", "E09000018", "E09000019", "E09000020",
  "E09000021", "E09000022", "E09000023", "E09000024", "E09000025",
  "E09000026", "E09000027", "E09000028", "E09000029", "E09000030",
  "E09000031", "E09000032", "E09000033",
]);

// ── All London postcode outward codes ───────────────────────────────

function generateLondonOutwardCodes(): string[] {
  const codes: string[] = [];

  // Central London
  for (let i = 1; i <= 20; i++) codes.push(`E${i}`);
  codes.push("E1W");

  for (const sub of ["1A", "1M", "1N", "1R", "1V", "1Y", "2A", "2M", "2N", "2R", "2V", "2Y", "3A", "3M", "3N", "3R", "3V", "4A", "4M", "4N", "4R", "4V", "4Y"]) {
    codes.push(`EC${sub}`);
  }

  for (let i = 1; i <= 22; i++) codes.push(`N${i}`);
  codes.push("N1C", "N1P", "N81");

  for (let i = 1; i <= 11; i++) codes.push(`NW${i}`);
  codes.push("NW1W");

  for (let i = 1; i <= 28; i++) codes.push(`SE${i}`);
  codes.push("SE1P");

  for (const sub of ["1A", "1E", "1H", "1P", "1V", "1W", "1X", "1Y"]) {
    codes.push(`SW${sub}`);
  }
  for (let i = 2; i <= 20; i++) codes.push(`SW${i}`);

  for (const sub of ["1A", "1B", "1C", "1D", "1F", "1G", "1H", "1J", "1K", "1S", "1T", "1U", "1W"]) {
    codes.push(`W${sub}`);
  }
  for (let i = 2; i <= 14; i++) codes.push(`W${i}`);

  for (const sub of ["1A", "1B", "1E", "1H", "1N", "1R", "1V", "1X"]) {
    codes.push(`WC${sub}`);
  }
  for (const sub of ["2A", "2B", "2E", "2H", "2N", "2R"]) {
    codes.push(`WC${sub}`);
  }

  // Outer London
  for (let i = 1; i <= 8; i++) codes.push(`BR${i}`);
  for (const i of [0, 2, 3, 4, 5, 7, 8, 9]) codes.push(`CR${i}`);
  for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 14, 15, 16, 17, 18]) codes.push(`DA${i}`);
  for (const i of [1, 2, 3, 4, 5, 8]) codes.push(`EN${i}`);
  for (let i = 0; i <= 9; i++) codes.push(`HA${i}`);
  for (let i = 1; i <= 11; i++) codes.push(`IG${i}`);
  for (const i of [1, 2, 3, 4, 5, 6, 9]) codes.push(`KT${i}`);
  for (let i = 1; i <= 20; i++) codes.push(`RM${i}`);
  for (let i = 1; i <= 7; i++) codes.push(`SM${i}`);
  for (const i of [14, 16]) codes.push(`TN${i}`);
  for (const i of [1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]) codes.push(`TW${i}`);
  for (let i = 1; i <= 11; i++) codes.push(`UB${i}`);
  for (const i of [3, 5, 6, 23, 25]) codes.push(`WD${i}`);

  return codes;
}

// ── Types ───────────────────────────────────────────────────────────

interface EPCRecord {
  lmkKey: string;
  address1: string;
  address2: string;
  address3: string;
  postcode: string;
  currentRating: string;
  potentialRating: string;
  currentEfficiency: number;
  potentialEfficiency: number;
  propertyType: string;
  builtForm: string;
  constructionAge: string;
  floorArea: number;
  rooms: number;
  co2Current: number;
  co2Potential: number;
  heatingCostCurrent: number;
  heatingCostPotential: number;
  lightingCostCurrent: number;
  lightingCostPotential: number;
  hotWaterCostCurrent: number;
  hotWaterCostPotential: number;
  walls: string;
  roof: string;
  windows: string;
  heating: string;
  fuel: string;
  tenure: string;
  inspectionDate: string;
  localAuthority: string;
  constituency: string;
}

interface DistrictFile {
  district: string;
  count: number;
  updated: string;
  properties: EPCRecord[];
}

// ── Env loading ─────────────────────────────────────────────────────

function loadEnv(): void {
  const paths = [join(ROOT, ".env.local"), join(ROOT, ".env")];
  for (const p of paths) {
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

function getAuth(): string {
  const email = process.env.EPC_API_EMAIL;
  const key = process.env.EPC_API_KEY;
  if (!email || !key) {
    console.error("Missing EPC_API_EMAIL or EPC_API_KEY in .env.local");
    process.exit(1);
  }
  return `Basic ${Buffer.from(`${email}:${key}`).toString("base64")}`;
}

// ── API ─────────────────────────────────────────────────────────────

function mapRow(row: Record<string, string>): EPCRecord {
  return {
    lmkKey: row["lmk-key"] || "",
    address1: row["address1"] || "",
    address2: row["address2"] || "",
    address3: row["address3"] || "",
    postcode: row["postcode"] || "",
    currentRating: row["current-energy-rating"] || "",
    potentialRating: row["potential-energy-rating"] || "",
    currentEfficiency: Number(row["current-energy-efficiency"]) || 0,
    potentialEfficiency: Number(row["potential-energy-efficiency"]) || 0,
    propertyType: row["property-type"] || "",
    builtForm: row["built-form"] || "",
    constructionAge: row["construction-age-band"] || "",
    floorArea: Number(row["total-floor-area"]) || 0,
    rooms: Number(row["number-habitable-rooms"]) || 0,
    co2Current: Number(row["co2-emissions-current"]) || 0,
    co2Potential: Number(row["co2-emissions-potential"]) || 0,
    heatingCostCurrent: Number(row["heating-cost-current"]) || 0,
    heatingCostPotential: Number(row["heating-cost-potential"]) || 0,
    lightingCostCurrent: Number(row["lighting-cost-current"]) || 0,
    lightingCostPotential: Number(row["lighting-cost-potential"]) || 0,
    hotWaterCostCurrent: Number(row["hot-water-cost-current"]) || 0,
    hotWaterCostPotential: Number(row["hot-water-cost-potential"]) || 0,
    walls: row["walls-description"] || "",
    roof: row["roof-description"] || "",
    windows: row["windows-description"] || "",
    heating: row["mainheat-description"] || "",
    fuel: row["main-fuel"] || "",
    tenure: row["tenure"] || "",
    inspectionDate: row["inspection-date"] || "",
    localAuthority: row["local-authority"] || "",
    constituency: row["constituency"] || "",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchOutwardCode(
  code: string,
  auth: string,
  londonOnly: boolean,
): Promise<EPCRecord[]> {
  const records: EPCRecord[] = [];
  let from = 0;
  let retries = 0;
  const MAX_RETRIES = 3;

  while (true) {
    const url = `${API_BASE}/domestic/search?postcode=${encodeURIComponent(code)}&size=${PAGE_SIZE}&from=${from}`;

    let res: Response;
    try {
      res = await fetch(url, {
        headers: { Authorization: auth, Accept: "application/json" },
      });
    } catch (err) {
      retries++;
      if (retries > MAX_RETRIES) {
        console.error(`\n  ✗ ${code}: network error after ${MAX_RETRIES} retries`);
        break;
      }
      process.stdout.write(` [network error, retry ${retries}]`);
      await sleep(3_000);
      continue;
    }

    if (!res.ok) {
      if (res.status === 429) {
        process.stdout.write(" [rate-limited, waiting 10s]");
        await sleep(10_000);
        continue;
      }
      if (res.status === 500 && from >= 10_000) {
        break;
      }
      const body = await res.text().catch(() => "");
      console.error(`\n  ✗ ${code}: API ${res.status} at from=${from}: ${body.slice(0, 100)}`);
      break;
    }

    let data: { rows?: Record<string, string>[] };
    try {
      data = await res.json();
    } catch {
      retries++;
      if (retries > MAX_RETRIES) {
        process.stdout.write(` [bad JSON, giving up after ${MAX_RETRIES} retries]`);
        break;
      }
      process.stdout.write(` [bad JSON, retry ${retries}]`);
      await sleep(2_000);
      continue;
    }
    retries = 0; // Reset on success
    const rows: Record<string, string>[] = data.rows ?? [];

    if (rows.length === 0) break;

    for (const row of rows) {
      const record = mapRow(row);
      // Filter to London boroughs if needed
      if (londonOnly && !LONDON_LA_CODES.has(record.localAuthority)) continue;
      records.push(record);
    }

    from += rows.length;
    process.stdout.write(`\r  ${code}: ${from.toLocaleString()} fetched`);

    if (rows.length < PAGE_SIZE) break; // Last page
    await sleep(RATE_LIMIT_MS);
  }

  return records;
}

// ── Deduplication ───────────────────────────────────────────────────

function deduplicateByAddress(records: EPCRecord[]): EPCRecord[] {
  const map = new Map<string, EPCRecord>();
  for (const r of records) {
    const key = `${r.postcode}|${r.address1}|${r.address2}`.toUpperCase();
    const existing = map.get(key);
    if (!existing || r.inspectionDate > existing.inspectionDate) {
      map.set(key, r);
    }
  }
  return Array.from(map.values());
}

// ── Progress tracking ───────────────────────────────────────────────

interface Progress {
  completed: string[];
  stats: Record<string, { raw: number; unique: number }>;
}

function loadProgress(): Progress {
  if (!existsSync(PROGRESS_FILE)) return { completed: [], stats: {} };
  try {
    return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8"));
  } catch {
    return { completed: [], stats: {} };
  }
}

function saveProgress(progress: Progress): void {
  mkdirSync(join(ROOT, ".tmp"), { recursive: true });
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  loadEnv();
  const auth = getAuth();

  const args = process.argv.slice(2);
  const resumeMode = args.includes("--resume");
  const codeIdx = args.indexOf("--code");
  const singleCode = codeIdx !== -1 ? args[codeIdx + 1] : undefined;

  // Outer London codes overlap with non-London areas — filter to London boroughs
  const outerCodes = new Set([
    "BR", "CR", "DA", "EN", "HA", "IG", "KT", "RM", "SM", "TN", "TW", "UB", "WD",
  ]);

  mkdirSync(DATA_DIR, { recursive: true });

  let codes: string[];
  if (singleCode) {
    codes = [singleCode.toUpperCase()];
  } else {
    codes = generateLondonOutwardCodes();
  }

  const progress = resumeMode ? loadProgress() : { completed: [], stats: {} };
  const completedSet = new Set(progress.completed);

  const skipped = codes.filter((c) => completedSet.has(c)).length;
  const remaining = codes.length - skipped;

  console.log(`EPC Download: ${codes.length} outward codes (${skipped} done, ${remaining} remaining)\n`);

  let totalRaw = 0;
  let totalUnique = 0;
  let processed = 0;

  for (const code of codes) {
    if (completedSet.has(code)) continue;

    const area = code.replace(/\d.*/, "");
    const londonOnly = outerCodes.has(area);

    const raw = await fetchOutwardCode(code, auth, londonOnly);

    if (raw.length === 0) {
      process.stdout.write(`\r  ${code}: 0 records (skipped)              \n`);
      completedSet.add(code);
      progress.completed.push(code);
      progress.stats[code] = { raw: 0, unique: 0 };
      saveProgress(progress);
      processed++;
      continue;
    }

    const deduped = deduplicateByAddress(raw);

    // Sort by postcode then address
    deduped.sort((a, b) => {
      const pc = a.postcode.localeCompare(b.postcode);
      if (pc !== 0) return pc;
      return a.address1.localeCompare(b.address1);
    });

    const today = new Date().toISOString().split("T")[0];
    const districtFile: DistrictFile = {
      district: code,
      count: deduped.length,
      updated: today,
      properties: deduped,
    };

    writeFileSync(
      join(DATA_DIR, `${code.toLowerCase()}.json`),
      JSON.stringify(districtFile, null, 2),
    );

    totalRaw += raw.length;
    totalUnique += deduped.length;
    processed++;

    process.stdout.write(
      `\r  ${code}: ${raw.length.toLocaleString()} → ${deduped.length.toLocaleString()} unique              \n`,
    );

    completedSet.add(code);
    progress.completed.push(code);
    progress.stats[code] = { raw: raw.length, unique: deduped.length };

    saveProgress(progress);
  }

  saveProgress(progress);

  // ── Build index ─────────────────────────────────────────────────

  console.log("\nBuilding index...");

  const { readdirSync } = await import("fs");
  const indexEntries: { district: string; count: number; postcodes: number }[] = [];

  for (const file of readdirSync(DATA_DIR)) {
    if (!file.endsWith(".json") || file.startsWith("_")) continue;
    try {
      const data: DistrictFile = JSON.parse(
        readFileSync(join(DATA_DIR, file), "utf-8"),
      );
      if (data.count === 0) continue;
      const uniquePostcodes = new Set(data.properties.map((r) => r.postcode)).size;
      indexEntries.push({
        district: data.district,
        count: data.count,
        postcodes: uniquePostcodes,
      });
    } catch {
      // skip
    }
  }

  indexEntries.sort((a, b) => a.district.localeCompare(b.district));

  const index = {
    totalDistricts: indexEntries.length,
    totalProperties: indexEntries.reduce((sum, d) => sum + d.count, 0),
    totalPostcodes: indexEntries.reduce((sum, d) => sum + d.postcodes, 0),
    updated: new Date().toISOString().split("T")[0],
    districts: indexEntries,
  };

  writeFileSync(join(DATA_DIR, "_index.json"), JSON.stringify(index, null, 2));

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EPC Download Complete
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Outward codes: ${codes.length}
  Raw records:   ${totalRaw.toLocaleString()}
  Unique props:  ${totalUnique.toLocaleString()}
  Districts:     ${indexEntries.length}
  Postcodes:     ${index.totalPostcodes.toLocaleString()}
  Output:        ${DATA_DIR}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
