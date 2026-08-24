import Link from "next/link";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { CampaignCard } from "@/components/campaign/campaign-card";
import { EmptyState } from "@/components/empty-state";

export default async function HomePage() {
  const [activeResult, completedResult] = await Promise.all([
    campaignService.listActiveCampaignsResult({ page: 1, limit: 100 }),
    campaignService.listCompletedCampaignsResult({ page: 1, limit: 100 }),
  ]);

  const activeCampaigns = activeResult.isOk() ? activeResult.value.campaigns : [];
  const completedCampaigns = completedResult.isOk() ? completedResult.value.campaigns : [];

  return (
    <div className="space-y-10">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">Fund ideas with Czechitokens</h1>
        <p className="text-lg text-muted-foreground">
          Every good idea starts at 0%. Commit your tokens to the ones that deserve to ship.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Active Campaigns</h2>
        {activeCampaigns.length === 0 ? (
          <EmptyState
            command="fund log --active"
            output="this community does not have any campaigns yet"
          >
            An empty repo is pure potential.{" "}
            <Link href="/campaigns/new" className="underline">
              Push the first campaign
            </Link>{" "}
            and give everyone something to fund.
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeCampaigns.map((c) => (
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
      </section>

      {completedCampaigns.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Completed Campaigns</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {completedCampaigns.map((c) => (
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
        </section>
      )}
    </div>
  );
}
