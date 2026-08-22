"use client";

export function BrandPhotoUpload({
  agencyId,
  currentPath,
  uploadAction,
  label,
  hint,
}: {
  agencyId: string;
  currentPath?: string | null;
  uploadAction: (formData: FormData) => Promise<void>;
  label: string;
  hint?: string;
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previewUrl = currentPath && supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/brand-assets/${currentPath}`
    : "/images/Rajiv_Tshering.jpg";

  return (
    <div className="field">
      <label>{label}</label>
      {hint ? <p className="field-hint" style={{ marginBottom: "0.5rem" }}>{hint}</p> : null}
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl}
          alt=""
          style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }}
        />
        <form action={uploadAction} className="form-stack" style={{ flex: 1, minWidth: 200 }}>
          <input type="hidden" name="agency_id" value={agencyId} />
          <input className="input" type="file" name="photo" accept="image/jpeg,image/png,image/webp" required />
          <button type="submit" className="btn btn-secondary btn-sm">Upload photo</button>
        </form>
      </div>
    </div>
  );
}
