import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dvivq8oji";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export type LibraryAsset = {
  public_id: string;
  url: string;
  width?: number;
  height?: number;
  format?: string;
  folder?: string;
  created_at?: string;
};

/**
 * Browse Cloudinary image library (server-side Admin API).
 * Auth optional for read-only catalog folders used on B2C / desk media pickers.
 */
export async function GET(request: Request) {
  if (!API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: "Cloudinary credentials not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const folder = (searchParams.get("folder") || "").replace(/[^\w/-]/g, "");
  const nextCursor = searchParams.get("next_cursor") || "";
  const maxResults = Math.min(80, Math.max(12, Number(searchParams.get("max") || 48) || 48));
  const q = (searchParams.get("q") || "").trim().slice(0, 80);

  // Prefer signed-in agents; still allow public build to browse catalog folders.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const publicFolders = ["activities", "hotels", "covers", "days", "itineraries", "brand"];
  if (!user && folder && !publicFolders.some((f) => folder === f || folder.startsWith(`${f}/`))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auth = Buffer.from(`${API_KEY}:${API_SECRET}`).toString("base64");
  const params = new URLSearchParams({
    max_results: String(maxResults),
    resource_type: "image",
    type: "upload",
  });
  if (nextCursor) params.set("next_cursor", nextCursor);
  if (folder) params.set("prefix", folder.endsWith("/") ? folder : `${folder}/`);

  // Expression search when querying by name
  const endpoint = q
    ? `https://api.cloudinary.com/v1_1/${CLOUD}/resources/search`
    : `https://api.cloudinary.com/v1_1/${CLOUD}/resources/image/upload`;

  let res: Response;
  if (q) {
    const expression = folder
      ? `folder:${folder}* AND (public_id:${q}* OR filename:${q}*)`
      : `resource_type:image AND (public_id:${q}* OR filename:${q}*)`;
    res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        expression,
        max_results: maxResults,
        next_cursor: nextCursor || undefined,
      }),
    });
  } else {
    res = await fetch(`${endpoint}?${params}`, {
      headers: { Authorization: `Basic ${auth}` },
    });
  }

  const json = (await res.json()) as {
    resources?: Array<{
      public_id: string;
      secure_url?: string;
      url?: string;
      width?: number;
      height?: number;
      format?: string;
      folder?: string;
      created_at?: string;
    }>;
    next_cursor?: string;
    error?: { message?: string };
  };

  if (!res.ok) {
    return NextResponse.json(
      { error: json.error?.message ?? "Could not list Cloudinary media" },
      { status: 502 },
    );
  }

  const assets: LibraryAsset[] = (json.resources ?? [])
    .map((r) => ({
      public_id: r.public_id,
      url: r.secure_url || r.url || "",
      width: r.width,
      height: r.height,
      format: r.format,
      folder: r.folder,
      created_at: r.created_at,
    }))
    .filter((a) => Boolean(a.url));

  return NextResponse.json({
    assets,
    next_cursor: json.next_cursor ?? null,
    folder: folder || null,
  });
}
