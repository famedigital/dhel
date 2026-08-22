"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

type Crumb = {
  label: string;
  href?: string;
};

const SEGMENT_LABELS: Record<string, string> = {
  desk: "Proposal",
  dashboard: "Trips",
  clients: "Clients",
  resources: "Resources",
  hotels: "Hotels",
  guides: "Guides",
  drivers: "Drivers",
  settings: "Settings",
  itineraries: "Trips",
  onboarding: "Onboarding",
  portal: "Portal",
  profile: "Profile",
  today: "Today",
  build: "Build",
};

function humanize(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detail";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function crumbsFromPath(pathname: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return [{ label: "Home", href: "/desk" }];

  const crumbs: Crumb[] = [{ label: "Home", href: "/desk" }];
  let href = "";

  parts.forEach((part, index) => {
    href += `/${part}`;
    const isLast = index === parts.length - 1;
    // Map itineraries list parent to dashboard trips
    const linkHref =
      part === "itineraries" && !isLast ? "/dashboard" : href;

    crumbs.push({
      label: humanize(part),
      href: isLast ? undefined : linkHref,
    });
  });

  return crumbs;
}

export function AppBreadcrumb({
  items,
  className,
}: {
  /** Optional override; otherwise derived from the current path */
  items?: Crumb[];
  className?: string;
}) {
  const pathname = usePathname();
  const crumbs = items?.length ? items : crumbsFromPath(pathname);

  if (crumbs.length < 1) return null;

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <span key={`${crumb.label}-${index}`} className="contents">
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary text-primary"
                    >
                      {crumb.label}
                    </Badge>
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>
                      <Badge
                        variant="outline"
                        className="rounded-full text-muted-foreground hover:text-foreground"
                      >
                        {crumb.label}
                      </Badge>
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </span>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
