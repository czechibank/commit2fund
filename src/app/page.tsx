import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { Header } from "@/components/layout/header";
import { CampaignCard } from "@/components/campaign/campaign-card";

export default async function HomePage() {
  const result = await campaignService.listActiveCampaignsResult({
    page: 1,
    limit: 12,
  });

  const campaigns = result.isOk() ? result.value.campaigns : [];

  return (
    <>
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">Fund ideas with Czechitokens</h1>
          <p className="text-lg text-muted-foreground">
            Create campaigns, share them, and receive contributions from the community.
          </p>
        </div>

        {campaigns.length === 0 ? (
          <p className="text-center text-muted-foreground">
            No active campaigns yet. Be the first to create one!
          </p>
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
      </main>
    </>
  );
}
