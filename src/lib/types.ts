/** Core property data aggregated from multiple sources */
export interface PropertyData {
  address: PropertyAddress;
  epc?: EPCCertificate;
  priceHistory: PriceRecord[];
  crimeStats?: CrimeStats;
}

export interface PropertyAddress {
  paon: string; // Primary addressable object (house number/name)
  saon?: string; // Secondary (flat/unit)
  street: string;
  locality?: string;
  town: string;
  district: string;
  county: string;
  postcode: string;
}

/** Land Registry Price Paid record */
export interface PriceRecord {
  transactionId: string;
  price: number;
  date: string; // ISO date
  propertyType: "D" | "S" | "T" | "F" | "O"; // Detached, Semi, Terraced, Flat, Other
  isNewBuild: boolean;
  tenure: "F" | "L"; // Freehold, Leasehold
  category: "A" | "B"; // Standard, Additional
}

/** EPC Certificate data (subset of 100+ fields) */
export interface EPCCertificate {
  lmkKey: string;
  address1: string;
  address2: string;
  address3: string;
  postcode: string;
  currentEnergyRating: string; // A-G
  potentialEnergyRating: string;
  currentEnergyEfficiency: number; // 0-100
  potentialEnergyEfficiency: number;
  propertyType: string;
  builtForm: string;
  constructionAgeBand: string;
  totalFloorArea: number;
  numberOfRooms: number;
  co2EmissionsCurrent: number;
  co2EmissionsPotential: number;
  heatingCostCurrent: number;
  heatingCostPotential: number;
  lightingCostCurrent: number;
  lightingCostPotential: number;
  hotWaterCostCurrent: number;
  hotWaterCostPotential: number;
  wallsDescription: string;
  roofDescription: string;
  windowsDescription: string;
  mainHeatDescription: string;
  mainFuel: string;
  tenure: string;
  inspectionDate: string;
  localAuthority: string;
  constituency: string;
}

/** Aggregated crime stats for a postcode area */
export interface CrimeStats {
  postcode: string;
  period: string; // e.g., "2025-12"
  totalCrimes: number;
  breakdown: CrimeBreakdown[];
}

export interface CrimeBreakdown {
  category: string;
  count: number;
}

/** Postcode-level summary for listing pages */
export interface PostcodeSummary {
  postcode: string;
  town: string;
  district: string;
  county: string;
  propertyCount: number;
  averagePrice?: number;
  medianPrice?: number;
  priceRange?: { min: number; max: number };
  dominantEpcRating?: string;
  recentSales: PriceRecord[];
}

/** Street-level summary */
export interface StreetSummary {
  street: string;
  postcode: string;
  properties: PropertyAddress[];
  averagePrice?: number;
  recentSales: PriceRecord[];
}

/** Property type display names */
export const PROPERTY_TYPES: Record<string, string> = {
  D: "Detached",
  S: "Semi-Detached",
  T: "Terraced",
  F: "Flat/Maisonette",
  O: "Other",
};

/** Tenure display names */
export const TENURE_TYPES: Record<string, string> = {
  F: "Freehold",
  L: "Leasehold",
};
