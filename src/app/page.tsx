import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/logo";

export const metadata: Metadata = {
  title: "Once-Pay — Pay once, done.",
  description:
    "One payment API for every gateway. Integrate Once-Pay once and accept payments through Paystack, Flutterwave, Korapay, SeerBit and Monnify.",
};

// Hero GIF is a dark canvas (900×760) — it sits in a card so it reads as a
// deliberate "product screen" in both themes.
export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="inline-flex">
            <Logo image_class="h-8 w-8" wordmark_class="text-xl" />
          </Link>
          <nav className="flex items-center gap-1.5">
            {/* At phone width only the primary action survives; the text
                links stay reachable inside the product (docs links from the
                dashboard, sign in from the gate page). */}
            <Link
              href="/docs"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:block"
            >
              API docs
            </Link>
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900 sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-primary px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-20">
        <p className="max-w-full rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-center font-mono text-[11px] text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-400 sm:text-xs">
          Now in sandbox — live payments coming soon
        </p>

        <h1 className="op-wordmark mt-5 max-w-2xl text-center text-4xl sm:text-5xl">
          One payment API. Every gateway.
        </h1>

        <p className="mt-4 max-w-xl text-center text-lg text-zinc-600 dark:text-zinc-400">
          Integrate with Once-Pay once and start accepting payments through
          Paystack, Flutterwave, Korapay, SeerBit and Monnify — no per-gateway
          SDKs, no duplicated webhooks.
        </p>

        {/* CTAs stack full-width on phones, sit side by side from sm up. */}
        <div className="mt-8 flex w-full max-w-xs flex-col justify-center gap-3 sm:max-w-none sm:flex-row">
          <Link
            href="/demo"
            className="h-11 rounded-lg bg-brand-primary px-6 text-center text-sm font-semibold leading-[2.75rem] text-white transition-opacity hover:opacity-90"
          >
            Try checkout demo
          </Link>
          <Link
            href="/docs"
            className="h-11 rounded-lg border border-zinc-300 bg-white px-6 text-center text-sm font-semibold leading-[2.75rem] text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Read the API docs
          </Link>
        </div>

        <figure className="mt-10 w-full max-w-3xl sm:mt-16">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800">
            <Image
              src="/once-pay-hero.gif"
              alt="Diagram of one Once-Pay API call fanning out to Paystack, Flutterwave, Korapay, SeerBit and Monnify"
              width={900}
              height={760}
              priority
              unoptimized
              className="h-auto w-full"
            />
          </div>
          <figcaption className="sr-only">
            Your app calls POST /v1/pay once; Once-Pay routes it to your
            payment gateway.
          </figcaption>
        </figure>

      </main>
    </div>
  );
}