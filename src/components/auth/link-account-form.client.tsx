"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { linkCzechibankAccount } from "@/server-actions/user-actions";
import { toast } from "sonner";

export function LinkAccountForm() {
  const [apiKey, setApiKey] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);

    const result = await linkCzechibankAccount(apiKey);

    if (result.success) {
      toast.success("Czechibank linked. You can now create campaigns and fund others.");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Link Czechibank Account</CardTitle>
        <CardDescription>
          Enter your Czechibank API key to enable campaigns and contributions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Czechibank API Key</Label>
            <Input
              id="apiKey"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Linking..." : "Link Account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
