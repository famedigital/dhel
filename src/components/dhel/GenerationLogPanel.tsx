import type { GenerationMeta } from "@/lib/types";

export function GenerationLogPanel({ meta }: { meta?: GenerationMeta | null }) {
  if (!meta || Object.keys(meta).length === 0) {
    return (
      <div className="panel">
        <p className="section-title">Generation log</p>
        <p className="empty">No generation metadata saved for this itinerary yet.</p>
        <p className="field-hint">
          Create a new proposal from the desk to persist prompts, reference file, and AI provider.
        </p>
      </div>
    );
  }

  return (
    <div className="panel">
      <p className="section-title">Generation log</p>
      <p className="field-hint" style={{ marginBottom: "1rem" }}>
        Read-only audit from proposal generation — useful when debugging stub fallbacks.
      </p>

      <dl className="meta-list">
        {meta.generated_at ? (
          <>
            <dt>Generated</dt>
            <dd>{new Date(meta.generated_at).toLocaleString()}</dd>
          </>
        ) : null}
        {meta.ai_provider ? (
          <>
            <dt>AI provider</dt>
            <dd>{meta.ai_provider}</dd>
          </>
        ) : null}
        {meta.reference_file ? (
          <>
            <dt>Reference HTML</dt>
            <dd>{meta.reference_file}</dd>
          </>
        ) : null}
        {meta.warnings?.length ? (
          <>
            <dt>Warnings</dt>
            <dd>{meta.warnings.join(" · ")}</dd>
          </>
        ) : null}
      </dl>

      {meta.final_brief ? (
        <div className="field" style={{ marginTop: "1rem" }}>
          <label>Final brief</label>
          <pre className="code-block">{meta.final_brief}</pre>
        </div>
      ) : null}

      {meta.client_reply ? (
        <div className="field">
          <label>Client reply draft</label>
          <pre className="code-block">{meta.client_reply}</pre>
        </div>
      ) : null}

      {meta.narrative_prompt ? (
        <div className="field">
          <label>Narrative prompt</label>
          <pre className="code-block">{meta.narrative_prompt}</pre>
        </div>
      ) : null}

      {meta.messages?.length ? (
        <div className="field">
          <label>Desk chat ({meta.messages.length} messages)</label>
          <div className="chat-log">
            {meta.messages.map((m, i) => (
              <div className={`chat-log-row is-${m.role}`} key={i}>
                <span className="chat-log-role">{m.role}</span>
                <pre>{m.content}</pre>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {meta.compare_table ? (
        <div className="field">
          <label>Compare table snapshot</label>
          <pre className="code-block">{JSON.stringify(meta.compare_table, null, 2)}</pre>
        </div>
      ) : null}

      {meta.package_option ? (
        <div className="field">
          <label>Selected package</label>
          <pre className="code-block">{JSON.stringify(meta.package_option, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
