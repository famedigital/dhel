"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type LibraryAsset = {
  public_id: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  folder?: string;
};

const FOLDERS = [
  { id: "", label: "All" },
  { id: "activities", label: "Activities" },
  { id: "hotels", label: "Hotels" },
  { id: "covers", label: "Covers" },
  { id: "days", label: "Days" },
  { id: "guides", label: "Guides" },
  { id: "vehicles", label: "Vehicles" },
] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, asset: LibraryAsset) => void;
  /** Prefer this Cloudinary folder first */
  folder?: string;
  title?: string;
};

export function CloudinaryPicker({
  open,
  onClose,
  onSelect,
  folder: initialFolder = "",
  title = "Choose from library",
}: Props) {
  const [folder, setFolder] = useState(initialFolder);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<LibraryAsset[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { append?: boolean; cursor?: string | null }) => {
      setBusy(true);
      setError(null);
      try {
        const params = new URLSearchParams({ max: "48" });
        if (folder) params.set("folder", folder);
        if (query) params.set("q", query);
        if (opts?.cursor) params.set("next_cursor", opts.cursor);
        const res = await fetch(`/api/media/library?${params}`);
        const data = (await res.json()) as {
          assets?: LibraryAsset[];
          next_cursor?: string | null;
          error?: string;
        };
        if (!res.ok) throw new Error(data.error || "Could not load library");
        setAssets((prev) =>
          opts?.append ? [...prev, ...(data.assets ?? [])] : data.assets ?? [],
        );
        setNextCursor(data.next_cursor ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
        if (!opts?.append) setAssets([]);
      } finally {
        setBusy(false);
      }
    },
    [folder, query],
  );

  useEffect(() => {
    if (!open) return;
    setFolder(initialFolder);
    setQ("");
    setQuery("");
  }, [open, initialFolder]);

  useEffect(() => {
    if (!open) return;
    void load();
  }, [open, folder, query, load]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{title}</p>
            <p className="text-xs text-muted-foreground">Cloudinary catalog — click to use</p>
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={onClose}>
            <X className="size-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
          {FOLDERS.map((f) => (
            <button
              key={f.id || "all"}
              type="button"
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                folder === f.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setFolder(f.id)}
            >
              {f.label}
            </button>
          ))}
          <form
            className="ml-auto flex min-w-[10rem] flex-1 items-center gap-1 sm:max-w-xs"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(q.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                className="input h-8 pl-7 text-xs"
                placeholder="Search…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-8">
              Go
            </Button>
          </form>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {error ? <p className="form-error mb-3 px-1">{error}</p> : null}
          {!busy && !assets.length ? (
            <div className="flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
              <ImageIcon className="size-8 opacity-40" />
              <p className="text-sm">No images in this folder</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {assets.map((asset) => (
                <button
                  key={asset.public_id}
                  type="button"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted outline-none transition hover:border-ring focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => {
                    onSelect(asset.url, asset);
                    onClose();
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.url}
                    alt=""
                    className="size-full object-cover transition duration-200 group-hover:scale-[1.03]"
                    loading="lazy"
                  />
                  <span className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-1.5 pb-1 pt-4 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                    {asset.public_id.split("/").pop()}
                  </span>
                </button>
              ))}
            </div>
          )}
          {busy ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : null}
        </div>

        {nextCursor ? (
          <div className="border-t border-border px-4 py-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={() => void load({ append: true, cursor: nextCursor })}
            >
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
