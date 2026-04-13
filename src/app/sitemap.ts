import type { MetadataRoute } from "next";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = "https://brickdata.co.uk";
const CHUNK_SIZE = 50000;

function loadPostcodes(): string[] {
  const file = join(process.cwd(), "data", "epc", "_postcodes.json");
  if (!existsSync(file)) return [];
  try {
    return JSON.parse(readFileSync(file, "utf-8"));
  } catch {
    return [];
  }
}

/**
 * Sitemap index: id 0 = static pages, ids 1+ = postcode chunks (50K each).
 * 167K postcodes → 4 chunks.
 */
export async function generateSitemaps() {
  const postcodes = loadPostcodes();
  const chunks = Math.ceil(postcodes.length / CHUNK_SIZE);
  return [
    { id: 0 },
    ...Array.from({ length: chunks }, (_, i) => ({ id: i + 1 })),
  ];
}

export default async function sitemap({
  id,
}: {
  id: number;
}): Promise<MetadataRoute.Sitemap> {
  if (id === 0) {
    return [
      { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
      { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
      { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
      { url: `${BASE}/search`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    ];
  }

  const postcodes = loadPostcodes();
  const start = (id - 1) * CHUNK_SIZE;
  const chunk = postcodes.slice(start, start + CHUNK_SIZE);

  return chunk.map((pc) => ({
    url: `${BASE}/${pc.replace(/\s/g, "").toLowerCase()}`,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));
}
