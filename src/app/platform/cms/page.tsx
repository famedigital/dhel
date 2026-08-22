import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { CmsBlockEditor } from "@/components/platform/CmsBlockEditor";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_BLOCKS = [
  {
    id: "home-hero-draft",
    slug: "home",
    block_type: "hero",
    status: "draft",
    content: {
      kicker: "Bhutan travel desk",
      headline: "Paste WhatsApp → compare hotels → client PDF",
      subhead: "Agent vertical SaaS for private tours.",
      primary_cta: { label: "Agent sign in", href: "/desk/login" },
      secondary_cta: { label: "Plan my trip", href: "/build" },
    },
  },
  {
    id: "home-seo-draft",
    slug: "home",
    block_type: "seo",
    status: "draft",
    content: {
      meta_title: "Dhel — Bhutan travel desk",
      meta_description: "Build Bhutan trip quotes with real hotel rates.",
      canonical_url: "https://dhel.app",
    },
  },
  {
    id: "terms-legal-draft",
    slug: "terms",
    block_type: "legal_page",
    status: "draft",
    content: {
      title: "Terms of Service",
      body_markdown: "Edit in CMS or publish from draft.",
      version: "2026-08-22",
    },
  },
];

export default async function PlatformCmsPage() {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (!isPlatformAdmin(ctx)) redirect("/desk");

  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_cms_blocks")
    .select("id, slug, block_type, status, content")
    .order("slug")
    .order("sort_order");

  const blocks =
    data && data.length > 0
      ? data.map((row) => ({
          id: row.id as string,
          slug: row.slug as string,
          block_type: row.block_type as string,
          status: row.status as string,
          content: (row.content as Record<string, unknown>) ?? {},
        }))
      : DEFAULT_BLOCKS;

  return (
    <PlatformShell email={ctx.email}>
      <h1 className="page-title">Public CMS</h1>
      <p className="page-lead">
        Edit marketing and legal blocks as JSON. Publish copies draft → live and revalidates public
        routes.
      </p>
      <CmsBlockEditor initialBlocks={blocks} />
    </PlatformShell>
  );
}
