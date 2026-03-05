"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { contribute } from "@/server-actions/contribution-actions";
import { toast } from "sonner";

interface ContributeFormProps {
  campaignId: string;
}

export function ContributeForm({ campaignId }: ContributeFormProps) {
  const [amount, setAmount] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (!value || value < 1) {
      toast.error("Enter a valid amount");
      return;
    }

    setPending(true);
    const result = await contribute(campaignId, value);
    setPending(false);

    if (result.success) {
      toast.success("Contribution successful");
      setAmount("");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (CZECHITOKEN)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Processing..." : "Contribute"}
      </Button>
    </form>
  );
}
