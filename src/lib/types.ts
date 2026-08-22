export type MembershipRole =
  | "owner"
  | "agent"
  | "platform_admin"
  | "sales"
  | "reservations"
  | "ops"
  | "accounts"
  | "fleet_manager";

export type TemplateId = "classic-luxury" | "compact" | "editorial-deep";

export type ItineraryLanguage = "en" | "zh";

export type ItineraryStatus = "draft" | "ready" | "archived";

export type RoomStatus = "available" | "held" | "blocked" | "maintenance";

export type StaffRole = "guide" | "driver";

export type PaymentDirection = "in" | "out";

export type PaymentPartyType = "client" | "hotel" | "guide" | "driver" | "other";

export type PaymentStatus = "planned" | "paid" | "partial";

export interface Agency {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Membership {
  id: string;
  user_id: string;
  agency_id: string;
  role: MembershipRole;
  created_at: string;
  agencies?: Agency;
}

export interface Brand {
  id: string;
  agency_id: string;
  display_name: string;
  website: string | null;
  whatsapp: string | null;
  email: string | null;
  voice: string | null;
  signatory_names: string | null;
  signatory_title: string | null;
  since_year: number | null;
  theme: Record<string, unknown>;
  logo_path: string | null;
  letter_photo_path: string | null;
  default_template_id: TemplateId;
  created_at: string;
  updated_at: string;
}

export interface TripPreset {
  id: string;
  agency_id: string | null;
  label: string;
  days: number;
  region: string | null;
  brief_template: string | null;
  sort_order: number;
}

export interface Client {
  id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  nationality: string | null;
  passport_notes: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Hotel {
  id: string;
  agency_id: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  agency_id: string;
  hotel_id: string;
  room_number: string;
  room_type: string;
  status: RoomStatus;
  notes: string | null;
  net_rate_usd?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Guide {
  id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  languages: string | null;
  license_no: string | null;
  active: boolean;
  notes: string | null;
  day_rate_usd?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  agency_id: string;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  plate: string | null;
  active: boolean;
  notes: string | null;
  day_rate_usd?: number | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryStay {
  id: string;
  agency_id: string;
  itinerary_id: string;
  day_from: number | null;
  day_to: number | null;
  check_in: string | null;
  check_out: string | null;
  hotel_id: string;
  room_id: string | null;
  rate: number | null;
  currency: string;
  notes: string | null;
  /** Confirmation / voucher file URL (image, PDF, doc, etc.) */
  voucher_url?: string | null;
  created_at: string;
  updated_at: string;
  hotels?: Hotel | null;
  rooms?: Room | null;
}

export interface ItineraryStaff {
  id: string;
  agency_id: string;
  itinerary_id: string;
  role: StaffRole;
  guide_id: string | null;
  driver_id: string | null;
  day_from: number | null;
  day_to: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  guides?: Guide | null;
  drivers?: Driver | null;
}

export interface Payment {
  id: string;
  agency_id: string;
  itinerary_id: string;
  direction: PaymentDirection;
  party_type: PaymentPartyType;
  party_id: string | null;
  party_label: string | null;
  amount: number;
  currency: string;
  method: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type SdfCategory = "other" | "indian" | "saarc";

export interface TripTraveler {
  id: string;
  agency_id: string;
  itinerary_id: string;
  name: string;
  nationality: string | null;
  id_type: string | null;
  id_number: string | null;
  sdf_category: SdfCategory | string;
  sdf_amount: number | null;
  sdf_paid: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TripFlight {
  id: string;
  agency_id: string;
  itinerary_id: string;
  direction: string | null;
  pnr: string | null;
  airline: string | null;
  flight_number: string | null;
  route_from: string | null;
  route_to: string | null;
  depart_at: string | null;
  arrive_at: string | null;
  cost: number | null;
  currency: string;
  paid_by: string | null;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DayContent {
  day: number;
  title: string;
  route: string;
  description: string;
  activities: string[];
  overnight?: string;
  meals?: string;
  image?: string;
  hero_image?: string;
  activity_images?: { url: string; caption: string }[];
  photo_notes?: string;
  journal?: { heading: string; text: string }[];
}

export interface GenerationMeta {
  messages?: Array<{ role: string; content: string }>;
  final_brief?: string;
  clarifications_asked?: string[];
  narrative_prompt?: string;
  reference_file?: string;
  ai_provider?: string;
  ai_model?: string;
  package_option?: Record<string, unknown>;
  compare_table?: unknown[];
  client_reply?: string;
  warnings?: string[];
  generated_at?: string;
}

export interface FlightLeg {
  direction: "inbound" | "outbound" | "other";
  date?: string;
  airline?: string;
  flight_number?: string;
  from?: string;
  to?: string;
  depart?: string;
  arrive?: string;
  notes?: string;
}

export interface PriceBlock {
  currency: string;
  total?: number;
  per_person?: number;
  pax?: number;
  note?: string;
  inclusions?: string[];
  exclusions?: string;
  flight_extra_note?: string;
}

export interface ItineraryContent {
  eyebrow?: string;
  trip_title?: string;
  prepared_for?: string;
  departing_from?: string;
  gateway?: string;
  group?: string;
  travel_dates?: string;
  vehicle?: string;
  guide?: string;
  /** Cover hero photo (Cloudinary / absolute URL) */
  cover_image?: string;
  /** Optional guide portrait for cover / ops packs */
  guide_image?: string;
  /** Optional vehicle photo for cover / ops packs */
  vehicle_image?: string;
  letter?: {
    date?: string;
    greeting?: string;
    paragraphs?: string[];
  };
  pricing?: PriceBlock;
  flights?: {
    summary?: string;
    legs?: FlightLeg[];
    booking_notes?: string[];
  };
  days?: DayContent[];
  closing?: {
    includes_fit?: string[];
    notes?: string[];
    dos?: string[];
    donts?: string[];
    docs?: string[];
    packing?: string[];
    validity?: string;
    per_head?: { label: string; amount: string; note?: string }[];
  };
  /** Saved at proposal time — Value / Recommended / Premium hotel options */
  hotel_options?: HotelOptionRow[];
  selected_option_id?: string;
  /** From agency settings — shown on cover when no Ops driver assigned */
  vehicle_type?: string;
  /** Car categories from agency settings (for PDF) */
  vehicle_options?: string[];
  generation_meta?: GenerationMeta;
}

export interface HotelOptionRow {
  id: string;
  label: string;
  hotel: string;
  city: string;
  room: string;
  nights: number;
  total_pp: number;
  currency: string;
  recommended: boolean;
  image_urls?: string[];
}

export interface Itinerary {
  id: string;
  agency_id: string;
  title: string;
  client_name: string | null;
  client_id?: string | null;
  status: ItineraryStatus;
  template_id: TemplateId;
  language: ItineraryLanguage;
  brief: string | null;
  content: ItineraryContent;
  brand_snapshot: Partial<Brand> | null;
  generation_meta?: GenerationMeta | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Ops payload for guest/ops PDF */
export type ItineraryOpsBundle = {
  stays: ItineraryStay[];
  staff: ItineraryStaff[];
  payments: Payment[];
  hotels: Hotel[];
  rooms: Room[];
  guides: Guide[];
  drivers: Driver[];
  travelers?: TripTraveler[];
  flights?: TripFlight[];
};
