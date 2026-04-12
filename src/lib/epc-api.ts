import type { EPCCertificate } from "./types";

const EPC_API_BASE = "https://epc.opendatacommunities.org/api/v1";

function getAuthHeader(): string {
  const email = process.env.EPC_API_EMAIL;
  const key = process.env.EPC_API_KEY;
  if (!email || !key) throw new Error("EPC_API_EMAIL and EPC_API_KEY required");
  return `Basic ${Buffer.from(`${email}:${key}`).toString("base64")}`;
}

interface EPCSearchParams {
  postcode?: string;
  address?: string;
  size?: number;
}

interface EPCRawResult {
  "lmk-key": string;
  address1: string;
  address2: string;
  address3: string;
  postcode: string;
  "current-energy-rating": string;
  "potential-energy-rating": string;
  "current-energy-efficiency": string;
  "potential-energy-efficiency": string;
  "property-type": string;
  "built-form": string;
  "construction-age-band": string;
  "total-floor-area": string;
  "number-habitable-rooms": string;
  "co2-emissions-current": string;
  "co2-emissions-potential": string;
  "heating-cost-current": string;
  "heating-cost-potential": string;
  "lighting-cost-current": string;
  "lighting-cost-potential": string;
  "hot-water-cost-current": string;
  "hot-water-cost-potential": string;
  "walls-description": string;
  "roof-description": string;
  "windows-description": string;
  "mainheat-description": string;
  "main-fuel": string;
  tenure: string;
  "inspection-date": string;
  "local-authority": string;
  constituency: string;
  [key: string]: string;
}

function mapRawToEPC(raw: EPCRawResult): EPCCertificate {
  return {
    lmkKey: raw["lmk-key"],
    address1: raw.address1,
    address2: raw.address2,
    address3: raw.address3,
    postcode: raw.postcode,
    currentEnergyRating: raw["current-energy-rating"],
    potentialEnergyRating: raw["potential-energy-rating"],
    currentEnergyEfficiency: Number(raw["current-energy-efficiency"]) || 0,
    potentialEnergyEfficiency: Number(raw["potential-energy-efficiency"]) || 0,
    propertyType: raw["property-type"],
    builtForm: raw["built-form"],
    constructionAgeBand: raw["construction-age-band"],
    totalFloorArea: Number(raw["total-floor-area"]) || 0,
    numberOfRooms: Number(raw["number-habitable-rooms"]) || 0,
    co2EmissionsCurrent: Number(raw["co2-emissions-current"]) || 0,
    co2EmissionsPotential: Number(raw["co2-emissions-potential"]) || 0,
    heatingCostCurrent: Number(raw["heating-cost-current"]) || 0,
    heatingCostPotential: Number(raw["heating-cost-potential"]) || 0,
    lightingCostCurrent: Number(raw["lighting-cost-current"]) || 0,
    lightingCostPotential: Number(raw["lighting-cost-potential"]) || 0,
    hotWaterCostCurrent: Number(raw["hot-water-cost-current"]) || 0,
    hotWaterCostPotential: Number(raw["hot-water-cost-potential"]) || 0,
    wallsDescription: raw["walls-description"],
    roofDescription: raw["roof-description"],
    windowsDescription: raw["windows-description"],
    mainHeatDescription: raw["mainheat-description"],
    mainFuel: raw["main-fuel"],
    tenure: raw.tenure,
    inspectionDate: raw["inspection-date"],
    localAuthority: raw["local-authority"],
    constituency: raw.constituency,
  };
}

export async function searchByPostcode(
  postcode: string,
  size = 100
): Promise<EPCCertificate[]> {
  const clean = postcode.replace(/\s/g, "");
  const url = `${EPC_API_BASE}/domestic/search?postcode=${encodeURIComponent(clean)}&size=${size}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
    next: { revalidate: 86400 }, // Cache 24h
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`EPC API error: ${res.status}`);
  }

  const data = await res.json();
  const rows: EPCRawResult[] = data.rows || [];
  return rows.map(mapRawToEPC);
}

export async function searchByAddress(
  query: string,
  size = 20
): Promise<EPCCertificate[]> {
  const url = `${EPC_API_BASE}/domestic/search?address=${encodeURIComponent(query)}&size=${size}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    if (res.status === 404) return [];
    throw new Error(`EPC API error: ${res.status}`);
  }

  const data = await res.json();
  const rows: EPCRawResult[] = data.rows || [];
  return rows.map(mapRawToEPC);
}

export async function getCertificate(
  lmkKey: string
): Promise<EPCCertificate | null> {
  const url = `${EPC_API_BASE}/domestic/certificate/${encodeURIComponent(lmkKey)}`;

  const res = await fetch(url, {
    headers: {
      Authorization: getAuthHeader(),
      Accept: "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    throw new Error(`EPC API error: ${res.status}`);
  }

  const data = await res.json();
  const rows: EPCRawResult[] = data.rows || [];
  return rows.length > 0 ? mapRawToEPC(rows[0]) : null;
}
