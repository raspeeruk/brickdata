import type { CrimeStats } from "@/lib/types";

export function CrimeStatsPanel({ stats }: { stats: CrimeStats }) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="data-value text-3xl text-bd-text">
          {stats.totalCrimes}
        </span>
        <span className="text-sm text-bd-text-secondary">
          crimes reported near this postcode ({stats.period})
        </span>
      </div>

      <div className="space-y-1.5">
        {stats.breakdown.map((item) => {
          const pct = (item.count / stats.totalCrimes) * 100;
          return (
            <div key={item.category} className="flex items-center gap-3">
              <div className="w-32 text-xs text-bd-text-secondary truncate font-body">
                {item.category}
              </div>
              <div className="flex-1 h-4 bg-bd-grid relative">
                <div
                  className="h-full bg-bd-blue/70"
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
              <div className="w-8 text-right font-mono text-xs text-bd-text">
                {item.count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
