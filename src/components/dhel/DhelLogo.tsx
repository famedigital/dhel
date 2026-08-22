import Image from "next/image";
import { cn } from "@/lib/utils";
import { BRAND_LOGO, BRAND_NAME, BRAND_NAVY } from "@/lib/brand";

/**
 * Official mark — uses the stone 3D master (navy tile · ivory D · carved scene).
 * Prefer this for UI chrome, auth, hero, footer.
 */
export function DhelAppMark({
  className,
  title = BRAND_NAME,
  priority = false,
}: {
  className?: string;
  title?: string;
  priority?: boolean;
}) {
  return (
    <span
      className={cn("relative inline-block h-6 w-6 shrink-0 overflow-hidden rounded-[22%]", className)}
      role="img"
      aria-label={title}
    >
      <Image
        src={BRAND_LOGO.official3d}
        alt={title}
        fill
        sizes="(max-width: 768px) 112px, 144px"
        priority={priority}
        className="object-cover"
      />
    </span>
  );
}

/** Inline SVG vector (same composition) — favicon-quality flat mark. */
export function DhelMark({
  className,
  title = BRAND_NAME,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
      suppressHydrationWarning
    >
      {title ? <title>{title}</title> : null}
      <rect width="32" height="32" rx="7" fill={BRAND_NAVY} />
      <path
        fill="#EDE6DA"
        fillRule="evenodd"
        d="M7.2 4.8h4.9c8 0 13.4 4.5 13.4 11.2S20.1 27.2 12.1 27.2H7.2V4.8Zm3.8 3.1v15.9h1c5.7 0 9.5-3.25 9.5-8s-3.8-7.9-9.5-7.9h-1Z"
      />
      <g fill="#C9C0B0">
        <path d="M11.6 16.8 13.4 12.6l1.1 2.2 1.25-3.9 1.3 3.1 1.15-2.1 1.2 2.7 1.05-1.6 1.15 3.8H11.6Z" />
        <path d="M11.1 24.2 11.7 18.2l1.55-.9 1.7 1.4.7 5.5H11.1Z" />
        <path d="M12.35 19.7h2.9v3.3h-2.9Zm.55-1.7h1.85v1.85H12.9Zm2.45 2.55h1.45v1.8h-1.45Z" />
        <path d="M12.5 17.55h2.5l-.25.6H12.75Zm.45-.7h1.6l-.2.55h-1.2Zm.35-.55h.9l-.15.4h-.6Z" />
        <path d="M18.5 25.1h6.6v.7H18.5Zm.55-.85h5.5v.75H19.05Zm.55-.7h4.4v.65H19.6Z" />
        <path d="M20.1 21.6c0-.35.55-.7 1.2-.7s1.2.35 1.2.7v2.5h-2.4Z" />
        <path d="M20.25 20.45h2.1c.5 0 .85.4.85.8v.4h-3.8v-.4c0-.4.35-.8.85-.8Z" />
        <ellipse cx="21.65" cy="19.35" rx="0.95" ry="1.05" />
        <ellipse cx="21.65" cy="18.4" rx="0.4" ry="0.3" />
      </g>
    </svg>
  );
}

export function DhelWordmark({
  className,
  markClassName,
  showMark = true,
  tile = true,
}: {
  className?: string;
  markClassName?: string;
  showMark?: boolean;
  /** When true (default), use official 3D PNG tile */
  tile?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showMark ? (
        tile ? (
          <DhelAppMark className={cn("h-6 w-6", markClassName)} />
        ) : (
          <DhelMark className={cn("h-5 w-5", markClassName)} />
        )
      ) : null}
      <span className="font-[family-name:var(--font-ui)] text-[0.95em] font-semibold tracking-[0.02em]">
        {BRAND_NAME}
      </span>
    </span>
  );
}
