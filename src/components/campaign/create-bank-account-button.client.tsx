"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createBankAccountForCampaign } from "@/server-actions/campaign-actions";
import { toast } from "sonner";

export function CreateBankAccountButton({ campaignId }: { campaignId: string }) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleClick() {
    setPending(true);
    const result = await createBankAccountForCampaign(campaignId);

    if (result.success) {
      toast.success("Bank account created. This campaign can now accept contributions.");
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={pending} className="w-full">
      {pending ? "Creating bank account..." : "Create Bank Account"}
    </Button>
  );
}
