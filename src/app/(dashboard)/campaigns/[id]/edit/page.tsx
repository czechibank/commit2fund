import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { campaignService } from "@/domain/campaign-domain/campaign-service";
import { CampaignForm } from "@/components/campaign/campaign-form.client";

export default async function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const { id } = await params;
  const result = await campaignService.getCampaignResult(id);
  if (result.isErr()) notFound();

  const campaign = result.value;
  if (campaign.creatorId !== session.user.id) notFound();

  return (
    <CampaignForm
      mode="edit"
      campaignId={campaign.id}
      defaultValues={{
        title: campaign.title,
        description: campaign.description,
      }}
    />
  );
}
