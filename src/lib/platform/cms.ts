import { createClient } from "@/lib/supabase/server";

export type CmsBlock = {
  id: string;
  slug: string;
  locale: string;
  block_type: string;
  status: "draft" | "live";
  content: Record<string, unknown>;
  version: string | null;
  sort_order: number;
  published_at: string | null;
};

export async function getLiveCmsBlock(
  slug: string,
  blockType: string,
  locale = "en",
): Promise<CmsBlock | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("platform_cms_blocks")
    .select("*")
    .eq("slug", slug)
    .eq("block_type", blockType)
    .eq("locale", locale)
    .eq("status", "live")
    .maybeSingle();

  return (data as CmsBlock | null) ?? null;
}

export async function getLiveLegalContent(
  slug: string,
  locale = "en",
): Promise<{ title: string; body: string; version: string | null } | null> {
  const block = await getLiveCmsBlock(slug, "legal_page", locale);
  if (!block?.content) return null;

  const content = block.content;
  const title = typeof content.title === "string" ? content.title : slug;
  const body =
    typeof content.body_markdown === "string"
      ? content.body_markdown
      : typeof content.body === "string"
        ? content.body
        : null;

  if (!body) return null;

  return {
    title,
    body,
    version: block.version ?? (typeof content.version === "string" ? content.version : null),
  };
}
