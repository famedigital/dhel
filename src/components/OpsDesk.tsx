import Link from "next/link";
import { DocsPacksPanel } from "@/components/dhel/DocsPacksPanel";
import { GenerationLogPanel } from "@/components/dhel/GenerationLogPanel";
import { OpsFieldFeedPanel } from "@/components/dhel/OpsFieldFeedPanel";
import { OpsFlightsPanel, OpsTravelersPanel } from "@/components/dhel/OpsTravelersPanel";
import { OpsMoneyPanel } from "@/components/dhel/OpsMoneyPanel";
import { OpsStaffPanel } from "@/components/dhel/OpsStaffPanel";
import { OpsStaysPanel } from "@/components/dhel/OpsStaysPanel";
import type {
  DayContent,
  Driver,
  GenerationMeta,
  Guide,
  Hotel,
  ItineraryStaff,
  ItineraryStay,
  Payment,
  Room,
  TripFlight,
  TripTraveler,
} from "@/lib/types";

type OpsLog = {
  id: string;
  category: string;
  amount_nu: number | null;
  note: string | null;
  photo_urls: string[] | null;
  role: string | null;
  day_number: number | null;
  created_at: string;
};

type Props = {
  itineraryId: string;
  tab: string;
  tripTitle?: string;
  expectedPax?: number;
  days?: DayContent[];
  generationMeta?: GenerationMeta | null;
  stays: ItineraryStay[];
  staff: ItineraryStaff[];
  payments: Payment[];
  hotels: Hotel[];
  rooms: Room[];
  guides: Guide[];
  drivers: Driver[];
  travelers?: TripTraveler[];
  flights?: TripFlight[];
  opsLogs?: OpsLog[];
};

export function OpsDesk({
  itineraryId,
  tab,
  tripTitle,
  expectedPax = 0,
  days = [],
  generationMeta,
  stays,
  staff,
  payments,
  hotels,
  rooms,
  guides,
  drivers,
  travelers = [],
  flights = [],
  opsLogs = [],
}: Props) {
  return (
    <div>
      <div className="ops-tabs" role="tablist" aria-label="Trip sections">
        {(
          [
            ["narrative", "Narrative"],
            ["stays", "Stays"],
            ["staff", "Staff"],
            ["travelers", "Travelers"],
            ["flights", "Flights"],
            ["money", "Payments"],
            ["field", "Field"],
            ["docs", "Docs"],
            ["generation", "Log"],
          ] as const
        ).map(([id, label]) => (
          <Link
            key={id}
            href={`/itineraries/${itineraryId}?tab=${id}`}
            className={`ops-tab${tab === id ? " is-active" : ""}`}
            role="tab"
            aria-selected={tab === id}
          >
            {label}
          </Link>
        ))}
      </div>

      {tab === "stays" ? (
        <OpsStaysPanel
          itineraryId={itineraryId}
          days={days}
          stays={stays}
          hotels={hotels}
          rooms={rooms}
        />
      ) : null}

      {tab === "staff" ? (
        <OpsStaffPanel
          itineraryId={itineraryId}
          staff={staff}
          guides={guides}
          drivers={drivers}
        />
      ) : null}

      {tab === "travelers" ? (
        <OpsTravelersPanel
          itineraryId={itineraryId}
          travelers={travelers}
          expectedPax={expectedPax}
        />
      ) : null}

      {tab === "flights" ? (
        <OpsFlightsPanel itineraryId={itineraryId} flights={flights} />
      ) : null}

      {tab === "money" ? (
        <OpsMoneyPanel
          itineraryId={itineraryId}
          payments={payments}
          guides={guides}
          drivers={drivers}
        />
      ) : null}

      {tab === "field" ? <OpsFieldFeedPanel logs={opsLogs} /> : null}

      {tab === "docs" ? (
        <DocsPacksPanel
          itineraryId={itineraryId}
          tripTitle={tripTitle}
          staysWithRoom={stays.filter((s) => s.room_id).length}
          staffCount={staff.length}
          paymentCount={payments.length}
        />
      ) : null}

      {tab === "generation" ? <GenerationLogPanel meta={generationMeta} /> : null}
    </div>
  );
}
