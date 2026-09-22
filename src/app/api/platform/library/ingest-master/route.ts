import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import { getSessionContext } from "@/lib/agency";
import { isPlatformAdmin } from "@/lib/platform/admin";

/** Platform admin: regenerate MASTER → generated JSON (+ optional --db). */
export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx || !isPlatformAdmin(ctx)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as { db?: boolean };
  const script = path.join(process.cwd(), "scripts", "ingest-master-catalog.mjs");
  const args = body.db ? [script, "--db"] : [script];

  const result = await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });

  if (result.code !== 0) {
    return NextResponse.json(
      { error: "Ingest failed", stdout: result.stdout, stderr: result.stderr },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    stdout: result.stdout,
    message: "MASTER catalog ingested into generated JSON" + (body.db ? " and Supabase" : ""),
  });
}
