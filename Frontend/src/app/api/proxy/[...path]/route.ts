import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy to the Databricks App backend, used only when the
 * frontend is deployed somewhere (e.g. Vercel) that can't reach the backend
 * directly. Databricks Apps require an authenticated Databricks caller —
 * the browser can't call one anonymously — so this route runs on the Vercel
 * server (never the browser) and authenticates as the app's own service
 * principal via OAuth client-credentials, fetching a short-lived access
 * token and attaching it to the forwarded request. The browser never sees
 * any Databricks credential.
 *
 * A static long-lived token (e.g. a PAT/OBO token) deliberately isn't used
 * here — Databricks Apps' front door rejected one with "Credential was not
 * sent or was of an unsupported type for this API." OAuth client-credentials
 * access tokens are the credential type it actually accepts.
 *
 * Local dev doesn't use this at all: NEXT_PUBLIC_API_URL there points
 * straight at http://localhost:8000, which has no such auth wall.
 *
 * Wiring (Vercel project env vars):
 *   NEXT_PUBLIC_API_URL=/api/proxy      (relative — routes through this file)
 *   NEXT_PUBLIC_USE_LIVE_API=true
 *   DATABRICKS_HOST=https://dbc-fa603402-4338.cloud.databricks.com
 *   DATABRICKS_APP_URL=https://sentinel-pipeline-backend-<id>.<region>.databricksapps.com
 *   DATABRICKS_CLIENT_ID=<the app's service-principal application id>
 *   DATABRICKS_CLIENT_SECRET=<OAuth secret generated for that service principal>
 */

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const BACKEND_URL = process.env.DATABRICKS_APP_URL;
const CLIENT_ID = process.env.DATABRICKS_CLIENT_ID;
const CLIENT_SECRET = process.env.DATABRICKS_CLIENT_SECRET;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value;
  }

  const res = await fetch(`${DATABRICKS_HOST}/oidc/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64")}`,
    },
    body: new URLSearchParams({ grant_type: "client_credentials", scope: "all-apis" }),
  });

  if (!res.ok) {
    throw new Error(`Failed to obtain Databricks access token: ${res.status} ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  if (!DATABRICKS_HOST || !BACKEND_URL || !CLIENT_ID || !CLIENT_SECRET) {
    return NextResponse.json(
      { success: false, error: "Backend proxy is not configured (DATABRICKS_HOST / DATABRICKS_APP_URL / DATABRICKS_CLIENT_ID / DATABRICKS_CLIENT_SECRET missing)." },
      { status: 503 },
    );
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    return NextResponse.json({ success: false, error: `Backend auth failed: ${e}` }, { status: 502 });
  }

  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: req.method,
    headers: {
      Authorization: `Bearer ${token}`,
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
