import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { contributionService } from "@/domain/contribution-domain/contribution-service";
import { userService } from "@/domain/user-domain/user-service";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CampaignStatusBadge } from "@/components/campaign/campaign-status-badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const userResult = await userService.getUserResult(session.user.id);
  const campaignsResult = await campaignService.listMyCampaignsResult(session.user.id, {
    page: 1,
    limit: 5,
  });
  const contributionsResult = await contributionService.listMyContributionsResult(session.user.id, {
    page: 1,
    limit: 5,
  });

  const user = userResult.isOk() ? userResult.value : null;
  const myCampaigns = campaignsResult.isOk()
    ? campaignsResult.value
    : { campaigns: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } };
  const myContributions = contributionsResult.isOk()
    ? contributionsResult.value
    : { contributions: [], pagination: { total: 0, page: 1, limit: 5, totalPages: 0 } };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {user && !user.czechibankLinked && (
        <Card className="border-(--chart-4)/50 bg-(--chart-4)/10">
          <CardContent className="flex items-center justify-between pt-6">
            <p className="text-sm">
              Link your Czechibank account to create campaigns and contribute.
            </p>
            <Button asChild size="sm">
              <Link href="/link-account">Link Account</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Campaigns</CardDescription>
            <CardTitle className="text-3xl">{myCampaigns.pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My Contributions</CardDescription>
            <CardTitle className="text-3xl">{myContributions.pagination.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Czechibank Status</CardDescription>
            <CardTitle>
              <Badge variant={user?.czechibankLinked ? "default" : "secondary"}>
                {user?.czechibankLinked ? "Linked" : "Not Linked"}
              </Badge>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            {myCampaigns.campaigns.length === 0 ? (
              <div className="space-y-2">
                <code className="inline-block rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  <span className="select-none text-muted-foreground">$ </span>fund status
                </code>
                <p className="font-mono text-xs text-muted-foreground">
                  nothing to commit, working tree clean
                </p>
                <p className="text-sm text-muted-foreground">
                  <Link href="/campaigns/new" className="underline">
                    Start your first campaign
                  </Link>{" "}
                  and change that.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {myCampaigns.campaigns.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <Link href={`/campaign/${c.id}`} className="hover:underline">
                      {c.title}
                    </Link>
                    <CampaignStatusBadge status={c.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            {myContributions.contributions.length === 0 ? (
              <div className="space-y-2">
                <code className="inline-block rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                  <span className="select-none text-muted-foreground">$ </span>fund log
                </code>
                <p className="font-mono text-xs text-muted-foreground">0 commits</p>
                <p className="text-sm text-muted-foreground">
                  Fund a campaign and it will show up here. Your future self approves.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {myContributions.contributions.map((c) => (
                  <li key={c.id} className="flex items-center justify-between text-sm">
                    <span>{c.campaignTitle}</span>
                    <span className="font-mono font-medium tabular-nums">
                      {c.amount.toLocaleString()} CZT
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
