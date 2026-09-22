import masterGuidesFile from "@/lib/catalog/master-guides.generated.json";
import type { CatalogGuide } from "@/lib/catalog/db-catalog-ext";
import { guideSupplyKind, vehicleSupplyKind, type SupplyLinkKind } from "@/lib/inventory/supply-kind";

export type StaffOption = {
  id: string;
  name: string;
  subtitle: string;
  kind: SupplyLinkKind;
  day_rate_usd?: number;
};

export type VehicleOption = {
  id: string;
  name: string;
  subtitle: string;
  kind: SupplyLinkKind;
  day_rate_usd?: number;
};

type MasterGuidesFile = {
  guides?: Array<{
    id: string;
    name: string;
    phone?: string | null;
    languages?: string | null;
    license_no?: string | null;
    day_rate_usd?: number;
    notes?: string | null;
  }>;
  vehicles?: Array<{
    id: string;
    name: string;
    vehicle_type?: string | null;
    day_rate_usd?: number;
    plate?: string | null;
  }>;
};

/** Catalog guides for wizard — live only when metadata marks them. */
export function getCatalogGuideOptions(dbGuides?: CatalogGuide[]): StaffOption[] {
  if (dbGuides?.length) {
    return dbGuides.map((g) => ({
      id: g.id,
      name: g.name,
      subtitle: [g.languages, g.license_no ? `Lic. ${g.license_no}` : null, `$${g.day_rate_usd}/day`]
        .filter(Boolean)
        .join(" · "),
      kind: guideSupplyKind(g),
      day_rate_usd: g.day_rate_usd,
    }));
  }

  const file = masterGuidesFile as MasterGuidesFile;
  return (file.guides ?? []).slice(0, 80).map((g) => ({
    id: g.id,
    name: g.name,
    subtitle: [g.languages, g.license_no ? `Lic. ${g.license_no}` : null, `$${g.day_rate_usd ?? 30}/day`]
      .filter(Boolean)
      .join(" · "),
    kind: "catalog" as const,
    day_rate_usd: g.day_rate_usd,
  }));
}

export function getCatalogVehicleOptions(): VehicleOption[] {
  const file = masterGuidesFile as MasterGuidesFile;
  const fromMaster = (file.vehicles ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    subtitle: [v.vehicle_type, v.plate, `$${Math.round(v.day_rate_usd ?? 60)}/day`]
      .filter(Boolean)
      .join(" · "),
    kind: vehicleSupplyKind({ plate: v.plate, metadata: null }),
    day_rate_usd: v.day_rate_usd,
  }));
  if (fromMaster.length) return fromMaster;

  return [
    {
      id: "suv-santa-fe",
      name: "SUV / Santa Fe (chauffeur)",
      subtitle: "Catalog hire category",
      kind: "catalog",
      day_rate_usd: 60,
    },
    {
      id: "hiace",
      name: "Hiace / van (chauffeur)",
      subtitle: "Catalog hire category",
      kind: "catalog",
      day_rate_usd: 75,
    },
    {
      id: "bus",
      name: "Bus (group)",
      subtitle: "Catalog hire category",
      kind: "catalog",
      day_rate_usd: 120,
    },
  ];
}
