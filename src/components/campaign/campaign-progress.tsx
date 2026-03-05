import { Progress } from "@/components/ui/progress";

interface CampaignProgressProps {
  currentAmount: number;
  targetAmount: number;
}

export function CampaignProgress({ currentAmount, targetAmount }: CampaignProgressProps) {
  const percentage = Math.min(Math.round((currentAmount / targetAmount) * 100), 100);

  return (
    <div className="space-y-1">
      <Progress value={percentage} />
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>
          {currentAmount.toLocaleString()} / {targetAmount.toLocaleString()} CZECHITOKEN
        </span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}
