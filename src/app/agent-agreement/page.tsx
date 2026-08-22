import { buildLegalPage } from "@/components/platform/LegalPage";

export async function generateMetadata() {
  const { metadata } = await buildLegalPage("agent-agreement");
  return metadata;
}

export default async function AgentAgreementPage() {
  const { page } = await buildLegalPage("agent-agreement");
  return page;
}
