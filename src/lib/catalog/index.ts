export {
  computePackages,
  buildCompareTable,
  checkFestivals,
  listHotelChoicesForRoute,
  computePackageFromHotelSelections,
} from "./pricing";
export type { CityHotelChoices, HotelChoiceRow } from "./pricing";
export { enrichBriefIntent } from "./brief-enrichment";
export { parseBriefLocal } from "./parse-brief-local";
export { composeFinalBrief } from "./compose-final-brief";
export { loadCatalogHotelsFromDb, resolveCatalogHotels } from "./db-catalog";
export {
  loadCatalogGuidesFromDb,
  loadCatalogActivitiesFromDb,
  loadPlatformConfig,
  loadCatalogHotelImages,
  type CatalogGuide,
  type CatalogActivity,
  type PlatformConfig,
} from "./db-catalog-ext";
export { enrichItineraryContent } from "./enrich-content";
export { findBriefGaps, isBriefReady, findFormGaps, isFormReady, findPreHotelGaps, type GapField } from "./gap-checker";
export { parseStayPlan, formatStayRoute, type StaySegment } from "./stay-plan";
export { ensureStayPlan, defaultStayPlan } from "./default-stay-plan";
export {
  parseTripCostsFromText,
  findCostGaps,
  mergeTripCostsFromBrief,
  formatCostSummary,
  applyCostAnswerToIntent,
  SUGGESTED_TRIP_COSTS,
  type TripCostLines,
} from "./trip-costs";
export {
  getCatalogHotels,
  getFestivals,
  getSdfDailyUsd,
  DEFAULT_MARKUP,
  seed,
} from "./types";
export type {
  BriefIntent,
  PackageOption,
  AgencyMarkupSettings,
  RateTier,
  CatalogHotel,
  FestivalWarning,
} from "./types";
