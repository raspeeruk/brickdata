import type { PriceRecord } from "@/lib/types";
import { formatPrice, priceChange } from "@/lib/land-registry";
import { PROPERTY_TYPES, TENURE_TYPES } from "@/lib/types";

export function PriceHistory({ sales }: { sales: PriceRecord[] }) {
  if (sales.length === 0) {
    return (
      <p className="text-sm text-bd-text-secondary italic">
        No recorded sales found in Land Registry data.
      </p>
    );
  }

  const change = priceChange(sales);

  return (
    <div>
      {/* Summary stats */}
      {change && (
        <div className="flex items-baseline gap-4 mb-4">
          <span
            className={`data-value text-2xl ${
              change.direction === "up"
                ? "text-bd-positive"
                : change.direction === "down"
                ? "text-bd-negative"
                : "text-bd-text-secondary"
            }`}
          >
            {change.direction === "up" ? "+" : ""}
            {formatPrice(change.amount)}
          </span>
          <span className="text-sm text-bd-text-secondary font-mono">
            ({change.direction === "up" ? "+" : ""}
            {change.percentage.toFixed(1)}% since first recorded sale)
          </span>
        </div>
      )}

      {/* Sales table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-bd-rule text-left">
              <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider">
                Date
              </th>
              <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider">
                Price
              </th>
              <th className="py-2 pr-4 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider hidden sm:table-cell">
                Type
              </th>
              <th className="py-2 font-body font-medium text-bd-text-secondary text-xs uppercase tracking-wider hidden sm:table-cell">
                Tenure
              </th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale, i) => (
              <tr
                key={sale.transactionId}
                className={`border-b border-bd-grid ${
                  i === 0 ? "bg-bd-surface" : ""
                }`}
              >
                <td className="py-2 pr-4 font-mono text-bd-text-secondary">
                  {new Date(sale.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
                <td className="py-2 pr-4 data-value text-bd-text font-semibold">
                  {formatPrice(sale.price)}
                </td>
                <td className="py-2 pr-4 text-bd-text-secondary hidden sm:table-cell">
                  {PROPERTY_TYPES[sale.propertyType] || sale.propertyType}
                  {sale.isNewBuild && (
                    <span className="ml-1 text-xs bg-bd-orange/10 text-bd-orange px-1.5 py-0.5">
                      New Build
                    </span>
                  )}
                </td>
                <td className="py-2 text-bd-text-secondary hidden sm:table-cell">
                  {TENURE_TYPES[sale.tenure] || sale.tenure}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PriceTag({ price }: { price: number }) {
  return (
    <span className="font-mono font-semibold text-bd-text">
      {formatPrice(price)}
    </span>
  );
}
