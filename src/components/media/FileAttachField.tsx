"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Paperclip, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  label?: string;
  value?: string | null;
  folder?: string;
  hint?: string;
  onChange: (url: string | undefined, meta?: { filename?: string }) => void;
};

/** Any-format attachment (image, PDF, Word, …) via Cloudinary auto upload. */
export function FileAttachField({
  label = "Attachment",
  value,
  folder = "vouchers",
  hint,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      body.append("resource_type", "auto");
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const data = (await res.json()) as {
        url?: string;
        filename?: string;
        error?: string;
      };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setFilename(data.filename ?? file.name);
      onChange(data.url, { filename: data.filename ?? file.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
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
        className="sr-only"
        disabled={busy}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void upload(file);
        }}
      />

      {value ? (
        <div className="file-attach">
          <Paperclip className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="file-attach__link"
          >
            {filename || "Open voucher"}
          </a>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0"
            onClick={() => {
              onChange(undefined);
              setFilename(null);
            }}
          >
            <Trash2 className="size-3.5" />
            <span className="sr-only">Remove</span>
          </Button>
        </div>
      ) : (
        <button
          type="button"
          className="file-attach file-attach--empty"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <FileUp className="size-4" />
          )}
          <span>{busy ? "Uploading…" : "Upload voucher (PDF, image, Word…)"}</span>
        </button>
      )}

      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}
