"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Link2,
  Smartphone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PackId = "guest" | "ops" | "field";

type Pack = {
  id: PackId;
  title: string;
  blurb: string;
  audience: string;
  icon: typeof Users;
  href: string;
  primary?: boolean;
  mobile?: boolean;
};

const PACKS: Pack[] = [
  {
    id: "guest",
    title: "Guest PDF",
    blurb: "Client itinerary — narrative, hotels, pricing. No room numbers.",
    audience: "Guests",
    icon: Users,
    href: "guest",
    primary: true,
  },
  {
    id: "ops",
    title: "Ops pack",
    blurb: "Vouchers, rooms, staff sheets, payments for the desk.",
    audience: "Office",
    icon: ClipboardList,
    href: "ops",
  },
  {
    id: "field",
    title: "Mobile field",
    blurb: "Phone-first run sheet for guide & driver — no rates. Share the link.",
    audience: "On the road",
    icon: Smartphone,
    href: "field",
    mobile: true,
  },
];

type Props = {
  itineraryId: string;
  tripTitle?: string;
  staysWithRoom: number;
  staffCount: number;
  paymentCount: number;
};

export function DocsPacksPanel({
  itineraryId,
  tripTitle,
  staysWithRoom,
  staffCount,
  paymentCount,
}: Props) {
  const [copied, setCopied] = useState(false);

  const checks = [
    {
      ok: staysWithRoom > 0,
      label:
        staysWithRoom > 0
          ? `${staysWithRoom} stay${staysWithRoom === 1 ? "" : "s"} with room #`
          : "No room numbers yet",
      href: `/itineraries/${itineraryId}?tab=stays`,
    },
    {
      ok: staffCount > 0,
      label: staffCount > 0 ? `${staffCount} staff assigned` : "No guide/driver assigned",
      href: `/itineraries/${itineraryId}?tab=staff`,
    },
    {
      ok: paymentCount > 0,
      label:
        paymentCount > 0
          ? `${paymentCount} payment row${paymentCount === 1 ? "" : "s"}`
          : "No payments logged",
      href: `/itineraries/${itineraryId}?tab=money`,
    },
  ];

  async function shareField() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/preview/${itineraryId}?pack=field`
        : `/preview/${itineraryId}?pack=field`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: tripTitle ? `Mobile field · ${tripTitle}` : "Mobile field pack",
          text: "Guide/driver mobile field pack (no rates)",
          url,
        });
        return;
      } catch {
        /* clipboard */
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold tracking-tight">Print & share</h2>
        <p className="text-xs text-muted-foreground">
          Three packs from one trip · Guest & Ops for A4 · Mobile field for phones
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PACKS.map((pack) => {
          const Icon = pack.icon;
          const href = `/preview/${itineraryId}?pack=${pack.href}`;
          return (
            <Card
              key={pack.id}
              className={cn(
                "flex aspect-[4/5] min-h-0 flex-col overflow-hidden shadow-sm",
                pack.primary && "border-foreground/20",
                pack.mobile && "border-primary/30 bg-primary/[0.03]",
              )}
            >
              <CardHeader className="space-y-2 p-3 pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={cn(
                      "grid size-9 place-items-center rounded-lg",
                      pack.primary
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <Icon className="size-4" strokeWidth={1.75} />
                  </div>
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                    {pack.audience}
                  </Badge>
                </div>
                <CardTitle className="text-sm">{pack.title}</CardTitle>
                <CardDescription className="text-[11px] leading-relaxed">{pack.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto flex flex-col gap-2 p-3 pt-0">
                <Button asChild size="sm" variant={pack.primary ? "default" : "outline"} className="w-full">
                  <Link href={href}>
                    Open preview
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </Button>
                {pack.id === "field" ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => void shareField()}
                  >
                    <Link2 className="size-3.5" />
                    {copied ? "Link copied" : "Share mobile link"}
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="shadow-sm">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm">Ops readiness</CardTitle>
          <CardDescription className="text-xs">
            Guest PDF anytime · Ops & mobile field stronger with stays and staff
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <ul className="space-y-2">
            {checks.map((c) => (
              <li
                key={c.href}
                className={cn(
                  "flex items-center gap-2 rounded-md border border-border px-2.5 py-2 text-xs",
                  c.ok && "border-transparent bg-muted/50",
                )}
              >
                <CheckCircle2
                  className={cn("size-3.5 shrink-0", c.ok ? "text-primary" : "text-muted-foreground")}
                />
                <span className="flex-1">{c.label}</span>
                {!c.ok ? (
                  <Link href={c.href} className="font-medium text-primary hover:underline">
                    Fix
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
        <CardFooter className="border-t border-border py-2 text-[11px] text-muted-foreground">
          Mobile field opens best on a phone browser
        </CardFooter>
      </Card>
    </div>
  );
}
