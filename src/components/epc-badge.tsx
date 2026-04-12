interface EPCBadgeProps {
  rating: string; // A-G
  score?: number; // 0-100
  size?: "sm" | "md" | "lg";
}

export function EPCBadge({ rating, score, size = "md" }: EPCBadgeProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-sm",
    md: "w-12 h-12 text-xl",
    lg: "w-16 h-16 text-3xl",
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} epc-${rating.toLowerCase()} flex items-center justify-center font-mono font-bold`}
      >
        {rating}
      </div>
      {score !== undefined && (
        <span className="data-value text-bd-text-secondary text-sm">
          {score}/100
        </span>
      )}
    </div>
  );
}

export function EPCBar({
  current,
  potential,
}: {
  current: string;
  potential: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-center">
        <p className="text-xs text-bd-text-secondary mb-1 font-body">Current</p>
        <EPCBadge rating={current} size="md" />
      </div>
      <div className="text-bd-text-secondary text-lg">&rarr;</div>
      <div className="text-center">
        <p className="text-xs text-bd-text-secondary mb-1 font-body">
          Potential
        </p>
        <EPCBadge rating={potential} size="md" />
      </div>
    </div>
  );
}
