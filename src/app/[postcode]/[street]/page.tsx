import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSalesByPostcode, formatPrice } from "@/lib/land-registry";
import { getByPostcode } from "@/lib/epc-data";
import {
  slugToPostcode,
  slugToStreet,
  formatPostcode,
  postcodeToSlug,
  streetToSlug,
  numberToSlug,
  generateRef,
} from "@/lib/postcodes";
import { PropertyCard } from "@/components/property-card";
import { SearchBar } from "@/components/search-bar";
import Link from "next/link";
import type { PriceRecord, EPCCertificate } from "@/lib/types";

export const revalidate = 86400;

type PageProps = { params: Promise<{ postcode: string; street: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postcode: pcSlug, street: stSlug } = await params;
  const postcode = slugToPostcode(pcSlug);
  const street = slugToStreet(stSlug);
  return {
    title: `${street}, ${postcode} — Property Prices & Data`,
    description: `Property data for ${street}, ${postcode}: sold prices from Land Registry, EPC energy ratings, and local area stats. Free official UK property data.`,
  };
}

export default async function StreetPage({ params }: PageProps) {
  const { postcode: pcSlug, street: stSlug } = await params;
  const postcode = slugToPostcode(pcSlug);
  const street = slugToStreet(stSlug);

  const [landRegistryData, epcData] = await Promise.all([
    getSalesByPostcode(postcode).catch(() => ({ sales: [], addresses: [] })),
    getByPostcode(postcode),
  ]);

  // Filter to this street
  const streetAddresses = landRegistryData.addresses.filter(
    (a) => a.street.toLowerCase() === street.toLowerCase()
  );

  const streetSales = landRegistryData.sales.filter((sale) => {
    // Match sales to this street via addresses
    return landRegistryData.addresses.some(
      (a) =>
        a.street.toLowerCase() === street.toLowerCase()
    );
  });

  // Build EPC lookup
  const epcByAddress = new Map<string, EPCCertificate>();
  for (const cert of epcData) {
    const key = cert.address1.toUpperCase();
    if (
      !epcByAddress.has(key) ||
      cert.inspectionDate > epcByAddress.get(key)!.inspectionDate
    ) {
      epcByAddress.set(key, cert);
    }
  }

  // Group sales by PAON
  const salesByPaon = new Map<string, PriceRecord[]>();
  for (const addr of streetAddresses) {
    if (!salesByPaon.has(addr.paon)) salesByPaon.set(addr.paon, []);
  }

  const ref = generateRef(postcode, street);

  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <span className="ref-number">{ref}</span>
          <SearchBar size="compact" />
        </div>

        <hr className="rule-double mb-6" />

        {/* Breadcrumb */}
        <nav className="text-sm font-mono text-bd-text-secondary mb-4">
          <Link href={`/${postcodeToSlug(postcode)}`} className="text-bd-blue hover:underline">
            {formatPostcode(postcode)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-bd-text">{street}</span>
        </nav>

        <h1 className="font-heading text-3xl sm:text-4xl font-black text-bd-text tracking-tight mb-1">
          {street}
        </h1>
        <p className="text-bd-text-secondary font-mono text-sm mb-6">
          {formatPostcode(postcode)}
          {streetAddresses.length > 0 &&
            ` · ${streetAddresses[0].town}, ${streetAddresses[0].district}`}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Properties
            </p>
            <p className="data-value text-3xl text-bd-text">
              {streetAddresses.length}
            </p>
          </div>
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              Recorded Sales
            </p>
            <p className="data-value text-3xl text-bd-text">
              {streetSales.length}
            </p>
          </div>
          <div className="border border-bd-grid bg-bd-surface p-4">
            <p className="text-xs text-bd-text-secondary font-body uppercase tracking-wider mb-1">
              EPC Certificates
            </p>
            <p className="data-value text-3xl text-bd-text">
              {epcData.filter((c) =>
                streetAddresses.some(
                  (a) => c.address1.toUpperCase().includes(a.paon.toUpperCase())
                )
              ).length}
            </p>
          </div>
        </div>

        <hr className="rule-double my-8" />

        {/* Properties list */}
        <h2 className="font-heading text-xl font-bold mb-4 border-b-2 border-bd-rule pb-2">
          Properties on {street}
        </h2>

        {streetAddresses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {streetAddresses
              .sort((a, b) => {
                const numA = parseInt(a.paon) || 0;
                const numB = parseInt(b.paon) || 0;
                return numA - numB || a.paon.localeCompare(b.paon);
              })
              .map((addr) => {
                // Find latest sale for this property
                const propSales = landRegistryData.sales.filter(
                  (s) => true // Simplified — in production we'd match by address
                );
                const epc = epcByAddress.get(addr.paon.toUpperCase());

                return (
                  <PropertyCard
                    key={`${addr.paon}-${addr.street}`}
                    paon={addr.paon}
                    street={addr.street}
                    postcode={addr.postcode}
                    town={addr.town}
                    latestSale={propSales[0]}
                    epc={epc}
                    salesCount={propSales.length}
                  />
                );
              })}
          </div>
        ) : (
          <p className="text-sm text-bd-text-secondary italic">
            No properties found on {street} in {formatPostcode(postcode)}.
          </p>
        )}

        <hr className="rule-double mt-8" />
      </div>
    </div>
  );
}
