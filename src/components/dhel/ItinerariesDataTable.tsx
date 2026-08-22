"use client";

import Link from "next/link";
import { useId, useMemo, useState, useTransition } from "react";
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type RowData,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, ExternalLink, Search, Trash2 } from "lucide-react";
import {
  deleteItineraries,
  deleteItinerary,
  duplicateItinerary,
} from "@/app/actions/itineraries";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "select";
  }
}

export type ItineraryTableRow = {
  id: string;
  title: string;
  client_name: string;
  language: string;
  template_id: string;
  status: string;
  updated_at: string;
};

export function ItinerariesDataTable({
  items,
  canDelete = false,
}: {
  items: ItineraryTableRow[];
  canDelete?: boolean;
}) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: "updated_at", desc: true },
  ]);
  const [pending, startTransition] = useTransition();

  const columns = useMemo<ColumnDef<ItineraryTableRow>[]>(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        size: 40,
      },
      {
        header: "Title",
        accessorKey: "title",
        cell: ({ row }) => (
          <Link
            href={`/itineraries/${row.original.id}`}
            className="font-medium hover:underline"
          >
            {row.getValue("title")}
          </Link>
        ),
        meta: { filterVariant: "text" },
      },
      {
        header: "Client",
        accessorKey: "client_name",
        cell: ({ row }) => row.getValue("client_name") || "—",
        meta: { filterVariant: "text" },
      },
      {
        header: "Lang",
        accessorKey: "language",
        cell: ({ row }) => (
          <span className="badge">{String(row.getValue("language"))}</span>
        ),
        meta: { filterVariant: "select" },
      },
      {
        header: "Template",
        accessorKey: "template_id",
        meta: { filterVariant: "select" },
      },
      {
        header: "Status",
        accessorKey: "status",
        meta: { filterVariant: "select" },
      },
      {
        header: "Updated",
        accessorKey: "updated_at",
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-muted-foreground">
            {new Date(String(row.getValue("updated_at"))).toLocaleString()}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex flex-nowrap items-center gap-1">
            <Link
              className="btn btn-ghost btn-sm whitespace-nowrap"
              href={`/itineraries/${row.original.id}`}
            >
              Open
            </Link>
            <Link
              className="btn btn-ghost btn-sm whitespace-nowrap"
              href={`/preview/${row.original.id}`}
            >
              Preview
              <ExternalLink className="ml-1 size-3 opacity-60" aria-hidden />
            </Link>
            <form action={duplicateItinerary}>
              <input type="hidden" name="id" value={row.original.id} />
              <button type="submit" className="btn btn-ghost btn-sm whitespace-nowrap">
                Duplicate
              </button>
            </form>
            {canDelete ? (
              <form
                action={deleteItinerary}
                onSubmit={(e) => {
                  if (!confirm(`Delete “${row.original.title}”?`)) e.preventDefault();
                }}
              >
                <input type="hidden" name="id" value={row.original.id} />
                <button
                  type="submit"
                  className="btn btn-ghost btn-sm whitespace-nowrap text-destructive"
                >
                  Delete
                </button>
              </form>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: { sorting, columnFilters, rowSelection },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
    getRowId: (row) => row.id,
  });

  const selectedIds = table.getSelectedRowModel().rows.map((r) => r.original.id);

  function bulkDelete() {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} itinerary(ies)?`)) return;
    const fd = new FormData();
    fd.set("ids", selectedIds.join(","));
    startTransition(() => {
      void deleteItineraries(fd);
    });
  }

  return (
    <div className="w-full space-y-4 bg-background">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-44">
          <Filter column={table.getColumn("title")!} />
        </div>
        <div className="w-40">
          <Filter column={table.getColumn("client_name")!} />
        </div>
        <div className="w-28">
          <Filter column={table.getColumn("language")!} />
        </div>
        <div className="w-36">
          <Filter column={table.getColumn("template_id")!} />
        </div>
        <div className="w-32">
          <Filter column={table.getColumn("status")!} />
        </div>
        {canDelete && selectedIds.length > 0 ? (
          <button
            type="button"
            className="btn btn-secondary inline-flex items-center gap-1.5"
            disabled={pending}
            onClick={bulkDelete}
          >
            <Trash2 className="size-4" />
            Delete {selectedIds.length}
          </button>
        ) : null}
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50 hover:bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="relative h-10 select-none"
                    aria-sort={
                      header.column.getIsSorted() === "asc"
                        ? "ascending"
                        : header.column.getIsSorted() === "desc"
                          ? "descending"
                          : "none"
                    }
                  >
                    {header.isPlaceholder ? null : header.column.getCanSort() ? (
                      <div
                        className="flex h-full cursor-pointer select-none items-center justify-between gap-2"
                        onClick={header.column.getToggleSortingHandler()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            header.column.getToggleSortingHandler()?.(e);
                          }
                        }}
                        tabIndex={0}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{
                          asc: (
                            <ChevronUp className="size-4 shrink-0 opacity-60" aria-hidden />
                          ),
                          desc: (
                            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
                          ),
                        }[header.column.getIsSorted() as string] ?? (
                          <span className="size-4" aria-hidden />
                        )}
                      </div>
                    ) : (
                      flexRender(header.column.columnDef.header, header.getContext())
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2.5">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Filter({ column }: { column: Column<ItineraryTableRow, unknown> }) {
  const id = useId();
  const columnFilterValue = column.getFilterValue();
  const { filterVariant } = column.columnDef.meta ?? {};
  const columnHeader =
    typeof column.columnDef.header === "string" ? column.columnDef.header : "";

  const sortedUniqueValues = useMemo(() => {
    if (filterVariant !== "select") return [];
    const values = Array.from(column.getFacetedUniqueValues().keys());
    return Array.from(new Set(values.map(String))).sort();
  }, [column, filterVariant]);

  if (filterVariant === "select") {
    return (
      <div className="space-y-2">
        <Label htmlFor={`${id}-select`}>{columnHeader}</Label>
        <Select
          value={columnFilterValue?.toString() ?? "all"}
          onValueChange={(value) => {
            column.setFilterValue(value === "all" ? undefined : value);
          }}
        >
          <SelectTrigger id={`${id}-select`} className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {sortedUniqueValues.map((value) => (
              <SelectItem key={value} value={value}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={`${id}-input`}>{columnHeader}</Label>
      <div className="relative">
        <Input
          id={`${id}-input`}
          className="peer h-9 ps-9"
          value={(columnFilterValue ?? "") as string}
          onChange={(e) => column.setFilterValue(e.target.value)}
          placeholder={`Search ${columnHeader.toLowerCase()}`}
          type="text"
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80">
          <Search size={16} strokeWidth={2} aria-hidden />
        </div>
      </div>
    </div>
  );
}
