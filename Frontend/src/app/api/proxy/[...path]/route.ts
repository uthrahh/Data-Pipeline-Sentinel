import { NextRequest, NextResponse } from "next/server";

/**
 * Server-side proxy used by Genie (the only live feature in this app). Databricks
 * Apps require an authenticated Databricks caller — a browser can't call one
 * anonymously — so this route runs on the app's own server (never the browser)
 * and authenticates as a service principal via OAuth client-credentials,
 * attaching a short-lived access token to the forwarded request. The browser
 * never sees any Databricks credential.
 *
 * It is deliberately an allowlist of ONE endpoint: POST /api/chat. The
 * upstream assistant also exposes incident approve/reject/remediate endpoints
 * with real side effects; this static demo must never be able to reach them.
 *
 * Local dev doesn't use this: NEXT_PUBLIC_API_URL there points straight at
 * http://localhost:8000, which has no auth wall.
 *
 * Wiring (Databricks App env — see app.yaml):
 *   NEXT_PUBLIC_API_URL=/api/proxy
 *   DATABRICKS_HOST, DATABRICKS_APP_URL, DATABRICKS_CLIENT_ID, DATABRICKS_CLIENT_SECRET
 */

const DATABRICKS_HOST = process.env.DATABRICKS_HOST;
const BACKEND_URL = process.env.DATABRICKS_APP_URL;
const CLIENT_ID = process.env.DATABRICKS_CLIENT_ID;
const CLIENT_SECRET = process.env.DATABRICKS_CLIENT_SECRET;
// Optional: a personal access / OAuth token, handy for local development instead of a service principal.
const STATIC_TOKEN = process.env.DATABRICKS_TOKEN;

console.log("[proxy] config check:", {
  DATABRICKS_HOST: DATABRICKS_HOST ?? "(missing)",
  BACKEND_URL: BACKEND_URL ?? "(missing)",
  CLIENT_ID: CLIENT_ID ?? "(missing)",
  CLIENT_SECRET_present: Boolean(CLIENT_SECRET),
  CLIENT_SECRET_length: CLIENT_SECRET?.length ?? 0,
});

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (STATIC_TOKEN) return STATIC_TOKEN;
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

const ALLOWED_PATH = "api/chat";

async function forward(req: NextRequest, path: string[]): Promise<NextResponse> {
  if (req.method !== "POST" || path.join("/") !== ALLOWED_PATH) {
    return NextResponse.json({ success: false, error: "Not found." }, { status: 404 });
  }

  if (!BACKEND_URL || (!STATIC_TOKEN && (!DATABRICKS_HOST || !CLIENT_ID || !CLIENT_SECRET))) {
    return NextResponse.json(
      { success: false, error: "Backend proxy is not configured (set DATABRICKS_APP_URL plus either DATABRICKS_TOKEN, or DATABRICKS_HOST / DATABRICKS_CLIENT_ID / DATABRICKS_CLIENT_SECRET)." },
      { status: 503 },
    );
  }

  let token: string;
  try {
    token = await getAccessToken();
  } catch (e) {
    console.error("[proxy] token exchange failed:", e);
    return NextResponse.json({ success: false, error: `Backend auth failed: ${e}` }, { status: 502 });
  }

  const targetUrl = `${BACKEND_URL}/${path.join("/")}${req.nextUrl.search}`;

  const init: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: await req.text(),
  };

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, init);
  } catch (e) {
    console.error("[proxy] upstream fetch failed:", targetUrl, e);
    return NextResponse.json({ success: false, error: "Unable to reach the backend." }, { status: 502 });
  }

  const body = await upstream.text();
  // A stopped Databricks App answers with an HTML "App Not Available" page — report that as an unreachable assistant.
  if (upstream.status >= 500 && (upstream.headers.get("Content-Type") ?? "").includes("text/html")) {
    return NextResponse.json({ success: false, error: "The assistant service is not running." }, { status: 502 });
  }
  return new NextResponse(body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("Content-Type") ?? "application/json" },
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return forward(req, (await params).path);
}
