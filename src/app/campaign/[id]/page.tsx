import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignProgress } from "@/components/campaign/campaign-progress";
import { ContributeForm } from "@/components/campaign/contribute-form.client";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await campaignService.getCampaignResult(id);
  if (result.isErr()) notFound();

  const campaign = result.value;

  const session = await auth.api.getSession({ headers: await headers() });
  const isOwner = session?.user.id === campaign.creatorId;
  const canContribute =
    session && !isOwner && campaign.status === "active" && campaign.deadline > new Date();

  const variant =
    campaign.status === "completed"
      ? "default"
      : campaign.status === "cancelled"
        ? "destructive"
        : "secondary";

  return (
    <>
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{campaign.title}</CardTitle>
                <CardDescription>
                  Deadline: {new Date(campaign.deadline).toLocaleDateString()}
                  {" | "}
                  {campaign.contributionCount} contribution
                  {campaign.contributionCount !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Badge variant={variant}>{campaign.status}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <CampaignProgress
              currentAmount={campaign.currentAmount}
              targetAmount={campaign.targetAmount}
            />

            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {campaign.description}
            </p>

            {canContribute && <ContributeForm campaignId={campaign.id} />}

            {!session && (
              <p className="text-center text-sm text-muted-foreground">
                <a href="/signin" className="underline">
                  Sign in
                </a>{" "}
                to contribute to this campaign.
              </p>
            )}

            {isOwner && (
              <p className="text-center text-sm text-muted-foreground">You own this campaign.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
