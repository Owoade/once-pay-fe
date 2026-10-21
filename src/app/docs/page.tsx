// Public API reference for the merchant-api surface, with no auth required to read.
import type { Metadata } from "next";
import Link from "next/link";
import CodeBlock from "@/components/code-block";
import Logo from "@/components/logo";
import { BACKEND_URL } from "@/lib/api";
import DocsToc, { DocsMobileNav } from "./docs-toc";

export const metadata: Metadata = {
  title: "API docs",
  description:
    "The Once-Pay merchant API reference, covering how to initiate, verify and reconcile transactions across Paystack, Flutterwave, Korapay, SeerBit and Monnify with a single API key.",
};

function MethodBadge({ method }: { method: "GET" | "POST" }) {
  return (
    <span
      className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${
        method === "GET"
          ? "bg-brand-primary/10 text-brand-primary"
          : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
      }`}
    >
      {method}
    </span>
  );
}

function Endpoint({ method, path }: { method: "GET" | "POST"; path: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <MethodBadge method={method} />
      <code className="font-mono text-sm text-zinc-800 dark:text-zinc-200">
        {path}
      </code>
    </div>
  );
}

function ParamTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <th className="px-3 py-2 font-medium">Param</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([name, type, description]) => (
            <tr
              key={name}
              className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/70"
            >
              <td className="px-3 py-2 font-mono text-zinc-800 dark:text-zinc-200">{name}</td>
              <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400">{type}</td>
              <td className="px-3 py-2 text-zinc-600 dark:text-zinc-400">{description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  const base = BACKEND_URL;
  const key = "[API KEY]";

  return (
    <div>
      {/* `relative` anchors the mobile hamburger's dropdown panel to the header. */}
      <header className="sticky top-0 z-20 relative border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <DocsMobileNav />
            <Link href="/" className="inline-flex">
              <Logo image_class="h-7 w-7" wordmark_class="text-2xl" />
            </Link>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-primary hover:underline"
          >
            Sign in
          </Link>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl gap-10 px-4 py-10 md:px-6">
        <div className="min-w-0 max-w-3xl flex-1">
        <h1 className="op-heading-bold text-3xl">API Documentation</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Accept payments through Once-Pay with one integration. Base URL:{" "}
          <a
            href={base}
            className="text-brand-primary hover:underline"
          >
            {base}
          </a>
        </p>

        <section id="authentication" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">1. Authentication</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Send your API key (from your Developer tab) as a bearer token on
            every request. Keys are scoped per merchant, so you only ever see your
            own data.
          </p>
          <div className="mt-3">
            <CodeBlock
              label="header"
              code={`Authorization: Bearer ${key}`}
            />
          </div>
        </section>

        <section id="initiate" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">2. Initiate a transaction</h2>
          <div className="mt-2">
            <Endpoint method="POST" path="/transaction/initiate" />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Creates a payment with your chosen gateway and returns a hosted
            payment link. Redirect your customer to it; the response comes back
            to your <code className="text-xs">callback_url</code> once resolved.
          </p>
          <div className="mt-3">
            <ParamTable
              rows={[
                ["amount", "number", "Amount to charge, in Naira (NGN)."],
                ["email", "string", "The customer's email address."],
                ["payment_gateway", "string", "One of: paystack, flutterwave, korapay, monnify, seerbit."],
                ["callback_url", "string · optional", "Where your customer is redirected after payment; receives a verification call within 60s."],
                ["metadata", "object · optional", "Your freeform data, echoed back on webhooks and transaction reads."],
              ]}
            />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock              label="request"
            language="shell"
              code={`curl -X POST ${base}/transaction/initiate \\
  -H "Authorization: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": 15000,
    "email": "customer@example.com",
    "payment_gateway": "paystack",
    "callback_url": "https://your-server.com/payment-result",
    "metadata": { "order_id": "ORD-77" }
  }'`}
            />
            <CodeBlock              label="response · 200"
            language="json"
              code={`{
  "status": "success",
  "message": "Operation successful",
  "data": {
    "payment_link": "https://checkout.paystack.com/…",
    "transaction_reference": "trx_1761234567890_42"
  }
}`}
            />
          </div>
        </section>

        <section id="list" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">3. List your transactions</h2>
          <div className="mt-2">
            <Endpoint method="GET" path="/transactions" />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Newest first. Only sanitized fields are returned, with no gateway
            internals.
          </p>
          <div className="mt-3">
            <ParamTable
              rows={[
                ["limit", "number · optional", "1–50. Default 20."],
                ["offset", "number · optional", "Default 0. Add it to your limit to page."],
                ["status", "string · optional", "successful, pending, or failed."],
              ]}
            />
          </div>
          <div className="mt-3">
            <CodeBlock              label="response · 200"
            language="json"
              code={`{
  "status": "success",
  "data": {
    "total": 1,
    "transactions": [
      {
        "id": 12,
        "reference": "trx_1761234567890_42",
        "amount": 15000,
        "payment_gateway": "paystack",
        "status": "successful",
        "customer_email": "customer@example.com",
        "createdAt": "2026-10-19 12:05:33"
      }
    ]
  }
}`}
            />
          </div>
        </section>

        <section id="verify" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">4. Verify a transaction</h2>
          <div className="mt-2">
            <Endpoint method="GET" path="/transaction/verify/:trx_reference" />
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Re-checks the transaction with its gateway and returns the current
            state, including the customer&apos;s email.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock              label="request"
            language="shell"
              code={`curl ${base}/transaction/verify/trx_1761234567890_42 \\
  -H "Authorization: Bearer ${key}"`}
            />
            <CodeBlock              label="response · 200"
            language="json"
              code={`{
  "status": "success",
  "data": {
    "reference": "trx_1761234567890_42",
    "amount": 15000,
    "payment_gateway": "paystack",
    "status": "successful",
    "customer_email": "customer@example.com",
    "resolved_in_secs": 27,
    "metadata": { "order_id": "ORD-77" },
    "createdAt": "2026-10-19 12:05:33",
    "updatedAt": "2026-10-19 12:06:00"
  }
}`}
            />
            <CodeBlock              label="response · 404"
            language="json"
              code={`{
  "status": "error",
  "message": "Transaction not found",
  "data": null
}`}
            />
          </div>
        </section>

        <section id="webhooks" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">5. Webhooks</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Set your webhook URL in the dashboard&apos;s Developer tab. When a
            transaction succeeds, Once-Pay POSTs:
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock
              label="webhook request"
              language="shell"
              code={`POST https://your-server.com/webhooks/once-pay
Content-Type: application/json
X-Signature: 6f9a1c…  (HMAC-SHA256 of the raw body below, keyed with your API key)

{
  "event": "transaction.success",
  "data": {
    "id": 12,
    "reference": "trx_1761234567890_42",
    "amount": 15000,
    "payment_gateway": "paystack",
    "status": "successful",
    "initiated_at_ms": 1761234567890,
    "resolved_in_secs": 27,
    "payment_made_at_ms": 1761234582000,
    "callback_url": "https://your-server.com/payment-result",
    "metadata": { "order_id": "ORD-77" },
    "createdAt": "2026-10-19 12:05:33",
    "updatedAt": "2026-10-19 12:06:00"
  }
}`}
            />
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Verify it before trusting the payload: the{" "}
              <code className="text-xs">X-Signature</code> header is an
              HMAC-SHA256 of the raw request body, keyed with your API key.
            </p>
            <CodeBlock              label="signature verification (node)"
            language="nodejs"
              code={`import crypto from "crypto";

const signature = req.headers["x-signature"]; // case-insensitive
const expected = crypto
  .createHmac("sha256", process.env.ONCE_PAY_API_KEY)
  .update(rawRequestBody) // the exact bytes received, not re-stringified
  .digest("hex");

const valid =
  expected.length === signature.length &&
  crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));`}
            />
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Failed deliveries are retried on our reconciliation schedule,
              roughly every 30 seconds up to 5 times, then every 5 minutes up to
              10, then hourly for the next 24 hours.
            </p>
          </div>
        </section>

        <section id="response-format" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">6. Response format</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Every endpoint answers with the same envelope, so check{" "}
            <code className="text-xs">status</code> first, then read{" "}
            <code className="text-xs">data</code> or{" "}
            <code className="text-xs">message</code>.
          </p>
          <div className="mt-3">
            <ParamTable
              rows={[
                ["status", '"success" | "error"', '"error" means the request was rejected; "success" means data is populated.'],
                ["message", "string", "Human-readable summary, showing the error reason when status is error."],
                ["data", "object | null", "The response payload; null whenever status is error."],
              ]}
            />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock
              label="success"
              language="json"
              code={`{
  "status": "success",
  "message": "Initiate transaction successful",
  "data": {
    "payment_link": "https://checkout.paystack.com/…",
    "transaction_reference": "trx_1761234567890_42"
  }
}`}
            />
            <CodeBlock
              label="error"
              language="json"
              code={`{
  "status": "error",
  "message": "Transaction not found",
  "data": null
}`}
            />
          </div>
        </section>

        <section id="js-sdk" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">7. JS Client SDK</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Prefer not to hand-roll HTTP calls? The Once-Pay JS SDK wraps
            initiation and gives you a live settlement listener, with no polling,
            no webhooks to verify on the client.
          </p>
          <div className="mt-3">
            <CodeBlock
              label="install"
              language="shell"
              code={`npm install once-pay-sdk socket.io-client   # socket.io-client powers the live listener`}
            />
          </div>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock
              label="checkout.js"
              language="nodejs"
              code={`import OncePay, { OncePayError } from "once-pay-sdk";

const client = new OncePay({
  base_url: "${base}",
  api_key: "${key}",
});

const response = await client.initiate_transaction({
  amount: 15000,
  email: "customer@example.com",
  payment_gateway: "paystack",                    // one of the five gateways
  callback_url: "https://your-server.com/complete", // optional
  metadata: { order_id: "ORD-77" },                 // optional
  on_success: ({ reference }) => {
    // fires at most once, when this transaction settles,
    // no polling, no reload. Subscribe later to any reference
  },
});

// open the hosted payment page (new tab)
window.open(response.data.payment_link);
// response.data.transaction_reference is also returned`}
            />
            <CodeBlock
              label="errors"
              language="nodejs"
              code={`// Everything failing throws OncePayError, so check code before message.
try {
  await client.initiate_transaction(payload);
} catch (error) {
  if (error instanceof OncePayError) {
    error.code;     // e.g. 401 (bad key), 400 (bad payload), 408 (window expired)
    error.message;  // e.g. "Transaction not found"
  }
}`}
            />
          </div>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Plain script tag (no bundler)? Load{" "}
            <code className="text-xs">vanila-js/index.js</code> instead, which
            pulls its Socket.IO client from a CDN automatically. Bundled apps
            must install <code className="text-xs">socket.io-client</code>{" "}
            themselves; the dynamic import is resolved at build time.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <CodeBlock
              label="index.html"
              language="nodejs"
              code={`<script src="https://oncepay-storage.owoade.dev/lib/index.min.js"></script>
<script>
  const client = new OncePay({
    base_url: "${base}",
    api_key: "${key}",
  });

  document.getElementById("pay-button").addEventListener("click", () => {
    client
      .initiate_transaction({
        amount: 15000,
        email: "customer@example.com",
        payment_gateway: "paystack",
        on_success: ({ reference }) => {
          // fires exactly once when the transaction settles
          window.location.href = "/order-complete?ref=" + reference;
        },
      })
      .then((response) => {
        // open the hosted payment page (new tab)
        window.open(response.data.payment_link);
      })
      .catch((error) => {
        console.error(error.code, error.message);
      });
  });
</script>`}
            />
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              The SDK is served as a plain script from our CDN, where{" "}
              <code className="text-xs">OncePay</code> and{" "}
              <code className="text-xs">OncePayError</code> become globals, no
              npm step, no bundler.
            </p>
          </div>
        </section>

        <section id="errors" className="mt-10 scroll-mt-24">
          <h2 className="op-heading-bold text-xl">Errors</h2>
          <div className="mt-3">
            <ParamTable
              rows={[
                ["400", "HTTP", "Invalid payload (the message names the field)."],
                ["401", "HTTP", "Missing or invalid API key."],
                ["404", "HTTP", "Transaction or resource not found."],
                ["408", "HTTP", "Callback/verification window expired (60s)."],
              ]}
            />
          </div>
        </section>

        <footer className="mt-14 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Need an API key?{" "}
            <Link href="/login" className="font-medium text-brand-primary hover:underline">
              Sign in
            </Link>{" "}
            and open your Developer tab.
          </p>
        </footer>
        </div>

        <DocsToc />
      </main>
    </div>
  );
}