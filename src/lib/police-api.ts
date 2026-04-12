import type { CrimeStats, CrimeBreakdown } from "./types";

/**
 * Police.uk API — street-level crime data
 * Free, no auth, Open Government Licence v3.0
 * Uses postcodes.io to get lat/lng for a postcode, then queries police.uk
 */

interface PostcodesIOResult {
  status: number;
  result: {
    latitude: number;
    longitude: number;
    admin_district: string;
    parliamentary_constituency: string;
  } | null;
}

interface PoliceCrime {
  category: string;
  location: {
    latitude: string;
    longitude: string;
    street: { name: string };
  };
  month: string;
  outcome_status: { category: string } | null;
}

/** Get lat/lng for a postcode via postcodes.io (free, no auth) */
async function getPostcodeCoords(
  postcode: string
): Promise<{ lat: number; lng: number } | null> {
  const clean = postcode.replace(/\s/g, "");
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`,
    { next: { revalidate: 604800 } } // Cache 7 days — postcodes don't move
  );

  if (!res.ok) return null;

  const data: PostcodesIOResult = await res.json();
  if (!data.result) return null;

  return { lat: data.result.latitude, lng: data.result.longitude };
}

/** Get crime stats for a postcode area (last month available) */
export async function getCrimeStats(
  postcode: string
): Promise<CrimeStats | null> {
  const coords = await getPostcodeCoords(postcode);
  if (!coords) return null;

  const res = await fetch(
    `https://data.police.uk/api/crimes-at-location?lat=${coords.lat}&lng=${coords.lng}`,
    { next: { revalidate: 86400 } } // Cache 24h
  );

  if (!res.ok) return null;

  const crimes: PoliceCrime[] = await res.json();
  if (crimes.length === 0) return null;

  // Aggregate by category
  const counts = new Map<string, number>();
  for (const crime of crimes) {
    const cat = crime.category;
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  const breakdown: CrimeBreakdown[] = Array.from(counts.entries())
    .map(([category, count]) => ({
      category: formatCrimeCategory(category),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    postcode: postcode.replace(/\s/g, "").toUpperCase(),
    period: crimes[0]?.month || "unknown",
    totalCrimes: crimes.length,
    breakdown,
  };
}

/** Human-readable crime category names */
function formatCrimeCategory(slug: string): string {
  const map: Record<string, string> = {
    "anti-social-behaviour": "Anti-Social Behaviour",
    "bicycle-theft": "Bicycle Theft",
    burglary: "Burglary",
    "criminal-damage-arson": "Criminal Damage & Arson",
    drugs: "Drugs",
    "other-crime": "Other Crime",
    "other-theft": "Other Theft",
    "possession-of-weapons": "Weapon Possession",
    "public-order": "Public Order",
    robbery: "Robbery",
    shoplifting: "Shoplifting",
    "theft-from-the-person": "Theft from Person",
    "vehicle-crime": "Vehicle Crime",
    "violent-crime": "Violence & Sexual Offences",
  };
  return map[slug] || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
