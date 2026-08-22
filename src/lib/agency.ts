import { createClient } from "@/lib/supabase/server";
import type { Agency, Brand, Membership } from "@/lib/types";

export type SessionContext = {
  userId: string;
  email: string | null;
  membership: Membership | null;
  agency: Agency | null;
  brand: Brand | null;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: membership } = await supabase
    .from("memberships")
    .select("*, agencies(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  const agency = (membership?.agencies as Agency | undefined) ?? null;

  let brand: Brand | null = null;
  if (agency) {
    const { data } = await supabase
      .from("brands")
      .select("*")
      .eq("agency_id", agency.id)
      .maybeSingle();
    brand = (data as Brand | null) ?? null;
  }

  return {
    userId: user.id,
    email: user.email ?? null,
    membership: membership
      ? ({
          id: membership.id,
          user_id: membership.user_id,
          agency_id: membership.agency_id,
          role: membership.role,
          created_at: membership.created_at,
        } as Membership)
      : null,
    agency,
    brand,
  };
}
