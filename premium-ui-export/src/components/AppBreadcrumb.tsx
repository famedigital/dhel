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
  dashboard: "Dashboard",
  projects: "Projects",
  team: "Team",
  settings: "Settings",
  profile: "Profile",
};

function humanize(segment: string) {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  if (/^[0-9a-f-]{8,}$/i.test(segment)) return "Detail";
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function crumbsFromPath(pathname: string, homeHref: string): Crumb[] {
  const parts = pathname.split("/").filter(Boolean);
  if (!parts.length) return [{ label: "Home", href: homeHref }];

  const crumbs: Crumb[] = [{ label: "Home", href: homeHref }];
  let href = "";

  parts.forEach((part, index) => {
    href += `/${part}`;
    const isLast = index === parts.length - 1;
    crumbs.push({
      label: humanize(part),
      href: isLast ? undefined : href,
    });
  });

  return crumbs;
}

export function AppBreadcrumb({
  items,
  className,
  homeHref = "/dashboard",
}: {
  items?: Crumb[];
  className?: string;
  homeHref?: string;
}) {
  const pathname = usePathname();
  const crumbs = items?.length ? items : crumbsFromPath(pathname, homeHref);

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
