/**
 * Local EPC data loader.
 * Reads from data/epc/*.json files (downloaded via scripts/download-epc.ts).
 * Falls back to the live API if local data is not available.
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { EPCCertificate } from "./types";
import { formatPostcode } from "./postcodes";
import {
  searchByPostcode as apiSearchByPostcode,
  searchByAddress as apiSearchByAddress,
} from "./epc-api";

// ── Types matching the download script output ───────────────────────

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

interface IndexFile {
  totalDistricts: number;
  totalProperties: number;
  totalPostcodes: number;
  updated: string;
  districts: { district: string; count: number; postcodes: number }[];
}

// ── Cache ───────────────────────────────────────────────────────────

const districtCache = new Map<string, DistrictFile>();

function getDataDir(): string {
  return join(process.cwd(), "data", "epc");
}

// ── Core loaders ────────────────────────────────────────────────────

function loadDistrictFile(outwardCode: string): DistrictFile | null {
  const key = outwardCode.toLowerCase();
  if (districtCache.has(key)) return districtCache.get(key)!;

  const filePath = join(getDataDir(), `${key}.json`);
  if (!existsSync(filePath)) return null;

  try {
    const data: DistrictFile = JSON.parse(readFileSync(filePath, "utf-8"));
    districtCache.set(key, data);
    return data;
  } catch {
    return null;
  }
}

export function loadIndex(): IndexFile | null {
  const filePath = join(getDataDir(), "_index.json");
  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8"));
  } catch {
    return null;
  }
}

// ── Convert local record to EPCCertificate type ─────────────────────

function toEPCCertificate(r: EPCRecord): EPCCertificate {
  return {
    lmkKey: r.lmkKey,
    address1: r.address1,
    address2: r.address2,
    address3: r.address3,
    postcode: r.postcode,
    currentEnergyRating: r.currentRating,
    potentialEnergyRating: r.potentialRating,
    currentEnergyEfficiency: r.currentEfficiency,
    potentialEnergyEfficiency: r.potentialEfficiency,
    propertyType: r.propertyType,
    builtForm: r.builtForm,
    constructionAgeBand: r.constructionAge,
    totalFloorArea: r.floorArea,
    numberOfRooms: r.rooms,
    co2EmissionsCurrent: r.co2Current,
    co2EmissionsPotential: r.co2Potential,
    heatingCostCurrent: r.heatingCostCurrent,
    heatingCostPotential: r.heatingCostPotential,
    lightingCostCurrent: r.lightingCostCurrent,
    lightingCostPotential: r.lightingCostPotential,
    hotWaterCostCurrent: r.hotWaterCostCurrent,
    hotWaterCostPotential: r.hotWaterCostPotential,
    wallsDescription: r.walls,
    roofDescription: r.roof,
    windowsDescription: r.windows,
    mainHeatDescription: r.heating,
    mainFuel: r.fuel,
    tenure: r.tenure,
    inspectionDate: r.inspectionDate,
    localAuthority: r.localAuthority,
    constituency: r.constituency,
  };
}

// ── Public API ──────────────────────────────────────────────────────

/** Get outward code from a postcode: "SW1A 2AA" -> "sw1a" */
function getOutwardCode(postcode: string): string {
  const formatted = formatPostcode(postcode);
  return formatted.split(" ")[0].toLowerCase();
}

/** Get all EPC certificates for a postcode — local data first, API fallback */
export async function getByPostcode(postcode: string): Promise<EPCCertificate[]> {
  const formatted = formatPostcode(postcode);
  const oc = getOutwardCode(postcode);
  const district = loadDistrictFile(oc);

  if (district) {
    return district.properties
      .filter(
        (r) =>
          r.postcode.replace(/\s/g, "").toUpperCase() ===
          formatted.replace(/\s/g, "").toUpperCase(),
      )
      .map(toEPCCertificate);
  }

  // Fallback to live API
  try {
    return await apiSearchByPostcode(postcode);
  } catch {
    return [];
  }
}

/** Search by address text — local data first, API fallback */
export async function searchByAddress(query: string): Promise<EPCCertificate[]> {
  const index = loadIndex();
  if (!index) {
    // No local data — fall back to live API
    try {
      return await apiSearchByAddress(query);
    } catch {
      return [];
    }
  }

  const q = query.toUpperCase();
  const results: EPCCertificate[] = [];
  for (const { district } of index.districts) {
    const file = loadDistrictFile(district);
    if (!file) continue;

    for (const r of file.properties) {
      const full = `${r.address1} ${r.address2} ${r.address3} ${r.postcode}`.toUpperCase();
      if (full.includes(q)) {
        results.push(toEPCCertificate(r));
        if (results.length >= 50) return results;
      }
    }
  }

  return results;
}

/** Get all unique postcodes within a district */
export function getPostcodesInDistrict(outwardCode: string): string[] {
  const district = loadDistrictFile(outwardCode);
  if (!district) return [];

  const postcodes = new Set<string>();
  for (const r of district.properties) {
    postcodes.add(formatPostcode(r.postcode));
  }
  return Array.from(postcodes).sort();
}

/** Get all unique streets for a postcode */
export async function getStreetsForPostcode(postcode: string): Promise<string[]> {
  const certs = await getByPostcode(postcode);
  const streets = new Set<string>();
  for (const c of certs) {
    const street = extractStreet(c);
    if (street) streets.add(street);
  }
  return Array.from(streets).sort();
}

/** Get all properties on a specific street within a postcode */
export async function getPropertiesOnStreet(
  postcode: string,
  streetSlug: string,
): Promise<EPCCertificate[]> {
  const certs = await getByPostcode(postcode);
  return certs.filter((c) => {
    const street = extractStreet(c);
    if (!street) return false;
    const slug = street
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    return slug === streetSlug;
  });
}

/** Get a single property by postcode, street slug, and number slug */
export async function getProperty(
  postcode: string,
  streetSlug: string,
  numberSlug: string,
): Promise<EPCCertificate | null> {
  const properties = await getPropertiesOnStreet(postcode, streetSlug);
  const numUpper = numberSlug.toUpperCase().replace(/-/g, " ");

  return (
    properties.find((c) => {
      const num = extractNumber(c).toUpperCase();
      return num === numUpper;
    }) ?? null
  );
}

/** Check if we have local data available */
export function hasLocalData(): boolean {
  return existsSync(join(getDataDir(), "_index.json"));
}

// ── Helpers ─────────────────────────────────────────────────────────

/** Extract street name from EPC address fields */
function extractStreet(cert: EPCCertificate): string {
  // address1 is usually "number street" or "flat X, number street"
  // address2 sometimes has the street if address1 has the flat/building name
  const addr = cert.address2 || cert.address1;
  // Remove leading numbers and flat references
  return addr
    .replace(/^\d+[A-Z]?\s+/i, "") // remove leading house number
    .replace(/^FLAT\s+\d+[A-Z]?,?\s*/i, "") // remove "Flat X,"
    .replace(/^APARTMENT\s+\d+[A-Z]?,?\s*/i, "") // remove "Apartment X,"
    .replace(/^UNIT\s+\d+[A-Z]?,?\s*/i, "") // remove "Unit X,"
    .replace(/^\d+[A-Z]?\s*/i, "") // remove any remaining leading numbers
    .trim();
}

/** Extract house/flat number from EPC address fields */
function extractNumber(cert: EPCCertificate): string {
  const addr = cert.address1;
  // Match leading number (with optional letter): "132B", "10", "FLAT 3"
  const numMatch = addr.match(/^(\d+[A-Z]?)\b/i);
  if (numMatch) return numMatch[1];

  const flatMatch = addr.match(/^(?:FLAT|APARTMENT|UNIT)\s+(\d+[A-Z]?)/i);
  if (flatMatch) return flatMatch[1];

  // If no number found, use the full address1 as identifier
  return addr;
}
