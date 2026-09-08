"use client";

import type { ReactNode } from "react";
import { MapPinned } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const cellTriggerClass =
  "relative overflow-hidden rounded-none border border-border py-2 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 first:rounded-s last:rounded-e data-[state=active]:bg-muted data-[state=active]:after:bg-primary";

type DayTab = {
  value: string;
  label: string;
  sublabel?: string;
};

/**
 * Horizontal cell-style day tabs (scrollable).
 * Used by ContentEditor day editing.
 */
export function DayCellTabs({
  days,
  value,
  onValueChange,
  children,
}: {
  days: DayTab[];
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}) {
  if (!days.length) return null;

  return (
    <Tabs value={value} onValueChange={onValueChange} className="w-full">
      <ScrollArea className="w-full pb-2">
        <TabsList className="mb-0 h-auto w-max min-w-full -space-x-px bg-background p-0 shadow-sm shadow-black/5 rtl:space-x-reverse">
          {days.map((day) => (
            <TabsTrigger
              key={day.value}
              value={day.value}
              className={cn(cellTriggerClass, "max-w-[14rem]")}
            >
              <MapPinned
                className="-ms-0.5 me-1.5 shrink-0 opacity-60"
                size={16}
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">
                {day.label}
                {day.sublabel ? (
                  <span className="ml-1 font-normal text-muted-foreground">
                    · {day.sublabel}
                  </span>
                ) : null}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      {children}
    </Tabs>
  );
}

export { TabsContent as DayCellTabsContent };
