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

  // Test 2: Land Registry SPARQL - multiple query variants
  // Simple query (just price)
  try {
    const q1 = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?price ?date WHERE {
  ?txn lrppi:pricePaid ?price ;
       lrppi:transactionDate ?date ;
       lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode "SW11 2NN" .
} LIMIT 2`;
    const r1 = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(q1)}`,
      cache: "no-store",
    });
    const d1 = await r1.json();
    results.lrSimple = d1.results?.bindings?.length ?? 0;
  } catch (e) { results.lrSimpleErr = String(e); }

  // With address fields
  try {
    const q2 = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?price ?date ?paon ?street ?town WHERE {
  ?txn lrppi:pricePaid ?price ;
       lrppi:transactionDate ?date ;
       lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode "SW11 2NN" ;
        lrcommon:paon ?paon ;
        lrcommon:street ?street ;
        lrcommon:town ?town .
} LIMIT 2`;
    const r2 = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(q2)}`,
      cache: "no-store",
    });
    const d2 = await r2.json();
    results.lrWithAddr = d2.results?.bindings?.length ?? 0;
  } catch (e) { results.lrWithAddrErr = String(e); }

  // With property type join - OLD syntax (property path)
  try {
    const q3old = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?price ?propertyType WHERE {
  ?txn lrppi:pricePaid ?price ;
       lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode "SW11 2NN" .
  ?txn lrppi:propertyType/lrcommon:code ?propertyType .
} LIMIT 2`;
    const r3o = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(q3old)}`,
      cache: "no-store",
    });
    const d3o = await r3o.json();
    results.lrOldSyntax = d3o.results?.bindings?.length ?? 0;
  } catch (e) { results.lrOldSyntaxErr = String(e); }

  // Just propertyType URI (no code lookup)
  try {
    const q3b = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>
SELECT ?price ?ptNode WHERE {
  ?txn lrppi:pricePaid ?price ;
       lrppi:propertyAddress ?addr .
  ?addr lrcommon:postcode "SW11 2NN" .
  ?txn lrppi:propertyType ?ptNode .
} LIMIT 2`;
    const r3b = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(q3b)}`,
      cache: "no-store",
    });
    const d3b = await r3b.json();
    results.lrJustPtNode = d3b.results?.bindings?.length ?? 0;
    if (d3b.results?.bindings?.[0]) results.lrPtSample = d3b.results.bindings[0].ptNode?.value;
  } catch (e) { results.lrJustPtNodeErr = String(e); }

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
