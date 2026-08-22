import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionContext } from "@/lib/agency";
import { createClient } from "@/lib/supabase/server";
import { saveGeminiKey, updateBrand, saveMarkupSettings, uploadBrandLetterPhoto, loadAgencyRateDefaults } from "@/app/actions/agency";
import { BrandPhotoUpload } from "@/components/settings/BrandPhotoUpload";
import { CloudinaryUpload } from "@/components/media/CloudinaryUpload";
import { RateDefaultsForm } from "@/components/settings/RateDefaultsForm";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!ctx.agency) redirect("/onboarding");

  const params = await searchParams;
  const isOwner = ctx.membership?.role === "owner";
  const supabase = await createClient();

  let hasGemini = false;
  if (ctx.agency) {
    const { data } = await supabase.rpc("agency_has_gemini_key", {
      p_agency_id: ctx.agency.id,
    });
    hasGemini = Boolean(data);
  }

  const brand = ctx.brand;

  let markupDefaults = {
    default_markup_percent: 10,
    pelbu_own_hotel_markup_percent: 0,
    hotel_markup_percent: 10,
    min_margin_percent: 5,
  };
  const { data: agencySettings } = await supabase
    .from("agency_settings")
    .select("markup_settings")
    .eq("agency_id", ctx.agency.id)
    .maybeSingle();
  if (agencySettings?.markup_settings && typeof agencySettings.markup_settings === "object") {
    markupDefaults = { ...markupDefaults, ...(agencySettings.markup_settings as typeof markupDefaults) };
  }

  const rateDefaults = await loadAgencyRateDefaults(ctx.agency.id);

  return (
    <AppShell
      agencyName={ctx.agency.name}
      email={ctx.email}
      role={ctx.membership?.role}
    >
      <h1 className="page-title">Settings</h1>
      <p className="page-lead">
        Brand kit and server-only Gemini key for {ctx.agency.name}. Guest PDFs use this brand —
        not a marketplace booking setup.
      </p>

      {params.error ? <div className="alert alert-error">{params.error}</div> : null}
      {params.saved ? <div className="alert alert-ok">Settings saved.</div> : null}

      <div className="panel">
        <p className="section-title">Brand</p>
        {!isOwner ? (
          <p className="field-hint">Only agency owners can edit brand settings.</p>
        ) : null}
        <form action={updateBrand} className="form-stack">
          <fieldset disabled={!isOwner} style={{ border: 0, padding: 0, margin: 0 }}>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="display_name">Display name</label>
                <input
                  className="input"
                  id="display_name"
                  name="display_name"
                  defaultValue={brand?.display_name || ctx.agency.name}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="default_template_id">Default template</label>
                <select
                  className="select"
                  id="default_template_id"
                  name="default_template_id"
                  defaultValue={brand?.default_template_id || "classic-luxury"}
                >
                  <option value="classic-luxury">Classic Luxury (client-ready PDF)</option>
                  <option value="compact">Compact (shell · not client-ready)</option>
                  <option value="editorial-deep">Editorial Deep (shell · not client-ready)</option>
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="website">Website</label>
                <input className="input" id="website" name="website" defaultValue={brand?.website || ""} />
              </div>
              <div className="field">
                <label htmlFor="whatsapp">WhatsApp</label>
                <input className="input" id="whatsapp" name="whatsapp" defaultValue={brand?.whatsapp || ""} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="email">Email</label>
                <input className="input" id="email" name="email" type="email" defaultValue={brand?.email || ""} />
              </div>
              <div className="field">
                <label htmlFor="since_year">Since year</label>
                <input
                  className="input"
                  id="since_year"
                  name="since_year"
                  type="number"
                  defaultValue={brand?.since_year || ""}
                />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="signatory_names">Signatory names</label>
                <input
                  className="input"
                  id="signatory_names"
                  name="signatory_names"
                  defaultValue={brand?.signatory_names || ""}
                />
              </div>
              <div className="field">
                <label htmlFor="signatory_title">Signatory title</label>
                <input
                  className="input"
                  id="signatory_title"
                  name="signatory_title"
                  defaultValue={brand?.signatory_title || ""}
                />
              </div>
            </div>
            <div className="field">
              <label htmlFor="voice">Brand voice (for Gemini)</label>
              <textarea
                className="textarea"
                id="voice"
                name="voice"
                rows={3}
                defaultValue={brand?.voice || ""}
                placeholder="Warm, precise, luxury lodge tone…"
              />
            </div>
            {isOwner ? (
              <button type="submit" className="btn btn-primary">
                Save brand
              </button>
            ) : null}
          </fieldset>
        </form>
        {isOwner ? (
          <BrandPhotoUpload
            agencyId={ctx.agency.id}
            currentPath={brand?.letter_photo_path}
            uploadAction={uploadBrandLetterPhoto}
            label="Owner / signatory photo (welcome letter PDF)"
            hint="Square portrait works best. Appears on page 2 of Classic Luxury PDF."
          />
        ) : null}
        {isOwner ? (
          <CloudinaryUpload
            folder="brand"
            label="Cloudinary brand asset (optional — copy URL into brand notes or catalog)"
          />
        ) : null}
      </div>

      <div className="panel">
        <p className="section-title">Guide, vehicle & room rates</p>
        <RateDefaultsForm defaults={rateDefaults} disabled={!isOwner} />
      </div>

      <div className="panel">
        <p className="section-title">AI provider</p>
        <p className="field-hint" style={{ marginBottom: "0.75rem" }}>
          Platform default is set via <code>AI_PROVIDER</code> in server env:{" "}
          <strong>{process.env.AI_PROVIDER?.trim() || "gemini"}</strong>.
          Use <code>cursor</code> with <code>CURSOR_API_KEY</code> from{" "}
          <a href="https://cursor.com/dashboard" className="underline" target="_blank" rel="noreferrer">
            Cursor Dashboard
          </a>
          . Cursor runs agent workflows (not a drop-in Gemini replacement) — best on local dev; Vercel may be limited.
        </p>
        <p className="field-hint">
          Gemini agency keys below apply when <code>AI_PROVIDER=gemini</code>.
        </p>
      </div>

      <div className="panel">
        <p className="section-title">Gemini API key</p>
        <p className="field-hint" style={{ marginBottom: "1rem" }}>
          Status: {hasGemini ? "Key on file" : "No key stored"}. Paste a new key to replace.
          Reading keys for generation requires SUPABASE_SERVICE_ROLE_KEY on the server (or set platform GEMINI_API_KEY).
        </p>
        {isOwner ? (
          <form action={saveGeminiKey} className="form-stack">
            <div className="field">
              <label htmlFor="gemini_api_key">New Gemini API key</label>
              <input
                className="input"
                id="gemini_api_key"
                name="gemini_api_key"
                type="password"
                autoComplete="off"
                placeholder={hasGemini ? "•••••••• (leave blank to keep)" : "AIza…"}
              />
            </div>
            <button type="submit" className="btn btn-secondary">
              Save Gemini key
            </button>
          </form>
        ) : (
          <p className="field-hint">Owner only.</p>
        )}
      </div>

      <div className="panel">
        <p className="section-title">Markup & margin (agent-only on PDF)</p>
        <p className="field-hint" style={{ marginBottom: "1rem" }}>
          Client PDF shows sell total only. These rules drive cost vs margin in proposal cards.
        </p>
        {isOwner ? (
          <form action={saveMarkupSettings} className="form-stack">
            <div className="grid-2">
              <div className="field">
                <label htmlFor="default_markup_percent">Default markup %</label>
                <input className="input" id="default_markup_percent" name="default_markup_percent" type="number" defaultValue={markupDefaults.default_markup_percent} />
              </div>
              <div className="field">
                <label htmlFor="hotel_markup_percent">Hotel markup %</label>
                <input className="input" id="hotel_markup_percent" name="hotel_markup_percent" type="number" defaultValue={markupDefaults.hotel_markup_percent} />
              </div>
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="pelbu_own_hotel_markup_percent">Pelbu own-hotel markup %</label>
                <input className="input" id="pelbu_own_hotel_markup_percent" name="pelbu_own_hotel_markup_percent" type="number" defaultValue={markupDefaults.pelbu_own_hotel_markup_percent} />
              </div>
              <div className="field">
                <label htmlFor="min_margin_percent">Min margin floor %</label>
                <input className="input" id="min_margin_percent" name="min_margin_percent" type="number" defaultValue={markupDefaults.min_margin_percent} />
              </div>
            </div>
            <button type="submit" className="btn btn-secondary">Save markup rules</button>
          </form>
        ) : (
          <p className="field-hint">Owner only.</p>
        )}
      </div>
    </AppShell>
  );
}
