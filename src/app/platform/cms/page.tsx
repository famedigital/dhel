import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/PlatformShell";
import { CmsBlockEditor } from "@/components/platform/CmsBlockEditor";
import { getSessionContext } from "@/lib/agency";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_TITLE, BRAND_URL } from "@/lib/brand";
import { isPlatformAdmin } from "@/lib/platform/admin";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_BLOCKS = [
  {
    id: "home-hero-draft",
    slug: "home",
    block_type: "hero",
    status: "draft",
    content: {
      kicker: BRAND_TAGLINE,
      headline: "Paste WhatsApp → compare hotels → client PDF",
      subhead: "Tour operator OS for Bhutan FIT trips.",
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
      meta_title: BRAND_TITLE,
      meta_description: "Build Bhutan trip quotes with live hotel, guide, and driver inventory.",
      canonical_url: BRAND_URL,
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
