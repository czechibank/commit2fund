import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CampaignStatus = "active" | "completed" | "cancelled";

// Git semantics: active = open (green), completed = merged (purple), cancelled = closed (red).
const statusStyles: Record<CampaignStatus, string> = {
  active: "border-primary/30 bg-primary/10 text-primary",
  completed: "border-(--chart-2)/30 bg-(--chart-2)/10 text-(--chart-2)",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-mono text-[0.7rem] uppercase", statusStyles[status])}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {status}
    </Badge>
  );
}
