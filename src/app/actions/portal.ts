"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { getPortalStaff } from "@/lib/portal/staff";
import { buildStaticEmv } from "@/lib/payments/emv";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { resolvePlatformAiKey } from "@/lib/ai/config";
import { resolveGeminiModel, GEMINI_FAST_PROVIDER_OPTIONS } from "@/lib/ai/model";

function safeNext(value: FormDataEntryValue | null, fallback: string) {
  const next = String(value || fallback);
  return next.startsWith("/") ? next : fallback;
}

export async function portalSignIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"), "/portal");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(
      `/portal/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`,
    );
  }
  redirect(next);
}

export async function portalSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/portal/login");
}

export async function savePortalProfile(formData: FormData) {
  const role = String(formData.get("role") || "") as "guide" | "driver";
  const asId = String(formData.get("as") || "").trim() || null;
  const staff = await getPortalStaff({ role, asId });
  if (!staff) redirect("/portal/login");

  const bio = String(formData.get("bio") || "").trim() || null;
  const bio_draft = String(formData.get("bio_draft") || "").trim() || null;
  const photo_url = String(formData.get("photo_url") || "").trim() || null;
  const bank = String(formData.get("bank") || "").trim() || null;
  const account_no = String(formData.get("account_no") || "").trim() || null;
  const payee_name =
    String(formData.get("payee_name") || "").trim() || staff.row.name;
  const phone = String(formData.get("phone") || "").trim() || null;

  let emv_static = staff.row.emv_static;
  if (account_no && payee_name) {
    emv_static = buildStaticEmv({
      merchant: account_no,
      name: payee_name,
      city: "Thimphu",
    });
  }

  const table = staff.role === "guide" ? "guides" : "drivers";
  const supabase = createAdminClient() ?? (await createClient());
  const patch: Record<string, unknown> = {
    bio,
    bio_draft,
    photo_url,
    bank,
    account_no,
    payee_name,
    phone,
    emv_static,
    updated_at: new Date().toISOString(),
  };
  if (staff.role === "driver") {
    const raw = String(formData.get("vehicle_photos") || "").trim();
    if (raw) {
      patch.vehicle_photos = raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  await supabase.from(table).update(patch).eq("id", staff.row.id);
  revalidatePath("/portal");
  revalidatePath("/platform/portal");
  const q = asId ? `?as=${asId}` : "";
  redirect(`/portal/${staff.role}/profile${q}?saved=1`);
}

export async function polishPortalBio(formData: FormData) {
  const role = String(formData.get("role") || "") as "guide" | "driver";
  const asId = String(formData.get("as") || "").trim() || null;
  const draft = String(formData.get("bio_draft") || "").trim();
  const staff = await getPortalStaff({ role, asId });
  if (!staff) redirect("/portal/login");
  if (!draft) {
    redirect(
      `/portal/${role}/profile${asId ? `?as=${asId}&` : "?"}error=` +
        encodeURIComponent("Write a short draft first"),
    );
  }

  const key = resolvePlatformAiKey("gemini");
  if (!key) {
    redirect(
      `/portal/${role}/profile${asId ? `?as=${asId}&` : "?"}error=` +
        encodeURIComponent("GEMINI_API_KEY not configured"),
    );
  }

  const google = createGoogleGenerativeAI({ apiKey: key });
  const { text } = await generateText({
    model: google(resolveGeminiModel(process.env.GEMINI_MODEL)),
    prompt: `Polish this Bhutan ${role} profile into 2–3 professional sentences. Keep facts; improve grammar. Return only the polished bio.\n\nDraft:\n${draft}`,
    providerOptions: GEMINI_FAST_PROVIDER_OPTIONS,
  });

  const table = staff.role === "guide" ? "guides" : "drivers";
  const supabase = createAdminClient() ?? (await createClient());
  await supabase
    .from(table)
    .update({ bio: text.trim(), bio_draft: draft, updated_at: new Date().toISOString() })
    .eq("id", staff.row.id);

  revalidatePath(`/portal/${role}/profile`);
  redirect(`/portal/${role}/profile${asId ? `?as=${asId}&` : "?"}saved=1`);
}

export async function addTripOpsLog(formData: FormData) {
  const role = String(formData.get("role") || "") as "guide" | "driver";
  const asId = String(formData.get("as") || "").trim() || null;
  const itinerary_id = String(formData.get("itinerary_id") || "").trim();
  const category = String(formData.get("category") || "").trim();
  const note = String(formData.get("note") || "").trim() || null;
  const amount_nu = Number(formData.get("amount_nu")) || null;
  const day_number = Number(formData.get("day_number")) || null;
  const photo_url = String(formData.get("photo_url") || "").trim();

  const staff = await getPortalStaff({ role, asId });
  if (!staff || !itinerary_id || !category) {
    redirect("/portal/login");
  }

  const ctx = await getSessionContext();
  const supabase = createAdminClient() ?? (await createClient());
  await supabase.from("trip_ops_logs").insert({
    agency_id: staff.agencyId,
    itinerary_id,
    day_number,
    category,
    amount_nu,
    note,
    photo_urls: photo_url ? [photo_url] : [],
    submitted_by: ctx?.userId ?? null,
    role: staff.role,
  });

  revalidatePath(`/portal/${role}/trips/${itinerary_id}/today`);
  const q = asId ? `?as=${asId}&` : "?";
  redirect(`/portal/${role}/trips/${itinerary_id}/today${q}saved=1`);
}

export async function invitePortalLogin(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx || !isPlatformAdmin(ctx)) {
    redirect("/desk?error=" + encodeURIComponent("Superadmin only"));
  }

  const role = String(formData.get("role") || "") as "guide" | "driver";
  const id = String(formData.get("id") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim() || "Portal123!";
  const name = String(formData.get("name") || "").trim();
  const agency_id = String(formData.get("agency_id") || "").trim() || ctx.agency?.id;

  if (!email || !agency_id) {
    redirect(
      "/platform/portal?error=" + encodeURIComponent("Email and agency required"),
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    redirect(
      "/platform/portal?error=" +
        encodeURIComponent("SUPABASE_SERVICE_ROLE_KEY required to invite"),
    );
  }

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { portal_role: role, name },
  });

  let userId = created.user?.id;
  if (createErr) {
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
    if (!existing) {
      redirect("/platform/portal?error=" + encodeURIComponent(createErr.message));
    }
    userId = existing.id;
  }

  const table = role === "guide" ? "guides" : "drivers";
  if (id) {
    await admin
      .from(table)
      .update({
        portal_user_id: userId,
        portal_email: email,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  } else {
    await admin.from(table).insert({
      agency_id,
      name: name || email.split("@")[0],
      portal_user_id: userId,
      portal_email: email,
      active: true,
    });
  }

  revalidatePath("/platform/portal");
  revalidatePath("/resources/guides");
  revalidatePath("/resources/drivers");
  redirect(
    "/platform/portal?saved=1&message=" +
      encodeURIComponent(`Portal login ready for ${email} (temp password set)`),
  );
}
