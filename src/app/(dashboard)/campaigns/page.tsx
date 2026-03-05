import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { CampaignCard } from "@/components/campaign/campaign-card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function MyCampaignsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const result = await campaignService.listMyCampaignsResult(session.user.id, {
    page: 1,
    limit: 20,
  });

  const campaigns = result.isOk() ? result.value.campaigns : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Campaigns</h1>
        <Button asChild>
          <Link href="/campaigns/new">Create Campaign</Link>
        </Button>
      </div>

      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">You haven&apos;t created any campaigns yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              id={c.id}
              title={c.title}
              description={c.description}
              currentAmount={c.currentAmount}
              targetAmount={c.targetAmount}
              deadline={c.deadline}
              status={c.status}
            />
          ))}
        </div>
      )}
    </div>
  );
}
