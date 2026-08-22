"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PreviewRow = Record<string, string>;

function parseCsvPreview(text: string, limit = 20): { headers: string[]; rows: PreviewRow[] } {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = lines[0].split(",").map((h) => h.trim());
  const rows = lines.slice(1, limit + 1).map((line) => {
    const cells = line.split(",").map((c) => c.trim());
    const row: PreviewRow = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] ?? "";
    });
    return row;
  });

  return { headers, rows };
}

export function LibraryBulkUpload() {
  const [entityType, setEntityType] = useState("catalog_hotels");
  const [filename, setFilename] = useState<string | null>(null);
  const [csvText, setCsvText] = useState("");
  const [dryRun, setDryRun] = useState<{ insert: number; update: number; skip: number } | null>(
    null,
  );

  const preview = useMemo(() => parseCsvPreview(csvText), [csvText]);

  function onFileChange(file: File | null) {
    if (!file) {
      setFilename(null);
      setCsvText("");
      setDryRun(null);
      return;
    }
    setFilename(file.name);
    setDryRun(null);
    const reader = new FileReader();
    reader.onload = () => setCsvText(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  function runDryRun() {
    const total = Math.max(0, csvText.split(/\r?\n/).filter(Boolean).length - 1);
    setDryRun({
      insert: Math.floor(total * 0.7),
      update: Math.floor(total * 0.2),
      skip: total - Math.floor(total * 0.7) - Math.floor(total * 0.2),
    });
  }

  return (
    <div className="panel">
      <p className="section-title">Bulk CSV upload</p>
      <p className="field-hint" style={{ marginBottom: "1rem" }}>
        Upload master catalog data. Preview is client-side only — commit wiring comes in Phase 2.1.
      </p>

      <div className="form-stack">
        <div className="field">
          <label htmlFor="entity_type">Entity type</label>
          <select
            className="select"
            id="entity_type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
          >
            <option value="catalog_hotels">Hotels</option>
            <option value="catalog_room_rates">Room rates</option>
            <option value="catalog_guides">Guides</option>
            <option value="catalog_drivers">Drivers</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="csv_file">CSV file</label>
          <input
            className="input"
            id="csv_file"
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {filename ? <p className="field-hint">Selected: {filename}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-secondary" onClick={runDryRun} disabled={!csvText}>
            Dry run (mock)
          </button>
          <button type="button" className="btn btn-primary" disabled title="Server import not wired yet">
            Commit import
          </button>
          <a className="btn btn-ghost" href="/templates/library-hotels.csv" download>
            Download template
          </a>
        </div>

        {dryRun ? (
          <div className="alert alert-ok">
            Dry run for <strong>{entityType}</strong>: {dryRun.insert} insert · {dryRun.update} update ·{" "}
            {dryRun.skip} skip
          </div>
        ) : null}
      </div>

      {preview.headers.length > 0 ? (
        <div style={{ marginTop: "1.25rem", overflowX: "auto" }}>
          <p className="section-title">Preview (first {preview.rows.length} rows)</p>
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {preview.headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.rows.map((row, idx) => (
                <TableRow key={idx}>
                  {preview.headers.map((h) => (
                    <TableCell key={h}>{row[h]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}
    </div>
  );
}
