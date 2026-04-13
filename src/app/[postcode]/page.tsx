import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSalesByPostcode, formatPrice } from "@/lib/land-registry";
import { getByPostcode } from "@/lib/epc-data";
import { getCrimeStats } from "@/lib/police-api";
import {
  slugToPostcode,
  formatPostcode,
  streetToSlug,
  generateRef,
  postcodeToSlug,
} from "@/lib/postcodes";
import { PropertyCard } from "@/components/property-card";
import { CrimeStatsPanel } from "@/components/crime-stats";
import { SearchBar } from "@/components/search-bar";
import type { PriceRecord, EPCCertificate, PropertyAddress } from "@/lib/types";

export const revalidate = 86400; // ISR: regenerate every 24h

type PageProps = { params: Promise<{ postcode: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postcode: slug } = await params;
  const postcode = slugToPostcode(slug);
  return {
    title: `${postcode} Property Data — Prices, EPC Ratings & Crime`,
    description: `View property data for ${postcode}: Land Registry sold prices, EPC energy ratings, local crime statistics. Free UK property data from official government sources.`,
  };
}

export default async function PostcodePage({ params }: PageProps) {
  const { postcode: slug } = await params;
  const postcode = slugToPostcode(slug);

  if (!/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(postcode.replace(/\s/g, ""))) {
    notFound();
  }

  // Fetch all data sources in parallel
  const [landRegistryData, epcData, crimeData] = await Promise.all([
    getSalesByPostcode(postcode).catch(() => ({ sales: [], addresses: [] })),
    Promise.resolve(getByPostcode(postcode)),
    getCrimeStats(postcode).catch(() => null),
  ]);

  const { sales, addresses } = landRegistryData;

  // Build EPC lookup by address
  const epcByAddress = new Map<string, EPCCertificate>();
  for (const cert of epcData) {
    const key = `${cert.address1}`.toUpperCase();
    // Keep most recent cert per address
    if (
      !epcByAddress.has(key) ||
      cert.inspectionDate > epcByAddress.get(key)!.inspectionDate
    ) {
      epcByAddress.set(key, cert);
    }
  }

  // Group sales by property (paon + street)
  const salesByProperty = new Map<string, PriceRecord[]>();
  for (const sale of sales) {
    // Find matching address
    for (const addr of addresses) {
      const key = `${addr.paon}|${addr.street}`;
      if (!salesByProperty.has(key)) salesByProperty.set(key, []);
      // Match on approximate transaction
    }
  }

  // Build property list with latest sale
  const streetGroups = new Map<string, PropertyAddress[]>();
  for (const addr of addresses) {
    if (!streetGroups.has(addr.street)) streetGroups.set(addr.street, []);
    streetGroups.get(addr.street)!.push(addr);
  }

  // Compute stats
  const allPrices = sales.map((s) => s.price).filter((p) => p > 0);
  const avgPrice =
    allPrices.length > 0
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
      : 0;
  const maxPrice = allPrices.length > 0 ? Math.max(...allPrices) : 0;
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : 0;

  // EPC distribution
  const epcDist = new Map<string, number>();
  for (const cert of epcData) {
    const rating = cert.currentEnergyRating;
    epcDist.set(rating, (epcDist.get(rating) || 0) + 1);
  }

  const ref = generateRef(postcode);

  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        {/* Reference number */}
        <div className="flex items-center justify-between mb-4">
          <span className="ref-number">{ref}</span>
          <SearchBar size="compact" />
        </div>

        <hr className="rule-double mb-6" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-4xl sm:text-5xl font-black text-bd-text tracking-tight">
            {formatPostcode(postcode)}
          </h1>
          {addresses.length > 0 && (
            <p className="mt-1 text-bd-text-secondary font-body">
              {addresses[0].town}, {addresses[0].district}
              {addresses[0].county !== addresses[0].district &&
                `, ${addresses[0].county}`}
            </p>
          )}
        </div>

        {/* Key stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Recorded Sales
            </p>
            <p className="data-value text-3xl text-bd-text">{sales.length}</p>
          </div>
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Average Price
            </p>
            <p className="data-value text-3xl text-bd-text">
              {avgPrice > 0 ? formatPrice(avgPrice) : "—"}
            </p>
          </div>
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Price Range
            </p>
            <p className="data-value text-lg text-bd-text">
              {minPrice > 0 ? `${formatPrice(minPrice)} – ${formatPrice(maxPrice)}` : "—"}
            </p>
          </div>
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              EPC Certificates
            </p>
            <p className="data-value text-3xl text-bd-text">{epcData.length}</p>
          </div>
        </div>

        {/* EPC Distribution */}
        {epcData.length > 0 && (
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4 border-b-2 border-bd-rule pb-2">
              EPC Rating Distribution
            </h2>
            <div className="flex items-end gap-1 h-24">
              {["A", "B", "C", "D", "E", "F", "G"].map((rating) => {
                const count = epcDist.get(rating) || 0;
                const maxCount = Math.max(...Array.from(epcDist.values()), 1);
                const heightPct = (count / maxCount) * 100;
                return (
                  <div key={rating} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs font-mono text-bd-text-secondary">
                      {count > 0 ? count : ""}
                    </span>
                    <div
                      className={`w-full epc-${rating.toLowerCase()}`}
                      style={{ height: `${Math.max(heightPct, 4)}%` }}
                    />
                    <span className="text-xs font-mono font-bold">{rating}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <hr className="rule-double my-8" />

        {/* Streets */}
        <section className="mb-8">
          <h2 className="font-heading text-xl font-bold mb-4 border-b-2 border-bd-rule pb-2">
            Streets in {formatPostcode(postcode)}
          </h2>
          {streetGroups.size > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {Array.from(streetGroups.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([street, addrs]) => (
                  <Link
                    key={street}
                    href={`/${postcodeToSlug(postcode)}/${streetToSlug(street)}`}
                    className="border border-bd-grid bg-bd-surface p-3 hover:border-l-[3px] hover:border-l-bd-orange transition-all group"
                  >
                    <p className="font-heading font-bold text-bd-text group-hover:text-bd-orange transition-colors">
                      {street}
                    </p>
                    <p className="text-xs text-bd-text-secondary font-mono mt-0.5">
                      {addrs.length} {addrs.length === 1 ? "property" : "properties"}
                    </p>
                  </Link>
                ))}
            </div>
          ) : (
            <p className="text-sm text-bd-text-secondary italic">
              No street data found for this postcode in Land Registry records.
            </p>
          )}
        </section>

        {/* Recent sales */}
        {sales.length > 0 && (
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4 border-b-2 border-bd-rule pb-2">
              Recent Sales
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-bd-rule text-left">
                    <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider">
                      Address
                    </th>
                    <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider">
                      Date
                    </th>
                    <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider">
                      Price
                    </th>
                    <th className="py-2 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider hidden sm:table-cell">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sales.slice(0, 20).map((sale, i) => {
                    const addr = addresses[i % addresses.length];
                    return (
                      <tr key={sale.transactionId} className="border-b border-bd-grid">
                        <td className="py-2 pr-4 text-bd-text">
                          {addr ? `${addr.paon} ${addr.street}` : "—"}
                        </td>
                        <td className="py-2 pr-4 font-mono text-bd-text-secondary text-xs">
                          {new Date(sale.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="py-2 pr-4 data-value font-semibold">
                          {formatPrice(sale.price)}
                        </td>
                        <td className="py-2 text-bd-text-secondary hidden sm:table-cell text-xs">
                          {sale.propertyType === "D"
                            ? "Detached"
                            : sale.propertyType === "S"
                            ? "Semi"
                            : sale.propertyType === "T"
                            ? "Terraced"
                            : sale.propertyType === "F"
                            ? "Flat"
                            : "Other"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Crime stats */}
        {crimeData && (
          <section className="mb-8">
            <h2 className="font-heading text-xl font-bold mb-4 border-b-2 border-bd-rule pb-2">
              Crime Near {formatPostcode(postcode)}
            </h2>
            <CrimeStatsPanel stats={crimeData} />
          </section>
        )}

        <hr className="rule-double mt-8" />
      </div>
    </div>
  );
}
