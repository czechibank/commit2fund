import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userService } from "@/domain/user-domain/user-service";
import { CampaignForm } from "@/components/campaign/campaign-form.client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function NewCampaignPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const userResult = await userService.getUserResult(session.user.id);
  const user = userResult.isOk() ? userResult.value : null;

  if (!user?.czechibankLinked) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Link your Czechibank account first</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            You need a linked Czechibank account to create campaigns.
          </p>
          <Button asChild>
            <Link href="/link-account">Link Account</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <CampaignForm mode="create" />;
}
