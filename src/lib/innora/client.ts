/** Innora / Pelbu hotel partner connector — live ARI + rates when configured. */

export type InnoraDateRange = {
  checkIn: string;
  checkOut: string;
};

export type InnoraRoomAvailability = {
  roomType: string;
  available: number;
  mealPlan: string;
};

export type InnoraAvailability = {
  propertyId: string;
  propertyName: string;
  dates: InnoraDateRange;
  rooms: InnoraRoomAvailability[];
  syncedAt: string;
  source: "live" | "mock";
};

export type InnoraRateRow = {
  roomType: string;
  mealPlan: string;
  netUsd: number;
  currency: string;
};

export type InnoraRates = {
  propertyId: string;
  propertyName: string;
  rates: InnoraRateRow[];
  syncedAt: string;
  source: "live" | "mock";
};

const PELBU_OLAKHA = {
  propertyId: "pelbu-olakha",
  propertyName: "Pelbu Suites Olakha",
  city: "Thimphu",
} as const;

const MOCK_AVAILABILITY: Record<string, Omit<InnoraAvailability, "dates" | "source">> = {
  "pelbu-olakha": {
    propertyId: PELBU_OLAKHA.propertyId,
    propertyName: PELBU_OLAKHA.propertyName,
    rooms: [
      { roomType: "Deluxe Twin", available: 4, mealPlan: "MAP" },
      { roomType: "Executive King", available: 2, mealPlan: "MAP" },
    ],
    syncedAt: new Date().toISOString(),
  },
};

const MOCK_RATES: Record<string, Omit<InnoraRates, "source">> = {
  "pelbu-olakha": {
    propertyId: PELBU_OLAKHA.propertyId,
    propertyName: PELBU_OLAKHA.propertyName,
    rates: [
      { roomType: "Deluxe Twin", mealPlan: "MAP", netUsd: 95, currency: "USD" },
      { roomType: "Executive King", mealPlan: "MAP", netUsd: 120, currency: "USD" },
    ],
    syncedAt: new Date().toISOString(),
  },
};

function liveConfig() {
  const baseUrl =
    process.env.INNORA_API_URL ||
    process.env.PELBU_API_URL ||
    "";
  const apiKey =
    process.env.INNORA_API_KEY ||
    process.env.PELBU_API_KEY ||
    "";
  return { baseUrl: baseUrl.replace(/\/$/, ""), apiKey };
}

/** @deprecated Use InnoraConnector — alias kept for existing imports. */
export type PelbuDateRange = InnoraDateRange;
export type PelbuAvailability = InnoraAvailability;
export type PelbuRates = InnoraRates;

export class InnoraConnector {
  async getAvailability(
    propertyId: string,
    dates: InnoraDateRange,
  ): Promise<InnoraAvailability | null> {
    const { baseUrl, apiKey } = liveConfig();
    if (baseUrl && apiKey) {
      try {
        const url = `${baseUrl}/api/partner/v1/properties/${encodeURIComponent(propertyId)}/availability?from=${encodeURIComponent(dates.checkIn)}&to=${encodeURIComponent(dates.checkOut)}`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          next: { revalidate: 60 },
        });
        if (res.ok) {
          const data = (await res.json()) as InnoraAvailability;
          return { ...data, dates, source: "live", syncedAt: new Date().toISOString() };
        }
      } catch {
        /* fall through to mock */
      }
    }

    const base = MOCK_AVAILABILITY[propertyId];
    if (!base) return null;
    return { ...base, dates, source: "mock" };
  }

  async getRates(propertyId: string): Promise<InnoraRates | null> {
    const { baseUrl, apiKey } = liveConfig();
    if (baseUrl && apiKey) {
      try {
        const url = `${baseUrl}/api/partner/v1/properties/${encodeURIComponent(propertyId)}/rates`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${apiKey}` },
          next: { revalidate: 300 },
        });
        if (res.ok) {
          const data = (await res.json()) as InnoraRates;
          return { ...data, source: "live", syncedAt: new Date().toISOString() };
        }
      } catch {
        /* fall through */
      }
    }
    const mock = MOCK_RATES[propertyId];
    return mock ? { ...mock, source: "mock" } : null;
  }
}

/** Back-compat alias */
export class PelbuConnector extends InnoraConnector {}

export const innoraConnector = new InnoraConnector();
