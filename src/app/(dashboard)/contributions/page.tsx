import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { contributionService } from "@/domain/contribution-domain/contribution-service";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";

export default async function ContributionsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/signin");

  const result = await contributionService.listMyContributionsResult(session.user.id, {
    page: 1,
    limit: 50,
  });

  const contributions = result.isOk() ? result.value.contributions : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Contributions</h1>

      {contributions.length === 0 ? (
        <EmptyState command="fund log --author=you" output="0 commits (yet)">
          Your funding history is a blank file.{" "}
          <Link href="/" className="underline">
            Find a campaign
          </Link>{" "}
          you believe in and make your first commit.
        </EmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Campaign</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contributions.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <Link href={`/campaign/${c.campaignId}`} className="hover:underline">
                    {c.campaignTitle}
                  </Link>
                </TableCell>
                <TableCell>{c.amount} CZECHITOKEN</TableCell>
                <TableCell>{new Date(c.createdAt).toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
