const TICK_COUNT = 28;

interface CampaignProgressProps {
  currentAmount: number;
  targetAmount: number;
  status?: "active" | "completed" | "cancelled";
}

export function CampaignProgress({ currentAmount, targetAmount, status }: CampaignProgressProps) {
  const raw = (currentAmount / targetAmount) * 100;
  const percentage = currentAmount >= targetAmount ? 100 : Math.min(Math.floor(raw), 99);
  // A started campaign always shows at least one tick; only 100% fills the last one.
  const filled =
    percentage === 100
      ? TICK_COUNT
      : percentage === 0
        ? 0
        : Math.max(1, Math.min(Math.round((percentage / 100) * TICK_COUNT), TICK_COUNT - 1));

  // Completed campaigns read as merged: their ticks turn branch purple.
  const tickColor = status === "completed" ? "bg-(--chart-2)" : "bg-primary";
  const trackColor = status === "completed" ? "bg-(--chart-2)/15" : "bg-primary/15";

  return (
    <div
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% funded`}
      className="space-y-1.5"
    >
      <div className="flex gap-[3px]">
        {Array.from({ length: TICK_COUNT }, (_, i) => (
          <span
            key={i}
            className={`h-3 flex-1 rounded-[2px] transition-colors ${
              i < filled ? tickColor : trackColor
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between font-mono text-xs tabular-nums text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{currentAmount.toLocaleString()}</span> /{" "}
          {targetAmount.toLocaleString()} CZT
        </span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}
