import type { PriceRecord, PropertyAddress } from "./types";

/**
 * Land Registry Price Paid Data — SPARQL endpoint
 * Free, no auth, Open Government Licence v3.0
 * Returns every recorded sale for a given postcode since 1995
 */
const SPARQL_ENDPOINT = "https://landregistry.data.gov.uk/landregistry/query";

interface SparqlBinding {
  value: string;
  type: string;
}

interface SparqlResult {
  price: SparqlBinding;
  date: SparqlBinding;
  paon: SparqlBinding;
  saon?: SparqlBinding;
  street: SparqlBinding;
  locality?: SparqlBinding;
  town: SparqlBinding;
  district: SparqlBinding;
  county: SparqlBinding;
  propertyType: SparqlBinding;
  newBuild: SparqlBinding;
  tenure: SparqlBinding;
  transactionId: SparqlBinding;
  ppdCategory?: SparqlBinding;
}

function buildPostcodeQuery(postcode: string): string {
  const clean = postcode.replace(/\s/g, "").toUpperCase();
  // Re-format with space: "SW1A2AA" -> "SW1A 2AA"
  const formatted =
    clean.length > 3
      ? `${clean.slice(0, -3)} ${clean.slice(-3)}`
      : clean;

  return `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

    SELECT ?transactionId ?price ?date ?paon ?saon ?street ?locality ?town ?district ?county ?propertyType ?newBuild ?tenure ?ppdCategory
    WHERE {
      ?txn lrppi:pricePaid ?price ;
           lrppi:transactionDate ?date ;
           lrppi:propertyAddress ?addr ;
           lrppi:transactionId ?transactionId .

      ?addr lrcommon:postcode "${formatted}" ;
            lrcommon:paon ?paon ;
            lrcommon:street ?street ;
            lrcommon:town ?town ;
            lrcommon:district ?district ;
            lrcommon:county ?county .

      OPTIONAL { ?addr lrcommon:saon ?saon }
      OPTIONAL { ?addr lrcommon:locality ?locality }

      ?txn lrppi:propertyType ?ptNode .
      ?ptNode lrcommon:code ?propertyType .
      ?txn lrppi:newBuild ?newBuild .
      ?txn lrppi:estateType ?etNode .
      ?etNode lrcommon:code ?tenure .

      OPTIONAL {
        ?txn lrppi:ppdCategoryType ?pcNode .
        ?pcNode lrcommon:code ?ppdCategory .
      }
    }
    ORDER BY DESC(?date)
    LIMIT 500
  `;
}

function buildAddressQuery(postcode: string, street: string, number: string): string {
  const cleanPC = postcode.replace(/\s/g, "").toUpperCase();
  const formatted =
    cleanPC.length > 3
      ? `${cleanPC.slice(0, -3)} ${cleanPC.slice(-3)}`
      : cleanPC;

  return `
    PREFIX lrppi: <http://landregistry.data.gov.uk/def/ppi/>
    PREFIX lrcommon: <http://landregistry.data.gov.uk/def/common/>

    SELECT ?transactionId ?price ?date ?paon ?saon ?street ?locality ?town ?district ?county ?propertyType ?newBuild ?tenure ?ppdCategory
    WHERE {
      ?txn lrppi:pricePaid ?price ;
           lrppi:transactionDate ?date ;
           lrppi:propertyAddress ?addr ;
           lrppi:transactionId ?transactionId .

      ?addr lrcommon:postcode "${formatted}" ;
            lrcommon:paon ?paon ;
            lrcommon:street ?street ;
            lrcommon:town ?town ;
            lrcommon:district ?district ;
            lrcommon:county ?county .

      OPTIONAL { ?addr lrcommon:saon ?saon }
      OPTIONAL { ?addr lrcommon:locality ?locality }

      FILTER(UCASE(?paon) = "${number.toUpperCase()}")

      ?txn lrppi:propertyType ?ptNode .
      ?ptNode lrcommon:code ?propertyType .
      ?txn lrppi:newBuild ?newBuild .
      ?txn lrppi:estateType ?etNode .
      ?etNode lrcommon:code ?tenure .

      OPTIONAL {
        ?txn lrppi:ppdCategoryType ?pcNode .
        ?pcNode lrcommon:code ?ppdCategory .
      }
    }
    ORDER BY DESC(?date)
    LIMIT 100
  `;
}

function parseTenure(uri: string): "F" | "L" {
  if (uri.includes("leasehold") || uri === "L") return "L";
  return "F";
}

function parsePropertyType(uri: string): "D" | "S" | "T" | "F" | "O" {
  const map: Record<string, "D" | "S" | "T" | "F" | "O"> = {
    detached: "D", "D": "D",
    "semi-detached": "S", "S": "S",
    terraced: "T", "T": "T",
    "flat-maisonette": "F", "F": "F",
    other: "O", "O": "O",
  };
  return map[uri] || "O";
}

function parseNewBuild(val: string): boolean {
  return val === "true" || val === "Y";
}

function parseResults(bindings: SparqlResult[]): {
  sales: PriceRecord[];
  addresses: Map<string, PropertyAddress>;
} {
  const sales: PriceRecord[] = [];
  const addresses = new Map<string, PropertyAddress>();

  for (const b of bindings) {
    const paon = b.paon.value;
    const street = b.street.value;
    const key = `${paon}|${street}`;

    if (!addresses.has(key)) {
      addresses.set(key, {
        paon,
        saon: b.saon?.value,
        street,
        locality: b.locality?.value,
        town: b.town.value,
        district: b.district.value,
        county: b.county.value,
        postcode: "", // filled by caller
      });
    }

    sales.push({
      transactionId: b.transactionId.value,
      price: Number(b.price.value),
      date: b.date.value,
      propertyType: parsePropertyType(b.propertyType.value),
      isNewBuild: parseNewBuild(b.newBuild.value),
      tenure: parseTenure(b.tenure.value),
      category: (b.ppdCategory?.value === "B" ? "B" : "A") as "A" | "B",
    });
  }

  return { sales, addresses };
}

async function runSparqlQuery(query: string): Promise<SparqlResult[]> {
  const res = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/sparql-results+json",
    },
    body: `query=${encodeURIComponent(query)}`,
    next: { revalidate: 86400 }, // Cache 24h
  });

  if (!res.ok) {
    console.error(`SPARQL error: ${res.status} ${res.statusText}`);
    return [];
  }

  const data = await res.json();
  return data.results?.bindings || [];
}

/** Get all sales for a postcode */
export async function getSalesByPostcode(postcode: string) {
  const query = buildPostcodeQuery(postcode);
  const bindings = await runSparqlQuery(query);
  const { sales, addresses } = parseResults(bindings);

  // Attach postcode to all addresses
  const cleanPC = postcode.replace(/\s/g, "").toUpperCase();
  const formatted =
    cleanPC.length > 3
      ? `${cleanPC.slice(0, -3)} ${cleanPC.slice(-3)}`
      : cleanPC;

  for (const addr of addresses.values()) {
    addr.postcode = formatted;
  }

  return { sales, addresses: Array.from(addresses.values()) };
}

/** Get all sales for a specific property */
export async function getSalesForProperty(
  postcode: string,
  street: string,
  number: string
) {
  const query = buildAddressQuery(postcode, street, number);
  const bindings = await runSparqlQuery(query);
  const { sales, addresses } = parseResults(bindings);

  const cleanPC = postcode.replace(/\s/g, "").toUpperCase();
  const formatted =
    cleanPC.length > 3
      ? `${cleanPC.slice(0, -3)} ${cleanPC.slice(-3)}`
      : cleanPC;

  for (const addr of addresses.values()) {
    addr.postcode = formatted;
  }

  return {
    sales,
    address: addresses.values().next().value || null,
  };
}

/** Format price as GBP */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(price);
}

/** Calculate price change between first and last sale */
export function priceChange(sales: PriceRecord[]): {
  amount: number;
  percentage: number;
  direction: "up" | "down" | "flat";
} | null {
  if (sales.length < 2) return null;
  const sorted = [...sales].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const first = sorted[0].price;
  const last = sorted[sorted.length - 1].price;
  const amount = last - first;
  const percentage = ((amount / first) * 100);
  return {
    amount,
    percentage,
    direction: amount > 0 ? "up" : amount < 0 ? "down" : "flat",
  };
}
