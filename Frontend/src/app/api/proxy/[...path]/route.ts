import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to the Databricks App backend, used only when the
 * frontend is deployed somewhere (e.g. Vercel) that can't reach the backend
 * directly. Databricks Apps require an authenticated Databricks caller —
 * the browser can't call one anonymously — so this route runs on the Vercel
 * server (never the browser) and attaches a Databricks service-principal
 * token from a server-only env var. The browser never sees that token.
 *
 * Local dev doesn't use this at all: NEXT_PUBLIC_API_URL there points
 * straight at http://localhost:8000, which has no such auth wall.
 *
 * Wiring (Vercel project env vars):
 *   NEXT_PUBLIC_API_URL=/api/proxy      (relative — routes through this file)
 *   NEXT_PUBLIC_USE_LIVE_API=true
 *   DATABRICKS_APP_URL=https://sentinel-pipeline-backend-<id>.<region>.databricksapps.com
 *   DATABRICKS_APP_TOKEN=<token for the app's service principal>   (server-only, no NEXT_PUBLIC_ prefix)
 */

const BACKEND_URL = process.env.DATABRICKS_APP_URL;
const BACKEND_TOKEN = process.env.DATABRICKS_APP_TOKEN;

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  if (!BACKEND_URL || !BACKEND_TOKEN) {
    return NextResponse.json(
      { success: false, error: "Backend proxy is not configured (DATABRICKS_APP_URL / DATABRICKS_APP_TOKEN missing)." },
      { status: 503 },
    );
  }

  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${BACKEND_TOKEN}`,
      "Content-Type": "application/json",
    },
  };
  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch {
    return NextResponse.json({ success: false, error: "Unable to reach the backend." }, { status: 502 });
  }

  const body = await upstream.text();
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
