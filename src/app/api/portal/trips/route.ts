import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** List recent itineraries for traveler stash sync when online. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ trips: [] });

  const { data: membership } = await supabase
    .from("memberships")
    .select("agency_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership) return NextResponse.json({ trips: [] });

  const { data, error } = await supabase
    .from("itineraries")
    .select("id, title, client_name, content, brief, language, updated_at")
    .eq("agency_id", membership.agency_id)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ trips: data ?? [] });
}
