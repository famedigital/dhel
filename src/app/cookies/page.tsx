import { buildLegalPage } from "@/components/platform/LegalPage";

export async function generateMetadata() {
  const { metadata } = await buildLegalPage("cookies");
  return metadata;
}

export default async function CookiesPage() {
  const { page } = await buildLegalPage("cookies");
  return page;
}
