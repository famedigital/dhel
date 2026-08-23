type OpsLog = {
  id: string;
  category: string;
  amount_nu: number | null;
  note: string | null;
  photo_urls: string[] | null;
  role: string | null;
  day_number: number | null;
  created_at: string;
};

export function OpsFieldFeedPanel({ logs }: { logs: OpsLog[] }) {
  if (!logs.length) {
    return (
      <p className="field-hint">
        No field uploads yet. Guides and drivers log tickets and bills from the Field portal
        Today screen.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold tracking-tight">Field uploads</h2>
      <p className="text-xs text-muted-foreground">Latest from guide/driver portal</p>
      <ul className="space-y-3">
        {logs.map((log) => (
          <li
            key={log.id}
            className="rounded-lg border border-border bg-card p-3 text-sm"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <strong className="capitalize">
                {String(log.category).replace(/_/g, " ")}
              </strong>
              <span className="text-[11px] text-muted-foreground">
                {log.role || "staff"}
                {log.day_number != null ? ` · day ${log.day_number}` : ""}
                {" · "}
                {new Date(log.created_at).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {log.amount_nu != null ? `Nu ${log.amount_nu}` : null}
              {log.amount_nu != null && log.note ? " · " : null}
              {log.note || (!log.amount_nu ? "—" : null)}
            </p>
            {log.photo_urls?.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {log.photo_urls.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded border border-border"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-16 w-16 object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
