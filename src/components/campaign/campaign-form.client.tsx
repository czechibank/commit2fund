"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createCampaign, updateCampaign } from "@/server-actions/campaign-actions";
import { toast } from "sonner";
import type { ActionResult } from "@/server-actions/types";

interface CampaignFormProps {
  mode: "create" | "edit";
  campaignId?: string;
  defaultValues?: {
    title: string;
    description: string;
    targetAmount?: number;
    deadline?: string;
  };
}

export function CampaignForm({ mode, campaignId, defaultValues }: CampaignFormProps) {
  const router = useRouter();

  async function action(
    _prev: ActionResult<{ id: string }> | null,
    formData: FormData,
  ): Promise<ActionResult<{ id: string }>> {
    if (mode === "edit" && campaignId) {
      return updateCampaign(campaignId, formData);
    }
    return createCampaign(formData);
  }

  const [state, formAction, pending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      toast.success(
        mode === "create"
          ? "Campaign created. Now share it, campaigns don't fund themselves."
          : "Campaign updated.",
      );
      router.push("/campaigns");
    } else if (state && !state.success) {
      toast.error(state.error);
    }
  }, [state, mode, router]);

  return (
    <Card className="mx-auto max-w-lg">
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create Campaign" : "Edit Campaign"}</CardTitle>
        <CardDescription>
          {mode === "create" ? "Set up your crowdfunding campaign" : "Update your campaign details"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              defaultValue={defaultValues?.title}
              required
              minLength={3}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={defaultValues?.description}
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </div>
          {mode === "create" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="targetAmount">Target Amount (CZECHITOKEN)</Label>
                <Input
                  id="targetAmount"
                  name="targetAmount"
                  type="number"
                  defaultValue={defaultValues?.targetAmount}
                  required
                  min={1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  defaultValue={defaultValues?.deadline}
                  required
                />
              </div>
            </>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : mode === "create" ? "Create Campaign" : "Save Changes"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
