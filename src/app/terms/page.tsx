import { buildLegalPage } from "@/components/platform/LegalPage";

export async function generateMetadata() {
  const { metadata } = await buildLegalPage("terms");
  return metadata;
}

export default async function TermsPage() {
  const { page } = await buildLegalPage("terms");
  return page;
}
