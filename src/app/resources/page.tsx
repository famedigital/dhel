import { redirect } from "next/navigation";
import Link from "next/link";

export default function ResourcesIndex() {
  redirect("/resources/hotels");
}

export function ResourcesLinks() {
  return (
    <div className="chips" style={{ marginBottom: "1rem" }}>
      <Link className="chip" href="/resources/hotels">
        Hotels
      </Link>
      <Link className="chip" href="/resources/guides">
        Guides
      </Link>
      <Link className="chip" href="/resources/drivers">
        Drivers
      </Link>
    </div>
  );
}
