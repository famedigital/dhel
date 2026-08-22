/** Product brand — single source of truth for name + tagline. */
export const BRAND_NAME = "Dhel";
export const BRAND_TAGLINE = "Bhutan travel desk";
export const BRAND_TITLE = `${BRAND_NAME} — ${BRAND_TAGLINE}`;

/**
 * Royal Bhutan palette — midnight navy + ivory stone.
 */
export const BRAND_NAVY = "#0B1F3A";
export const BRAND_NAVY_DEEP = "#071428";
export const BRAND_IVORY = "#EDE6DA";
export const BRAND_STONE = "#C9C0B0";
export const BRAND_INK = "#0B1F3A";
export const BRAND_MIST = "#F7F2E8";
export const BRAND_RELIEF = BRAND_STONE;

/** Official logo assets (stone 3D master → PNG / SVG / icons). */
export const BRAND_LOGO = {
  /** Master 3D official */
  official3d: "/brand/dhel-logo-stone-3d.png",
  /** Canonical PNG (1024) */
  png: "/brand/dhel-logo.png",
  /** Flat vector raster */
  png2d: "/brand/dhel-logo-2d.png",
  /** Vector */
  svg: "/brand/dhel-logo.svg",
  /** App / PWA */
  iconSvg: "/icons/icon.svg",
  icon512: "/icons/icon-512.png",
  icon192: "/icons/icon-192.png",
  apple: "/icons/apple-touch-icon.png",
  favicon32: "/icons/favicon-32.png",
  favicon16: "/icons/favicon-16.png",
} as const;

/** @deprecated */
export const BRAND_GOLD = BRAND_STONE;
export const BRAND_GOLD_SOFT = BRAND_IVORY;
export const BRAND_TEAL = BRAND_NAVY;
