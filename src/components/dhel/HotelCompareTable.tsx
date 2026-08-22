"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HotelCompareTable({
  rows,
}: {
  rows: Array<{
    id: string;
    hotel: string;
    city: string;
    room: string;
    nights: number;
    total_pp: number;
    currency: string;
    recommended: boolean;
    source: string;
  }>;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead>Hotel</TableHead>
            <TableHead>Room</TableHead>
            <TableHead className="text-right">Total / person</TableHead>
            <TableHead>Source</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell>
                <div className="font-medium">{r.hotel}</div>
                <div className="text-xs text-[var(--muted-foreground)]">{r.city}</div>
              </TableCell>
              <TableCell>
                {r.room} · {r.nights}n
              </TableCell>
              <TableCell className="text-right font-semibold">
                {r.currency} {r.total_pp.toLocaleString()}
                {r.recommended ? (
                  <Badge variant="saffron" className="ml-2">
                    Rec
                  </Badge>
                ) : null}
              </TableCell>
              <TableCell className="text-xs capitalize text-[var(--muted-foreground)]">
                {r.source}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
