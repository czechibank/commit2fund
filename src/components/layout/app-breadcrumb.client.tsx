"use client";

import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const labelMap: Record<string, string> = {
  "": "Explore",
  dashboard: "Dashboard",
  campaigns: "My Campaigns",
  campaign: "Campaign",
  contributions: "Contributions",
  "link-account": "Link Account",
  new: "New Campaign",
  edit: "Edit",
};

export function AppBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>Explore Campaigns</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Custom breadcrumb routes where the naive segment-by-segment approach doesn't work
  const routeOverrides: Record<string, { label: string; href?: string }[]> = {
    campaign: [{ label: "Explore Campaigns", href: "/" }],
  };

  const crumbs: { label: string; href?: string }[] = [];
  let currentPath = "";
  let skipSegments = 0;

  for (let i = 0; i < segments.length; i++) {
    if (skipSegments > 0) {
      skipSegments--;
      currentPath += `/${segments[i]}`;
      continue;
    }

    const segment = segments[i]!;
    currentPath += `/${segment}`;
    const isLast = i === segments.length - 1;

    if (routeOverrides[segment]) {
      crumbs.push(...routeOverrides[segment]);
      continue;
    }

    const label = labelMap[segment] ?? (isUuid(segment) ? "Detail" : segment);

    crumbs.push({
      label,
      href: isLast ? undefined : currentPath,
    });
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={i}>
            {i > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function isUuid(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}
