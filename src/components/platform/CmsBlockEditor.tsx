"use client";

import { useState } from "react";

type BlockRow = {
  id: string;
  slug: string;
  block_type: string;
  status: string;
  content: Record<string, unknown>;
};

export function CmsBlockEditor({ initialBlocks }: { initialBlocks: BlockRow[] }) {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedId, setSelectedId] = useState(initialBlocks[0]?.id ?? "");
  const [jsonText, setJsonText] = useState(
    JSON.stringify(initialBlocks[0]?.content ?? {}, null, 2),
  );
  const [message, setMessage] = useState<string | null>(null);

  const selected = blocks.find((b) => b.id === selectedId) ?? blocks[0];

  function selectBlock(id: string) {
    setSelectedId(id);
    const block = blocks.find((b) => b.id === id);
    setJsonText(JSON.stringify(block?.content ?? {}, null, 2));
    setMessage(null);
  }

  function saveLocal() {
    try {
      const parsed = JSON.parse(jsonText) as Record<string, unknown>;
      setBlocks((prev) =>
        prev.map((b) => (b.id === selectedId ? { ...b, content: parsed } : b)),
      );
      setMessage("JSON validated locally. Wire server action to persist draft blocks.");
    } catch {
      setMessage("Invalid JSON — fix syntax before saving.");
    }
  }

  return (
    <div className="grid-2" style={{ alignItems: "start" }}>
      <div className="panel">
        <p className="section-title">Blocks</p>
        <ul className="list-plain">
          {blocks.map((block) => (
            <li key={block.id}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => selectBlock(block.id)}
              >
                {block.slug} · {block.block_type}{" "}
                <span className="badge">{block.status}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="panel">
        <p className="section-title">
          Edit JSON — {selected?.slug} / {selected?.block_type}
        </p>
        <textarea
          className="textarea"
          rows={18}
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          spellCheck={false}
        />
        <div className="flex flex-wrap gap-2" style={{ marginTop: "0.75rem" }}>
          <button type="button" className="btn btn-primary" onClick={saveLocal}>
            Save draft (local)
          </button>
          <button type="button" className="btn btn-secondary" disabled title="Publish API pending">
            Publish live
          </button>
        </div>
        {message ? <p className="field-hint" style={{ marginTop: "0.75rem" }}>{message}</p> : null}
      </div>
    </div>
  );
}
