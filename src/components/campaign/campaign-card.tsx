import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "./campaign-progress";

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
  const variant =
    status === "completed" ? "default" : status === "cancelled" ? "destructive" : "secondary";

  return (
    <Link href={`/campaign/${id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="line-clamp-1">{title}</CardTitle>
            <Badge variant={variant}>{status}</Badge>
          </div>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignProgress currentAmount={currentAmount} targetAmount={targetAmount} />
        </CardContent>
        <CardFooter className="text-sm text-muted-foreground">
          Deadline: {new Date(deadline).toLocaleDateString()}
        </CardFooter>
      </Card>
    </Link>
  );
}
