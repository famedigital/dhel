import Link from "next/link";

const LINKS = [
  { href: "/resources/hotels", label: "Hotels" },
  { href: "/resources/guides", label: "Guides" },
  { href: "/resources/activities", label: "Activities" },
  { href: "/resources/drivers", label: "Drivers" },
] as const;

export function ResourceNav({ active }: { active?: (typeof LINKS)[number]["href"] }) {
  return (
    <div className="chips" style={{ marginBottom: "1rem" }}>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          className="chip"
          href={l.href}
          data-active={active === l.href ? "true" : undefined}
        >
          {l.label}
        </Link>
      ))}
    </div>
  );
}
