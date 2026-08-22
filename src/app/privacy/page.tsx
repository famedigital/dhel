import { buildLegalPage } from "@/components/platform/LegalPage";

export async function generateMetadata() {
  const { metadata } = await buildLegalPage("privacy");
  return metadata;
}

export default async function PrivacyPage() {
  const { page } = await buildLegalPage("privacy");
  return page;
}
