import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { slugify } from "@/lib/utils";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import { ContributeForm } from "@/components/campaign/contribute-form.client";
import { CreateBankAccountButton } from "@/components/campaign/create-bank-account-button.client";

// Rendered as a code comment under the progress ticks.
function progressNote(
  status: "active" | "completed" | "cancelled",
  current: number,
  target: number,
) {
  if (status === "cancelled") return "closed without merging";
  const pct = current >= target ? 100 : Math.min(Math.floor((current / target) * 100), 99);
  if (status === "completed" || pct === 100) {
    return "merged! goal reached, thanks to everyone who committed";
  }
  if (pct === 0) return "awaiting the first commit. someone has to start";
  if (pct < 50) return "early momentum. every commit counts";
  if (pct < 90) return "past halfway. the merge is in sight";
  return "so close. one good push away";
}

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await campaignService.getCampaignResult(id);
  if (result.isErr()) notFound();

  const campaign = result.value;

  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user.id === campaign.creatorId;
  const hasBankAccount = !!campaign.czechibankAccountNumber;
  const canContribute =
    session &&
    !isOwner &&
    campaign.status === "active" &&
    campaign.deadline > new Date() &&
    hasBankAccount;

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden pt-0">
        <div className="flex items-center justify-between gap-3 border-b bg-muted/60 px-6 py-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            ~/campaigns/{slugify(campaign.title)}
          </span>
          <CampaignStatusBadge status={campaign.status} />
        </div>
        <CardHeader>
          <CardTitle className="text-2xl">{campaign.title}</CardTitle>
          <CardDescription className="font-mono text-xs">
            deadline: {new Date(campaign.deadline).toLocaleDateString()} ·{" "}
            {campaign.contributionCount} contribution
            {campaign.contributionCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <CampaignProgress
              currentAmount={campaign.currentAmount}
              targetAmount={campaign.targetAmount}
              status={campaign.status}
            />
            <p className="font-mono text-xs text-muted-foreground">
              # {progressNote(campaign.status, campaign.currentAmount, campaign.targetAmount)}
            </p>
          </div>

          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {campaign.description}
          </p>

          {hasBankAccount && !isOwner && (
            <div className="flex items-center justify-between rounded-md border px-4 py-2">
              <span className="text-sm text-muted-foreground">Campaign account</span>
              <span className="font-mono text-sm">{campaign.czechibankAccountNumber}</span>
            </div>
          )}

          {canContribute && <ContributeForm campaignId={campaign.id} />}

          {!session && (
            <p className="text-center text-sm text-muted-foreground">
              <a href="/signin" className="underline">
                Sign in
              </a>{" "}
              to make your first commit to this campaign.
            </p>
          )}

          {isOwner && !hasBankAccount && (
            <Card className="border-(--chart-4)/50 bg-(--chart-4)/10">
              <CardContent className="space-y-3 pt-6">
                <p className="text-sm">
                  This campaign has no bank account yet, so contributors have nowhere to send their
                  tokens. Create one to open the doors.
                </p>
                <CreateBankAccountButton campaignId={campaign.id} />
              </CardContent>
            </Card>
          )}

          {isOwner && hasBankAccount && (
            <div className="space-y-2 rounded-md border p-4">
              <p className="text-sm font-medium">Campaign Bank Account</p>
              <p className="font-mono text-sm text-muted-foreground">
                {campaign.czechibankAccountNumber}
              </p>
              <p className="text-center text-xs text-muted-foreground">
                This is your campaign. Funding your own work would be cheating, so share the link
                instead.
              </p>
            </div>
          )}

          {!isOwner && !hasBankAccount && session && campaign.status === "active" && (
            <p className="text-center text-sm text-muted-foreground">
              This campaign is still wiring up its bank account. Check back in a bit.
            </p>
          )}

          {campaign.contributions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Recent Contributions ({campaign.contributionCount})
              </h3>
              <div className="divide-y rounded-md border">
                {campaign.contributions.map((c) => (
                  <div key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{c.contributorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-medium tabular-nums">
                      {c.amount.toLocaleString()} CZT
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
