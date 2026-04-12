import { Metadata } from "next";
import { searchByAddress } from "@/lib/epc-api";
import { SearchBar } from "@/components/search-bar";
import { postcodeToSlug, streetToSlug, numberToSlug } from "@/lib/postcodes";
import Link from "next/link";
import type { EPCCertificate } from "@/lib/types";

export const metadata: Metadata = {
  title: "Search UK Property Data",
  description:
    "Search any UK address or postcode for property data: price history, EPC ratings, and more.",
};

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  let results: EPCCertificate[] = [];
  if (q && q.trim().length > 2) {
    results = await searchByAddress(q.trim(), 50).catch(() => []);
  }

  return (
    <div className="grid-pattern min-h-screen">
      <div className="mx-auto max-w-[1200px] px-4 py-8">
        <h1 className="font-heading text-3xl font-black text-bd-text tracking-tight mb-6">
          Search Property Data
        </h1>

        <SearchBar size="large" />

        {q && (
          <>
            <hr className="rule-double my-6" />
            <p className="text-sm text-bd-text-secondary mb-4 font-mono">
              {results.length} results for &ldquo;{q}&rdquo;
            </p>

            {results.length > 0 ? (
              <div className="space-y-2">
                {results.map((cert) => (
                  <Link
                    key={cert.lmkKey}
                    href={`/${postcodeToSlug(cert.postcode)}/${streetToSlug(
                      cert.address2 || cert.address1
                    )}/${numberToSlug(cert.address1.split(",")[0].split(" ")[0])}`}
                    className="block border border-bd-grid bg-bd-surface p-4 hover:border-l-[3px] hover:border-l-bd-orange transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-heading font-bold text-bd-text group-hover:text-bd-orange transition-colors">
                          {cert.address1}
                          {cert.address2 && `, ${cert.address2}`}
                        </p>
                        <p className="text-sm text-bd-text-secondary font-mono mt-0.5">
                          {cert.postcode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-8 h-8 text-sm font-mono font-bold flex items-center justify-center epc-${cert.currentEnergyRating.toLowerCase()}`}
                        >
                          {cert.currentEnergyRating}
                        </span>
                        {cert.totalFloorArea > 0 && (
                          <span className="text-xs font-mono text-bd-text-secondary">
                            {cert.totalFloorArea}m²
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-bd-text-secondary italic">
                No properties found. Try a different address or postcode.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
