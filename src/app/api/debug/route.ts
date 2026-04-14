import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const results: Record<string, unknown> = {};

  // Test 1: EPC API
  try {
    const email = process.env.EPC_API_EMAIL;
    const key = process.env.EPC_API_KEY;
    results.epcEmail = email ? email.slice(0, 4) + "***" : "(not set)";
    results.epcKeyLen = key?.length ?? 0;
    results.epcEnvSet = !!(email && key);
    if (email && key) {
      const auth = `Basic ${Buffer.from(`${email}:${key}`).toString("base64")}`;
      const res = await fetch(
        "https://epc.opendatacommunities.org/api/v1/domestic/search?postcode=SW112NN&size=1",
        { headers: { Authorization: auth, Accept: "application/json" }, cache: "no-store" }
      );
      results.epcStatus = res.status;
      if (res.ok) {
        const data = await res.json();
        results.epcRows = data.rows?.length ?? 0;
      } else {
        results.epcBody = await res.text().then((t) => t.slice(0, 200));
      }
    }
  } catch (e) {
    results.epcError = String(e);
  }

  // Test 2: Land Registry SPARQL
  try {
    const query = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/> PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/> SELECT ?price WHERE { ?txn lrppi:pricePaid ?price ; lrppi:propertyAddress ?addr . ?addr lrcommon:postcode "SW11 2NN" . } LIMIT 1`;
    const res = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(query)}`,
      cache: "no-store",
    });
    results.lrStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      results.lrBindings = data.results?.bindings?.length ?? 0;
    } else {
      results.lrBody = await res.text().then((t) => t.slice(0, 200));
    }
  } catch (e) {
    results.lrError = String(e);
  }

  // Test 3: Police API
  try {
    const res = await fetch(
      "https://data.police.uk/api/crimes-at-location?date=2026-02&lat=51.4636&lng=-0.1629",
      { cache: "no-store" }
    );
    results.policeStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      results.policeCrimes = data.length;
    }
  } catch (e) {
    results.policeError = String(e);
  }

  return NextResponse.json(results);
}
