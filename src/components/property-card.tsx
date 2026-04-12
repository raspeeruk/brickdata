import Link from "next/link";
import type { PriceRecord } from "@/lib/types";
import type { EPCCertificate } from "@/lib/types";
import { formatPrice } from "@/lib/land-registry";
import { postcodeToSlug, streetToSlug, numberToSlug } from "@/lib/postcodes";
import { PROPERTY_TYPES } from "@/lib/types";

interface PropertyCardProps {
  paon: string;
  street: string;
  postcode: string;
  town: string;
  latestSale?: PriceRecord;
  epc?: EPCCertificate;
  salesCount: number;
}

export function PropertyCard({
  paon,
  street,
  postcode,
  town,
  latestSale,
  epc,
  salesCount,
}: PropertyCardProps) {
  const href = `/${postcodeToSlug(postcode)}/${streetToSlug(street)}/${numberToSlug(paon)}`;

  return (
    <Link
      href={href}
      className="block border border-bd-grid bg-bd-surface p-4 hover:border-l-[3px] hover:border-l-bd-orange transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-bd-text group-hover:text-bd-orange transition-colors truncate">
            {paon} {street}
          </h3>
          <p className="text-sm text-bd-text-secondary font-mono mt-0.5">
            {postcode} &middot; {town}
          </p>
        </div>
        <div className="text-right shrink-0">
          {latestSale ? (
            <>
              <p className="data-value text-lg text-bd-text">
                {formatPrice(latestSale.price)}
              </p>
              <p className="text-xs text-bd-text-secondary font-mono">
                {new Date(latestSale.date).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </>
          ) : (
            <p className="text-xs text-bd-text-secondary italic">
              No sales recorded
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 mt-3 text-xs text-bd-text-secondary">
        {epc && (
          <span className="flex items-center gap-1">
            <span
              className={`w-5 h-5 text-[10px] font-mono font-bold flex items-center justify-center epc-${epc.currentEnergyRating.toLowerCase()}`}
            >
              {epc.currentEnergyRating}
            </span>
            EPC
          </span>
        )}
        {latestSale && (
          <span>{PROPERTY_TYPES[latestSale.propertyType]}</span>
        )}
        {salesCount > 1 && (
          <span className="font-mono">{salesCount} sales</span>
        )}
        {epc?.totalFloorArea ? (
          <span className="font-mono">{epc.totalFloorArea}m²</span>
        ) : null}
      </div>
    </Link>
  );
}
