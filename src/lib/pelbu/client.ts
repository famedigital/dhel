/** Pelbu PMS connector stub — swap for live API when credentials are configured. */

export type PelbuDateRange = {
  checkIn: string;
  checkOut: string;
};

export type PelbuRoomAvailability = {
  roomType: string;
  available: number;
  mealPlan: string;
};

export type PelbuAvailability = {
  propertyId: string;
  propertyName: string;
  dates: PelbuDateRange;
  rooms: PelbuRoomAvailability[];
  syncedAt: string;
};

export type PelbuRateRow = {
  roomType: string;
  mealPlan: string;
  netUsd: number;
  currency: string;
};

export type PelbuRates = {
  propertyId: string;
  propertyName: string;
  rates: PelbuRateRow[];
  syncedAt: string;
};

const PELBU_OLAKHA = {
  propertyId: "pelbu-olakha",
  propertyName: "Pelbu Suites Olakha",
  city: "Thimphu",
} as const;

const MOCK_AVAILABILITY: Record<string, Omit<PelbuAvailability, "dates">> = {
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

const MOCK_RATES: Record<string, PelbuRates> = {
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

export class PelbuConnector {
  /** Live availability for a property and date range. */
  async getAvailability(
    propertyId: string,
    dates: PelbuDateRange,
  ): Promise<PelbuAvailability | null> {
    const base = MOCK_AVAILABILITY[propertyId];
    if (!base) return null;
    return { ...base, dates };
  }

  /** Net rack / contract rates for a property. */
  async getRates(propertyId: string): Promise<PelbuRates | null> {
    return MOCK_RATES[propertyId] ?? null;
  }
}

export const pelbu = new PelbuConnector();
