import { Metadata } from "next";
import Link from "next/link";
import { getSalesForProperty, formatPrice, priceChange } from "@/lib/land-registry";
import { getProperty, getByPostcode } from "@/lib/epc-data";
import { getCrimeStats } from "@/lib/police-api";
import {
  slugToPostcode,
  slugToStreet,
  slugToNumber,
  formatPostcode,
  postcodeToSlug,
  streetToSlug,
  generateRef,
} from "@/lib/postcodes";
import { PriceHistory } from "@/components/price-history";
import { EPCBar } from "@/components/epc-badge";
import { CrimeStatsPanel } from "@/components/crime-stats";
import { SearchBar } from "@/components/search-bar";
import { PROPERTY_TYPES } from "@/lib/types";
import type { EPCCertificate } from "@/lib/types";

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ postcode: string; street: string; number: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postcode: pcSlug, street: stSlug, number: numSlug } = await params;
  const postcode = slugToPostcode(pcSlug);
  const street = slugToStreet(stSlug);
  const number = slugToNumber(numSlug);
  return {
    title: `${number} ${street}, ${postcode} — Price History & EPC`,
    description: `Property data for ${number} ${street}, ${postcode}: full Land Registry price history, EPC energy rating, local crime stats. Free official UK data.`,
  };
}

export default async function PropertyPage({ params }: PageProps) {
  const { postcode: pcSlug, street: stSlug, number: numSlug } = await params;
  const postcode = slugToPostcode(pcSlug);
  const street = slugToStreet(stSlug);
  const number = slugToNumber(numSlug);

  // Fetch all data in parallel
  const [landRegistryData, epcResults, crimeData] = await Promise.all([
    getSalesForProperty(postcode, street, number).catch(() => ({
      sales: [],
      address: null,
    })),
    Promise.resolve(
      (() => {
        const match = getProperty(postcode, stSlug, numSlug);
        return match ? [match] : getByPostcode(postcode);
      })()
    ),
    getCrimeStats(postcode).catch(() => null),
  ]);

  const { sales, address } = landRegistryData;

  // Get most recent EPC cert
  const epc =
    epcResults.length > 0
      ? epcResults.sort((a, b) =>
          b.inspectionDate.localeCompare(a.inspectionDate)
        )[0]
      : null;

  const latestSale = sales.length > 0 ? sales[0] : null;
  const change = priceChange(sales);

  const ref = generateRef(postcode, street, number);

  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        {/* Reference */}
        <div className="flex items-center justify-between mb-4">
          <span className="ref-number">{ref}</span>
          <SearchBar size="compact" />
        </div>

        <hr className="rule-double mb-6" />

        {/* Breadcrumb */}
        <nav className="text-sm font-mono text-bd-text-secondary mb-4">
          <Link
            href={`/${postcodeToSlug(postcode)}`}
            className="text-bd-blue hover:underline"
          >
            {formatPostcode(postcode)}
          </Link>
          <span className="mx-2">/</span>
          <Link
            href={`/${postcodeToSlug(postcode)}/${streetToSlug(street)}`}
            className="text-bd-blue hover:underline"
          >
            {street}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-bd-text">{number}</span>
        </nav>

        {/* Property header */}
        <h1 className="font-heading text-3xl sm:text-4xl font-black text-bd-text tracking-tight">
          {number} {street}
        </h1>
        <p className="text-bd-text-secondary font-mono text-sm mt-1 mb-6">
          {formatPostcode(postcode)}
          {address && `, ${address.town}, ${address.district}`}
        </p>

        {/* Hero stat — latest price */}
        {latestSale && (
          <div className="border border-bd-grid bg-bd-surface p-6 mb-6">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Last Sold Price
            </p>
            <p className="data-value text-5xl sm:text-6xl text-bd-text tracking-tight">
              {formatPrice(latestSale.price)}
            </p>
            <p className="text-sm text-bd-text-secondary font-mono mt-2">
              {new Date(latestSale.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              {PROPERTY_TYPES[latestSale.propertyType] || "Property"}
              {" · "}
              {latestSale.tenure === "F" ? "Freehold" : "Leasehold"}
            </p>
            {change && (
              <p
                className={`text-sm font-mono mt-2 ${
                  change.direction === "up"
                    ? "text-bd-positive"
                    : change.direction === "down"
                    ? "text-bd-negative"
                    : "text-bd-text-secondary"
                }`}
              >
                {change.direction === "up" ? "+" : ""}
                {formatPrice(change.amount)} ({change.direction === "up" ? "+" : ""}
                {change.percentage.toFixed(1)}%) since first recorded sale
              </p>
            )}
          </div>
        )}

        {/* Data grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* EPC */}
          <div className="border border-bd-grid bg-bd-surface p-5 lg:col-span-1">
            <h2 className="font-heading font-bold text-sm mb-4 border-b border-bd-grid pb-2">
              Energy Performance
            </h2>
            {epc ? (
              <div className="space-y-4">
                <EPCBar
                  current={epc.currentEnergyRating}
                  potential={epc.potentialEnergyRating}
                />
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-bd-text-secondary">Floor Area</p>
                    <p className="data-value">{epc.totalFloorArea}m²</p>
                  </div>
                  <div>
                    <p className="text-xs text-bd-text-secondary">Rooms</p>
                    <p className="data-value">{epc.numberOfRooms}</p>
                  </div>
                  <div>
                    <p className="text-xs text-bd-text-secondary">Type</p>
                    <p className="text-bd-text text-sm">
                      {epc.propertyType} ({epc.builtForm})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-bd-text-secondary">Age</p>
                    <p className="text-bd-text text-sm">
                      {epc.constructionAgeBand}
                    </p>
                  </div>
                </div>

                <hr className="border-bd-grid" />

                <div className="space-y-2 text-sm">
                  <h3 className="font-heading font-bold text-xs text-bd-text-secondary uppercase tracking-wider">
                    Annual Costs
                  </h3>
                  <div className="flex justify-between">
                    <span className="text-bd-text-secondary">Heating</span>
                    <span className="data-value">
                      {formatPrice(epc.heatingCostCurrent)}/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bd-text-secondary">Hot Water</span>
                    <span className="data-value">
                      {formatPrice(epc.hotWaterCostCurrent)}/yr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-bd-text-secondary">Lighting</span>
                    <span className="data-value">
                      {formatPrice(epc.lightingCostCurrent)}/yr
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-bd-grid pt-1">
                    <span className="text-bd-text-secondary">
                      CO₂ Emissions
                    </span>
                    <span className="data-value">
                      {epc.co2EmissionsCurrent}t/yr
                    </span>
                  </div>
                </div>

                <hr className="border-bd-grid" />

                <div className="space-y-1 text-xs text-bd-text-secondary">
                  <p>
                    <span className="font-medium">Walls:</span>{" "}
                    {epc.wallsDescription}
                  </p>
                  <p>
                    <span className="font-medium">Roof:</span>{" "}
                    {epc.roofDescription}
                  </p>
                  <p>
                    <span className="font-medium">Windows:</span>{" "}
                    {epc.windowsDescription}
                  </p>
                  <p>
                    <span className="font-medium">Heating:</span>{" "}
                    {epc.mainHeatDescription}
                  </p>
                  <p>
                    <span className="font-medium">Fuel:</span> {epc.mainFuel}
                  </p>
                </div>

                <p className="text-xs text-bd-text-secondary font-mono">
                  Inspected{" "}
                  {new Date(epc.inspectionDate).toLocaleDateString("en-GB")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-bd-text-secondary italic">
                No EPC certificate found for this property.
              </p>
            )}
          </div>

          {/* Price history */}
          <div className="border border-bd-grid bg-bd-surface p-5 lg:col-span-2">
            <h2 className="font-heading font-bold text-sm mb-4 border-b border-bd-grid pb-2">
              Price History — Land Registry
            </h2>
            <PriceHistory sales={sales} />
          </div>
        </div>

        {/* Crime */}
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
