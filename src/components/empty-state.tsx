import type { ReactNode } from "react";

interface EmptyStateProps {
  command: string;
  output: string;
  children?: ReactNode;
}

/**
 * Terminal-style empty state: a command from the imaginary `fund` CLI in a
 * code chip, its output below, then a plain sentence that tells the user
 * what to do next.
 */
export function EmptyState({ command, output, children }: EmptyStateProps) {
  return (
    <div className="rounded-md border border-dashed px-6 py-8 text-center">
      <code className="inline-block rounded border bg-muted px-2 py-1 font-mono text-xs text-foreground">
        <span className="select-none text-muted-foreground">$ </span>
        {command}
      </code>
      <p className="mt-2 font-mono text-xs font-medium text-primary">{output}</p>
      {children && (
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">{children}</p>
      )}
    </div>
  );
}
