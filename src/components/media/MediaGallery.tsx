"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Library, Link2, Loader2, Trash2 } from "lucide-react";
import { CloudinaryPicker } from "@/components/media/CloudinaryPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { url: string; caption?: string };

type Props = {
  label: string;
  values: Item[];
  max: number;
  folder?: string;
  hint?: string;
  captions?: boolean;
  onChange: (items: Item[]) => void;
};

/** Multi-photo gallery — Cloudinary library + upload, A4-safe max. */
export function MediaGallery({
  label,
  values,
  max,
  folder = "itineraries",
  hint,
  captions = false,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState("");
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const atMax = values.length >= max;

  function addUrl(url: string) {
    if (values.length >= max) {
      setError(`Max ${max} for the A4 PDF`);
      return;
    }
    onChange([...values, { url, caption: "" }].slice(0, max));
  }

  async function upload(file: File) {
    if (atMax) {
      setError(`Max ${max} for the A4 PDF`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      addUrl(data.url);
      setPasteOpen(false);
      setPasteUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (atMax) return;
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) void upload(file);
  }

  function applyPaste() {
    if (atMax) {
      setError(`Max ${max} for the A4 PDF`);
      return;
    }
    const url = pasteUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      setError("Use a full https:// URL or a site path starting with /");
      return;
    }
    setError(null);
    addUrl(url);
    setPasteUrl("");
    setPasteOpen(false);
  }

  return (
    <div className="media-card">
      <div className="media-card__meta">
        <div className="media-card__title-row">
          <span className="media-card__label">{label}</span>
          <span className="media-card__count">
            {values.length}
            <span aria-hidden>/</span>
            {max}
          </span>
        </div>
        {hint ? <span className="media-card__hint">{hint}</span> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy || atMax}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <div className="media-tiles">
        {values.map((item, i) => (
          <div key={`${item.url}-${i}`} className="media-tile">
            <div className="media-drop media-drop--filled media-drop--tile">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt="" className="media-drop__img" />
              <div className="media-drop__veil">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 bg-background/85 hover:bg-background"
                  onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
            {captions ? (
              <input
                className="input media-tile__caption"
                placeholder="Caption"
                value={item.caption ?? ""}
                onChange={(e) =>
                  onChange(
                    values.map((v, idx) =>
                      idx === i ? { ...v, caption: e.target.value } : v,
                    ),
                  )
                }
              />
            ) : null}
          </div>
        ))}

        {!atMax ? (
          <button
            type="button"
            className={cn(
              "media-drop media-drop--add",
              dragging && "is-dragging",
              busy && "is-busy",
            )}
            disabled={busy}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => setLibraryOpen(true)}
          >
            <span className="media-drop__empty">
              {busy ? (
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <ImagePlus className="size-4 text-muted-foreground" />
              )}
              <p>{busy ? "…" : "Add"}</p>
            </span>
          </button>
        ) : null}
      </div>

      <div className="media-card__toolbar">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={busy || atMax}
          onClick={() => setLibraryOpen(true)}
        >
          <Library className="size-3.5" />
          Library
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={busy || atMax}
          onClick={() => inputRef.current?.click()}
        >
          Upload new
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={busy || atMax}
          onClick={() => {
            setPasteOpen((o) => !o);
            setError(null);
          }}
        >
          <Link2 className="size-3.5" />
          Paste URL
        </Button>
        {atMax ? <span className="media-card__hint">PDF max reached</span> : null}
      </div>

      {pasteOpen && !atMax ? (
        <div className="media-card__paste">
          <input
            className="input"
            placeholder="https://…"
            value={pasteUrl}
            onChange={(e) => setPasteUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyPaste();
              }
            }}
          />
          <Button type="button" size="sm" onClick={applyPaste}>
            Add
          </Button>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <CloudinaryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        folder={folder}
        onSelect={(url) => addUrl(url)}
      />
    </div>
  );
}
