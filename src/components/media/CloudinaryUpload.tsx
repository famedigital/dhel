"use client";

import { useState } from "react";

type Props = {
  folder?: string;
  label?: string;
  onUploaded?: (url: string) => void;
};

export function CloudinaryUpload({
  folder = "brand",
  label = "Upload image",
  onUploaded,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [lastUrl, setLastUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("folder", folder);
      const res = await fetch("/api/media/upload", { method: "POST", body });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
      setLastUrl(data.url);
      onUploaded?.(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="field">
      <label>{label}</label>
      <input type="file" accept="image/*" disabled={busy} onChange={(e) => void onChange(e)} />
      {busy ? <p className="field-hint">Uploading…</p> : null}
      {error ? <p className="field-hint" style={{ color: "var(--danger, #b42318)" }}>{error}</p> : null}
      {lastUrl ? (
        <p className="field-hint">
          Uploaded:{" "}
          <a href={lastUrl} target="_blank" rel="noopener noreferrer">
            {lastUrl.slice(0, 48)}…
          </a>
        </p>
      ) : null}
    </div>
  );
}
