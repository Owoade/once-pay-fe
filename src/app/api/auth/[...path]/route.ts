import type { NextRequest } from "next/server";

// Forwards browser requests to the backend without CORS friction.
// GET  /api/auth/google   → BE GET  /auth/google
// POST /api/auth/login    → BE POST /auth/login
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

async function proxy(
  request: NextRequest,
  ctx: RouteContext<"/api/auth/[...path]">,
) {
  const { path } = await ctx.params;
  const target = `${BACKEND_URL}/auth/${path.join("/")}${request.nextUrl.search}`;

  const backend_response = await fetch(target, {
    method: request.method,
    headers: { "Content-Type": "application/json" },
    body: request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.text(),
    cache: "no-store",
  });

  return new Response(await backend_response.text(), {
    status: backend_response.status,
    headers: { "Content-Type": "application/json" },
  });
}

export const GET = proxy;
export const POST = proxy;