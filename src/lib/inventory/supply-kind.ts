/** Supply link helpers — live network vs plain catalog select. */

export type SupplyLinkKind = "live" | "catalog";

export function hotelSupplyKind(row: {
  pelbu_property_id?: string | null;
  source?: string;
  name?: string;
}): SupplyLinkKind {
  if (row.pelbu_property_id) return "live";
  if (row.source === "pelbu") return "live";
  return "catalog";
}

export function guideSupplyKind(row: {
  metadata?: Record<string, unknown> | null;
  portal_user_id?: string | null;
}): SupplyLinkKind {
  if (row.portal_user_id) return "live";
  const m = row.metadata ?? {};
  if (m.live_calendar === true || m.chhu_driver_id || m.guide_os_id) return "live";
  return "catalog";
}

export function vehicleSupplyKind(row: {
  metadata?: Record<string, unknown> | null;
  plate?: string | null;
}): SupplyLinkKind {
  const m = row.metadata ?? {};
  if (m.chhu_fleet_id || m.live_fleet === true) return "live";
  return "catalog";
}

export function supplyKindLabel(kind: SupplyLinkKind): string {
  return kind === "live" ? "Live inventory" : "Catalog";
}
