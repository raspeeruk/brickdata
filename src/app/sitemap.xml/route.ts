import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE = "https://brickdata.co.uk";
const CHUNK_SIZE = 50000;

function countChunks(): number {
  const file = join(process.cwd(), "data", "epc", "_postcodes.json");
  if (!existsSync(file)) return 0;
  try {
    const arr = JSON.parse(readFileSync(file, "utf-8"));
    return Math.ceil(arr.length / CHUNK_SIZE);
  } catch {
    return 0;
  }
}

export async function GET() {
  const chunks = countChunks();
  const now = new Date().toISOString();

  // 0 = static pages, 1..N = postcode chunks
  const ids = [0, ...Array.from({ length: chunks }, (_, i) => i + 1)];
  const entries = ids
    .map(
      (id) =>
        `  <sitemap><loc>${BASE}/sitemaps/${id}.xml</loc><lastmod>${now}</lastmod></sitemap>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</sitemapindex>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
