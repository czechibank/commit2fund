import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { userService } from "@/domain/user-domain/user-service";
import { LinkAccountForm } from "@/components/auth/link-account-form.client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { UnlinkAccountButton } from "@/components/auth/unlink-account-button.client";
import { Separator } from "@/components/ui/separator";

export default async function LinkAccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const userResult = await userService.getUserResult(session.user.id);
  const user = userResult.isOk() ? userResult.value : null;

  if (user?.czechibankLinked) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Czechibank Account</h1>
        <Card className="mx-auto max-w-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle>Account Linked</CardTitle>
            </div>
            <CardDescription>
              Your Czechibank account is connected and ready to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant="default">Linked</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Czechibank User ID</span>
              <span className="text-sm font-mono">{user.czechibankUserId}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">API Key</span>
              <span className="text-sm font-mono">
                {user.czechibankApiKey ? `${user.czechibankApiKey.slice(0, 8)}...` : "Hidden"}
              </span>
            </div>
            <Separator />
            <UnlinkAccountButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Link Czechibank Account</h1>
      <LinkAccountForm />
    </div>
  );
}
