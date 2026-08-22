"use client";

import { useRef, useState, type DragEvent } from "react";
import { ImagePlus, Library, Link2, Loader2, Trash2 } from "lucide-react";
import { CloudinaryPicker } from "@/components/media/CloudinaryPicker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value?: string | null;
  folder?: string;
  hint?: string;
  onChange: (url: string | undefined) => void;
};

/** Single-photo control — library, upload, dropzone, URL. */
export function MediaField({
  label,
  value,
  folder = "itineraries",
  hint,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteUrl, setPasteUrl] = useState(value ?? "");
  const [dragging, setDragging] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
      setPasteUrl(data.url);
      setPasteOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) void upload(file);
  }

  function applyPaste() {
    const url = pasteUrl.trim();
    if (!url) {
      onChange(undefined);
      setPasteOpen(false);
      return;
    }
    if (!/^https?:\/\//i.test(url) && !url.startsWith("/")) {
      setError("Use a full https:// URL or a site path starting with /");
      return;
    }
    setError(null);
    onChange(url);
    setPasteOpen(false);
  }

  return (
    <div className="media-card">
      <div className="media-card__meta">
        <span className="media-card__label">{label}</span>
        {hint ? <span className="media-card__hint">{hint}</span> : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      <div
        className={cn(
          "media-drop",
          value && "media-drop--filled",
          dragging && "is-dragging",
          busy && "is-busy",
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => {
          if (!value && !busy) setLibraryOpen(true);
        }}
        role={value ? undefined : "button"}
        tabIndex={value ? undefined : 0}
        onKeyDown={(e) => {
          if (!value && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setLibraryOpen(true);
          }
        }}
      >
        {value ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="media-drop__img" />
            <div className="media-drop__veil">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  setLibraryOpen(true);
                }}
              >
                Library
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-8"
                disabled={busy}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                Upload
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 bg-background/80 hover:bg-background"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setPasteUrl("");
                }}
              >
                <Trash2 className="size-3.5" />
                <span className="sr-only">Remove</span>
              </Button>
            </div>
          </>
        ) : (
          <div className="media-drop__empty">
            {busy ? (
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            ) : (
              <ImagePlus className="size-5 text-muted-foreground" />
            )}
            <p>{busy ? "Uploading…" : "Library or drop image"}</p>
          </div>
        )}
        {busy && value ? (
          <div className="media-drop__busy">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : null}
      </div>

      <div className="media-card__toolbar">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={busy}
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
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          Upload new
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs text-muted-foreground"
          disabled={busy}
          onClick={() => {
            setPasteUrl(value ?? "");
            setPasteOpen((o) => !o);
            setError(null);
          }}
        >
          <Link2 className="size-3.5" />
          Paste URL
        </Button>
      </div>

      {pasteOpen ? (
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
            Use
          </Button>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      <CloudinaryPicker
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        folder={folder}
        onSelect={(url) => {
          onChange(url);
          setPasteUrl(url);
        }}
      />
    </div>
  );
}
