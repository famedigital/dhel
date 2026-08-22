"use client";

import { createRxDatabase, type RxCollection, type RxDatabase } from "rxdb";
import { getRxStorageLocalstorage } from "rxdb/plugins/storage-localstorage";

export type StashedTrip = {
  id: string;
  title: string;
  clientName?: string;
  days: number;
  language: string;
  content: Record<string, unknown>;
  brief?: string;
  updatedAt: number;
  syncedAt?: number;
};

type TripDoc = StashedTrip;

type StashCollections = {
  trips: RxCollection<TripDoc>;
};

type StashDatabase = RxDatabase<StashCollections>;

/** Survive Fast Refresh — module `let` resets on HMR but RxDB keeps the old instance. */
const globalForStash = globalThis as typeof globalThis & {
  __dhelStashDb?: Promise<StashDatabase> | null;
};

const tripSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 64 },
    title: { type: "string" },
    clientName: { type: "string" },
    days: { type: "number" },
    language: { type: "string" },
    content: { type: "object" },
    brief: { type: "string" },
    updatedAt: { type: "number" },
    syncedAt: { type: "number" },
  },
  required: ["id", "title", "days", "language", "content", "updatedAt"],
} as const;

async function getDb(): Promise<StashDatabase> {
  if (typeof window === "undefined") {
    throw new Error("Stash DB is browser-only");
  }
  if (!globalForStash.__dhelStashDb) {
    globalForStash.__dhelStashDb = (async () => {
      const db = await createRxDatabase<StashCollections>({
        name: "dhel_traveler_stash",
        storage: getRxStorageLocalstorage(),
        // Close prior instance if HMR remounted before globalThis reuse
        closeDuplicates: true,
      });
      if (!db.trips) {
        await db.addCollections({
          trips: { schema: tripSchema },
        });
      }
      return db;
    })().catch((err) => {
      globalForStash.__dhelStashDb = null;
      throw err;
    });
  }
  return globalForStash.__dhelStashDb;
}

export async function upsertStashedTrip(trip: Omit<StashedTrip, "updatedAt"> & { updatedAt?: number }) {
  const db = await getDb();
  const doc: TripDoc = {
    ...trip,
    updatedAt: trip.updatedAt ?? Date.now(),
    syncedAt: trip.syncedAt ?? Date.now(),
  };
  const existing = await db.trips.findOne(trip.id).exec();
  if (existing) {
    await existing.patch(doc);
  } else {
    await db.trips.insert(doc);
  }
  return doc;
}

export async function listStashedTrips(): Promise<StashedTrip[]> {
  try {
    const db = await getDb();
    const docs = await db.trips.find().sort({ updatedAt: "desc" }).exec();
    return docs.map((d) => d.toJSON() as StashedTrip);
  } catch {
    return [];
  }
}

export async function getStashedTrip(id: string): Promise<StashedTrip | null> {
  try {
    const db = await getDb();
    const doc = await db.trips.findOne(id).exec();
    return doc ? (doc.toJSON() as StashedTrip) : null;
  } catch {
    return null;
  }
}

/** Pull from Supabase when online — last-write-wins by updatedAt. */
export async function syncTripsFromServer(
  rows: Array<{
    id: string;
    title: string;
    client_name?: string | null;
    content?: Record<string, unknown> | null;
    brief?: string | null;
    language?: string | null;
    updated_at?: string | null;
  }>,
): Promise<number> {
  let count = 0;
  for (const row of rows) {
    if (!row.id || !row.content) continue;
    const updatedAt = row.updated_at ? Date.parse(row.updated_at) : Date.now();
    const local = await getStashedTrip(row.id);
    if (local && (local.updatedAt ?? 0) > updatedAt) continue;
    await upsertStashedTrip({
      id: row.id,
      title: row.title,
      clientName: row.client_name ?? undefined,
      days: Array.isArray(row.content.days) ? (row.content.days as unknown[]).length : 7,
      language: row.language ?? "en",
      content: row.content,
      brief: row.brief ?? undefined,
      updatedAt,
      syncedAt: Date.now(),
    });
    count += 1;
  }
  return count;
}
