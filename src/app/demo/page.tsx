"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import OncePay, { OncePayError } from "once-pay-sdk";
import type { PaymentGateway } from "once-pay-sdk";
import GatewayLogo, { gateway_display_name } from "@/components/gateway-logo";
import Logo from "@/components/logo";
import { BACKEND_URL, type BackendResponse } from "@/lib/api";

// A mock storefront that exercises the real npm SDK end to end:
// initiate → hosted payment page → Socket.IO settlement broadcast → receipt.
// It is a customer-side checkout, so it talks to the backend directly with a
// merchant API key (get one from the dashboard's Developer tab) — it does not
// use the FE's merchant JWT proxy.

type DemoProduct = {
  id: string;
  name: string;
  blurb: string;
  price: number;
};

const PRODUCTS: DemoProduct[] = [
  { id: "hoodie", name: "Once-Pay hoodie", blurb: "Bolt logo, navy — M to XXL", price: 12500 },
  { id: "tee", name: "Sandbox tee", blurb: "“Pay once, done.” white tee", price: 6000 },
  { id: "mug", name: "Gateway mug", blurb: "350 ml, dishwasher safe", price: 3500 },
];

const GATEWAYS: PaymentGateway[] = ["paystack", "flutterwave", "korapay", "monnify", "seerbit"];

// The demo store's sandbox merchant key — hardcoded for this public demo page
// only. Never do this for a real merchant account.
const MERCHANT_API_KEY = "pk_87c0bd1c_5bd4d807ad15fde03eb0a85578565556b758f7dcb098f21528b23a05008e60cd";

// Survives the trip to the hosted payment page: the shopper may come back via
// a full page load, so an in-flight order is kept (and re-watched) by reference.
const ORDER_STORAGE_KEY = "op_demo_order";

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

// Nothing identifying: only an in-flight order reference lives here, and the
// tab closing clears it.
function read_storage(name: string): string | null {
  try {
    return sessionStorage.getItem(name);
  } catch {
    return null;
  }
}

function write_storage(name: string, value: string) {
  try {
    sessionStorage.setItem(name, value);
  } catch {
    // Storage unavailable (private window etc.) — the demo still works,
    // it just loses the order across a reload.
  }
}

function clear_storage(name: string) {
  try {
    sessionStorage.removeItem(name);
  } catch {}
}

// The cart's resting state: one of each item. Removing down to zero drops a
// line entirely; a checkout reset returns here.
function default_cart(): Record<string, number> {
  return Object.fromEntries(PRODUCTS.map((product) => [product.id, 1]));
}

type PendingOrder = {
  reference: string;
  payment_link: string;
};

export default function DemoPage() {
  const [cart, set_cart] = useState<Record<string, number>>(default_cart());
  const [email, set_email] = useState("");
  const [customer_name, set_customer_name] = useState("");
  const [delivery_address, set_delivery_address] = useState("");
  const [gateway, set_gateway] = useState<PaymentGateway>("paystack");

  const [order, set_order] = useState<PendingOrder | null>(null); // set → awaiting payment
  const [paid_reference, set_paid_reference] = useState<string | null>(null);
  const [initiating, set_initiating] = useState(false);

  const cart_total = cart_size(cart) > 0
    ? Object.entries(cart).reduce(
        (total, [id, quantity]) => total + quantity * (PRODUCTS.find((p) => p.id === id)?.price ?? 0),
        0,
      )
    : 0;

  async function pay() {
    if (cart_total <= 0) return;

    if (!email.trim()) {
      toast.error("Add the customer's email");
      return;
    }

    set_initiating(true);
    try {
      const response = await new OncePay({ base_url: BACKEND_URL, api_key: MERCHANT_API_KEY }).initiate_transaction({
        amount: cart_total,
        email: email.trim(),
        payment_gateway: gateway,
        callback_url: window.location.origin + "/demo",
        metadata: {
          items: Object.entries(cart).map(([id, quantity]) => ({
            product: PRODUCTS.find((p) => p.id === id)?.name,
            quantity,
          })),
          customer_name: customer_name.trim() || undefined,
          delivery_address: delivery_address.trim() || undefined,
          source: "once-pay-fe-demo",
        },
        // Fires while the shopper is away at the hosted payment page — the
        // backend broadcasts the settlement on the /transactions namespace.
        on_success: ({ reference }) => {
          set_paid_reference(reference);
          set_order(null);
          clear_storage(ORDER_STORAGE_KEY);
          toast.success("Payment received — order confirmed");
        },
      });

      const pending: PendingOrder = {
        reference: response.data!.transaction_reference,
        payment_link: response.data!.payment_link,
      };
      set_order(pending);
      write_storage(ORDER_STORAGE_KEY, JSON.stringify(pending));

      // The submitted form is done — reset it so the next checkout starts
      // clean: quantities back at the one-each baseline, contact fields empty.
      set_cart(default_cart());
      set_email("");
      set_customer_name("");
      set_delivery_address("");

      // The hosted page opens in a new tab so this tab keeps the Socket.IO
      // watch alive and shows the confirmation the moment payment settles.
      window.open(pending.payment_link, "_blank");
    } catch (error) {
      const detail = error instanceof OncePayError
        ? `${error.message}${error.code ? ` (code ${error.code})` : ""}`
        : error instanceof Error
          ? error.message
          : "Could not start the payment";
      toast.error(detail);
    } finally {
      set_initiating(false);
    }
  }

  // Reload-resume: an in-flight order re-watches by reference. Settlement may
  // already have been broadcast (the socket never replays it), so also check
  // the stored transaction once. The restore body runs one microtask out of
  // the effect so the initial state it sets doesn't cascade synchronously.
  useEffect(() => {
    async function restore() {
      await Promise.resolve();

      const stored_order = read_storage(ORDER_STORAGE_KEY);
      if (!stored_order) return;
      const pending = JSON.parse(stored_order) as PendingOrder;
      set_order(pending);

      const client = new OncePay({ base_url: BACKEND_URL, api_key: MERCHANT_API_KEY });
      client
        .watch_transaction(pending.reference, ({ reference }) => {
          set_paid_reference(reference);
          set_order(null);
          clear_storage(ORDER_STORAGE_KEY);
          toast.success("Payment received — order confirmed");
        })
        .catch(() => {
          toast.error("Live confirmation unavailable — check your connection and refresh");
        });

      try {
        const response = await fetch(
          `${BACKEND_URL}/transaction/verify/${encodeURIComponent(pending.reference)}`,
          { headers: { Authorization: `Bearer ${MERCHANT_API_KEY}` } },
        );
        const body: BackendResponse<{ status: string }> = await response.json();
        if (body.status === "success" && body.data?.status === "successful") {
          set_paid_reference(pending.reference);
          set_order(null);
          clear_storage(ORDER_STORAGE_KEY);
        }
      } catch {
        // Keep watching the socket instead.
      }
    }

    restore();
  }, []);

  if (paid_reference) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-16 font-sans">
        <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <p className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            ✓
          </p>
          <h1 className="op-heading-bold mt-4 text-xl">Order confirmed</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Payment received, thanks! The reference below is the receipt:
          </p>
          <p className="mt-3 break-all rounded-lg bg-zinc-100 p-2 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {paid_reference}
          </p>
          <button
            type="button"
            onClick={() => {
              set_paid_reference(null);
              set_cart(default_cart());
            }}
            className="mt-6 h-11 w-full rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Back to the shop
          </button>
        </main>
      </div>
    );
  }

  if (order) {
    return (
      <div className="flex flex-1 flex-col items-center px-4 py-16 font-sans">
        <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col items-center text-center">
            {/* Pulse = the /transactions socket watch is live on this tab. */}
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
            </span>
            <h1 className="op-heading-bold mt-4 text-xl">Complete your payment</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              The payment page opened in a new tab. When the gateway settles,
              this tab confirms itself.
            </p>
          </div>
          <p className="mt-5 break-all rounded-lg bg-zinc-100 p-2 font-mono text-xs text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {order.reference}
          </p>
          <a
            href={order.payment_link}
            target="_blank"
            className="mt-4 block h-11 rounded-lg border border-zinc-300 text-center text-sm font-semibold leading-[2.75rem] text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Open payment page ↗
          </a>
          <button
            type="button"
            onClick={() => {
              set_order(null);
              clear_storage(ORDER_STORAGE_KEY);
            }}
            className="mt-2 block w-full text-center text-xs font-medium text-zinc-500 hover:underline"
          >
            Back to the shop
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex">
            <Logo image_class="h-8 w-8" wordmark_class="text-xl" />
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-8 sm:px-6">
        <h1 className="op-heading-bold text-2xl">Once-Pay store</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          A throwaway shop that checks out with real Once-Pay transactions.
          Nothing is billed in sandbox mode.
        </p>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950" aria-busy={initiating}>
          <h2 className="op-heading-bold text-lg">Checkout</h2>

          {/* The store is the checkout: a fixed catalog of items, edited
              right in the form, with the total following as you adjust. */}
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800/70" aria-label="Items">
            {PRODUCTS.map((product) => (
              <li key={product.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm text-zinc-800 dark:text-zinc-200">{product.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {naira.format(product.price)} · {product.blurb}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {cart[product.id] ? (
                    <>
                      <button
                        type="button"
                        aria-label={`Remove one ${product.name}`}
                        onClick={() => {
                          set_cart((previous) => {
                            const next = { ...previous };
                            delete next[product.id];
                            return next;
                          });
                        }}
                        className="h-8 w-8 rounded-lg border border-zinc-300 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                      >
                        −
                      </button>
                      <span className="w-4 text-center text-sm tabular-nums">{cart[product.id]}</span>
                    </>
                  ) : null}
                  <button
                    type="button"
                    aria-label={`Add one ${product.name}`}
                    onClick={() => set_cart((previous) => ({ ...previous, [product.id]: (previous[product.id] ?? 0) + 1 }))}
                    className="h-8 rounded-lg bg-brand-primary px-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    {cart[product.id] ? "+" : "Add"}
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Total</span>
            <span className="op-heading-bold text-xl tabular-nums">{naira.format(cart_total)}</span>
          </div>

          <form
            className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              pay();
            }}
          >
            <label className="block">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Customer email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => set_email(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Name (optional)</span>
              <input
                type="text"
                value={customer_name}
                onChange={(event) => set_customer_name(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>
            <label className="block sm:col-span-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">Delivery address (optional, travels as metadata)</span>
              <input
                type="text"
                value={delivery_address}
                onChange={(event) => set_delivery_address(event.target.value)}
                className="mt-1 h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </label>

            <fieldset className="sm:col-span-2">
              <legend className="text-xs text-zinc-500 dark:text-zinc-400">Pay with</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {GATEWAYS.map((option) => (
                  <label
                    key={option}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      gateway === option
                        ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <input
                      type="radio"
                      name="gateway"
                      value={option}
                      checked={gateway === option}
                      onChange={() => set_gateway(option)}
                      className="sr-only"
                    />
                    <GatewayLogo gateway={option} />
                    {gateway_display_name(option)}
                  </label>
                ))}
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={initiating || cart_total <= 0}
              className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 sm:col-span-2"
            >
              {initiating ? "Starting payment…" : `Pay ${naira.format(cart_total)}`}
            </button>
          </form>
        </section>
      </main>
    </div>
  );
}

// Cart size helper — kept outside the component so the total reducer stays readable.
function cart_size(cart: Record<string, number>): number {
  return Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
}