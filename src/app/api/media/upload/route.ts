import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const CLOUD = process.env.CLOUDINARY_CLOUD_NAME ?? process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "dvivq8oji";
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

function signParams(params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(sorted + API_SECRET).digest("hex");
}

/** Image, PDF, Word, etc. — Cloudinary auto resource type. */
export async function POST(request: Request) {
  if (!API_KEY || !API_SECRET) {
    return NextResponse.json(
      { error: "Cloudinary credentials not configured (CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET)" },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await request.formData();
  const file = form.get("file");
  const folder = String(form.get("folder") || "itinerary").replace(/[^\w/-]/g, "");
  const resourceType = String(form.get("resource_type") || "auto").replace(/[^a-z]/g, "") || "auto";

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const timestamp = String(Math.round(Date.now() / 1000));
  const params: Record<string, string> = { folder, timestamp };
  const signature = signParams(params);

  const body = new FormData();
  body.append("file", file);
  body.append("api_key", API_KEY);
  body.append("timestamp", timestamp);
  body.append("signature", signature);
  body.append("folder", folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`, {
    method: "POST",
    body,
  });

  const json = (await res.json()) as {
    secure_url?: string;
    public_id?: string;
    resource_type?: string;
    format?: string;
    original_filename?: string;
    error?: { message?: string };
  };

  if (!res.ok || !json.secure_url) {
    return NextResponse.json(
      { error: json.error?.message ?? "Upload failed" },
      { status: 502 },
    );
  }

  return NextResponse.json({
    url: json.secure_url,
    public_id: json.public_id,
    folder,
    resource_type: json.resource_type ?? resourceType,
    format: json.format,
    filename: json.original_filename ?? file.name,
  });
}
