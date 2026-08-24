"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { unlinkCzechibankAccount } from "@/server-actions/user-actions";
import { toast } from "sonner";

export function UnlinkAccountButton() {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleUnlink() {
    if (!confirm("Are you sure you want to unlink your Czechibank account?")) return;

    setPending(true);
    const result = await unlinkCzechibankAccount();

    if (result.success) {
      toast.success("Czechibank unlinked. Linking again brings everything back.");
      router.refresh();
    } else {
      toast.error(result.error);
      setPending(false);
    }
  }

  return (
    <Button variant="destructive" onClick={handleUnlink} disabled={pending} className="w-full">
      {pending ? "Unlinking..." : "Unlink Account"}
    </Button>
  );
}
