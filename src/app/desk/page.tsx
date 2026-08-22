import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/agency";
import { DeskHome } from "@/components/dhel/DeskHome";

export default async function DeskPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/desk/login");
  if (!ctx.agency) redirect("/onboarding");

  return (
    <DeskHome
      agencyName={ctx.agency.name}
      email={ctx.email ?? ""}
      role={ctx.membership?.role ?? "agent"}
    />
  );
}
