"use client";

import { useState } from "react";

export function PresetChips({
  presets,
}: {
  presets: { id: string; label: string; days: number; brief_template: string | null }[];
}) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="chips">
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          className="chip"
          style={
            selected === p.id
              ? { borderColor: "var(--accent)", background: "var(--accent-soft)" }
              : undefined
          }
          onClick={() => {
            setSelected(p.id);
            const brief = document.getElementById("brief") as HTMLTextAreaElement | null;
            const days = document.getElementById("days") as HTMLInputElement | null;
            const title = document.getElementById("title") as HTMLInputElement | null;
            if (brief && p.brief_template) brief.value = p.brief_template;
            if (days) days.value = String(p.days);
            if (title && !title.value) title.value = p.label;
          }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
