"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { contribute, getMyBankAccounts } from "@/server-actions/contribution-actions";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  number: string;
  name: string;
  balance: number;
}

interface ContributeFormProps {
  campaignId: string;
}

export function ContributeForm({ campaignId }: ContributeFormProps) {
  const [amount, setAmount] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    getMyBankAccounts().then((result) => {
      if (result.success) {
        setAccounts(result.data.accounts);
        if (result.data.accounts.length === 1) {
          setSelectedAccount(result.data.accounts[0]!.number);
        }
      } else {
        toast.error(result.error);
      }
      setLoading(false);
    });
  }, []);

  const selected = accounts.find((a) => a.number === selectedAccount);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseInt(amount, 10);
    if (!value || value < 1) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selectedAccount) {
      toast.error("Select a bank account");
      return;
    }

    setPending(true);
    const result = await contribute(campaignId, value, selectedAccount);
    setPending(false);

    if (result.success) {
      if (result.data.capped) {
        toast.success(
          `You made the closing commit. The campaign only needed ${result.data.effectiveAmount.toLocaleString()} CZT, so that's what we sent. Merged!`,
        );
      } else {
        toast.success("Contribution committed. Thanks for pushing this forward!");
      }
      setAmount("");
      const refreshed = await getMyBankAccounts();
      if (refreshed.success) {
        setAccounts(refreshed.data.accounts);
      }
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  if (loading) {
    return (
      <p className="text-center font-mono text-xs text-muted-foreground">
        $ czechibank: fetching your accounts...
      </p>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-1 text-center">
        <p className="font-mono text-xs text-muted-foreground">czechibank: 0 accounts found</p>
        <p className="text-sm text-muted-foreground">
          Pop over to Czechibank, create a bank account, and come back. We are not going anywhere.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Pay from</Label>
        <Select value={selectedAccount} onValueChange={setSelectedAccount}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select bank account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.number}>
                <div className="flex w-full items-center justify-between gap-3">
                  <span>{a.name}</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    {a.balance.toLocaleString()} CZT
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <p className="text-sm text-muted-foreground">
            <span className="font-mono">{selected.number}</span> — Available:{" "}
            <span className="font-mono font-medium tabular-nums">
              {selected.balance.toLocaleString()} CZT
            </span>
          </p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (CZECHITOKEN)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          max={selected?.balance}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={pending || !selectedAccount}>
        {pending ? "Committing..." : "Commit funds"}
      </Button>
    </form>
  );
}
