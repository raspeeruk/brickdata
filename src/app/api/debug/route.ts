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

  // Test 2: Land Registry SPARQL (full query matching page code)
  try {
    const query = `PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/> PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/> SELECT ?transactionId ?price ?date ?paon ?saon ?street ?locality ?town ?district ?county ?propertyType ?newBuild ?tenure ?ppdCategory WHERE { ?txn lrppi:pricePaid ?price ; lrppi:transactionDate ?date ; lrppi:propertyAddress ?addr ; lrppi:transactionId ?transactionId . ?addr lrcommon:postcode "SW11 2NN" ; lrcommon:paon ?paon ; lrcommon:street ?street ; lrcommon:town ?town ; lrcommon:district ?district ; lrcommon:county ?county . OPTIONAL { ?addr lrcommon:saon ?saon } OPTIONAL { ?addr lrcommon:locality ?locality } ?txn lrppi:propertyType/lrcommon:code ?propertyType . ?txn lrppi:newBuild ?newBuild . ?txn lrppi:estateType/lrcommon:code ?tenure . OPTIONAL { ?txn lrppi:ppdCategoryType/lrcommon:code ?ppdCategory } } ORDER BY DESC(?date) LIMIT 3`;
    const t0 = Date.now();
    const res = await fetch("https://landregistry.data.gov.uk/landregistry/query", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/sparql-results+json" },
      body: `query=${encodeURIComponent(query)}`,
      cache: "no-store",
    });
    results.lrMs = Date.now() - t0;
    results.lrStatus = res.status;
    if (res.ok) {
      const data = await res.json();
      results.lrBindings = data.results?.bindings?.length ?? 0;
      if (data.results?.bindings?.[0]) {
        const b = data.results.bindings[0];
        results.lrSample = { price: b.price?.value, street: b.street?.value };
      }
    } else {
      results.lrBody = await res.text().then((t: string) => t.slice(0, 300));
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
