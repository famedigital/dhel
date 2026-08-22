"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";

export async function approveBillingSubmission(formData: FormData) {
  const ctx = await getSessionContext();
  if (!ctx || !isPlatformAdmin(ctx)) {
    redirect("/desk");
  }

  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  if (!id || !["approved", "rejected"].includes(decision)) {
    redirect("/platform/billing");
  }

  const supabase = await createClient();
  const expiresAt =
    decision === "approved"
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null;

  await supabase
    .from("billing_submissions")
    .update({
      status: decision,
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      plan_expires_at: expiresAt,
    })
    .eq("id", id);

  if (decision === "approved") {
    const { data: submission } = await supabase
      .from("billing_submissions")
      .select("agency_id, plan, plan_expires_at")
      .eq("id", id)
      .maybeSingle();

    if (submission?.agency_id) {
      await supabase.from("agency_settings").upsert({
        agency_id: submission.agency_id,
        plan: submission.plan,
        plan_expires_at: submission.plan_expires_at ?? expiresAt,
        updated_at: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/platform/billing");
  redirect("/platform/billing");
}
