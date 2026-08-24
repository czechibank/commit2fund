import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { CampaignProgress } from "./campaign-progress";
import { CampaignStatusBadge } from "./campaign-status-badge";

interface CampaignCardProps {
  id: string;
  title: string;
  description: string;
  currentAmount: number;
  targetAmount: number;
  deadline: Date;
  status: "active" | "completed" | "cancelled";
}

export function CampaignCard({
  id,
  title,
  description,
  currentAmount,
  targetAmount,
  deadline,
  status,
}: CampaignCardProps) {
  return (
    <Link href={`/campaign/${id}`}>
      <Card className="gap-4 overflow-hidden pt-0 transition-[translate,box-shadow] hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-4 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            ~/campaigns/{slugify(title)}
          </span>
          <CampaignStatusBadge status={status} />
        </div>
        <CardHeader>
          <CardTitle className="line-clamp-1">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignProgress
            currentAmount={currentAmount}
            targetAmount={targetAmount}
            status={status}
          />
        </CardContent>
        <CardFooter className="font-mono text-xs text-muted-foreground">
          deadline: {new Date(deadline).toLocaleDateString()}
        </CardFooter>
      </Card>
    </Link>
  );
}
