import type { ItineraryContent, ItineraryLanguage } from "@/lib/types";

export interface ParsedHtmlDay {
  day: number;
  title: string;
  route: string;
  description: string;
  activities: string[];
  overnight?: string;
  meals?: string;
  dateLabel?: string;
  hero_image?: string;
  activity_images?: { url: string; caption: string }[];
  photo_notes?: string;
}

export interface ParsedHtmlHotelBlock {
  city?: string;
  name: string;
  nights?: string;
  meta?: string;
  image_urls: string[];
}

export interface ParsedHtmlCompareRow {
  label: string;
  values: string[];
}

export interface ParsedHtmlItinerary {
  id: string;
  sourceFile: string;
  language: ItineraryLanguage;
  title: string;
  days: number;
  routeText: string;
  entryPoints: string[];
  cities: string[];
  content: ItineraryContent;
  /** Raw excerpt for AI prompt (letter + 2 day samples) */
  promptExcerpt: string;
  hotel_blocks?: ParsedHtmlHotelBlock[];
  compare_rows?: ParsedHtmlCompareRow[];
  compare_headers?: string[];
}
