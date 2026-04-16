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

function buildXml(urls: { loc: string; changefreq?: string; priority?: number }[]) {
  const entries = urls
    .map(
      (u) =>
        `  <url><loc>${u.loc}</loc>${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ""}${u.priority !== undefined ? `<priority>${u.priority}</priority>` : ""}</url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idStr } = await params;
  const id = parseInt(idStr.replace(/\.xml$/, ""), 10);

  if (isNaN(id)) {
    return new Response("Not found", { status: 404 });
  }

  // Chunk 0 = static pages
  if (id === 0) {
    const xml = buildXml([
      { loc: BASE, changefreq: "daily", priority: 1 },
      { loc: `${BASE}/about`, changefreq: "monthly", priority: 0.5 },
      { loc: `${BASE}/contact`, changefreq: "monthly", priority: 0.3 },
      { loc: `${BASE}/search`, changefreq: "daily", priority: 0.8 },
    ]);
    return new Response(xml, {
      headers: { "Content-Type": "application/xml; charset=utf-8" },
    });
  }

  // Chunks 1..N = postcode URLs
  const postcodes = loadPostcodes();
  const start = (id - 1) * CHUNK_SIZE;
  const chunk = postcodes.slice(start, start + CHUNK_SIZE);

  if (chunk.length === 0) {
    return new Response("Not found", { status: 404 });
  }

  const xml = buildXml(
    chunk.map((pc) => ({
      loc: `${BASE}/${pc.replace(/\s/g, "").toLowerCase()}`,
      changefreq: "monthly",
      priority: 0.7,
    })),
  );

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
