import type { NextRequest } from "next/server";

// Forwards dashboard requests to the backend, carrying the merchant's JWT.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

async function proxy(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const target = `${BACKEND_URL}/merchant/${path.join("/")}${request.nextUrl.search}`;

  const authorization = request.headers.get("authorization");

  const backend_response = await fetch(target, {
    method: request.method,
    headers: {
      "Content-Type": "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    },
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