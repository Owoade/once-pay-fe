"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import StatusPill from "@/components/status-pill";
import GatewayLogo, { gateway_display_name } from "@/components/gateway-logo";
import { TOKEN_STORAGE_KEY, type BackendResponse } from "@/lib/api";
import moment from "moment";

type TransactionDetail = {
  reference: string;
  amount: number;
  status: string;
  payment_gateway: string;
  payment_gateway_status?: string | null;
  customer_email: string | null;
  initiated_at_ms: number;
  resolved_in_secs?: number | null;
  metadata?: Record<string, any> | null;
  createdAt?: string;
};

type DetailBackendResponse = BackendResponse<{ transaction: TransactionDetail }>;

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function stamp(value?: string | null, ms?: number | null): string {
  const source =
    value ??
    (ms ? new Date(ms).toISOString() : null);
  if (!source) return "—";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(source));
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams<{ reference: string }>();
  const reference = decodeURIComponent(Array.isArray(params.reference) ? params.reference[0] : params.reference);

  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [not_found, setNotFound] = useState(false);
  const [metadata_open, setMetadataOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    load(false);
  }, []);

  function auth_header(): string | null {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return null;
    }
    return `Bearer ${token}`;
  }

  function handleExpired() {
    toast.error("Session expired — sign in again");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("op_name");
    router.replace("/login");
  }

  async function load(verify: boolean) {
    const authorization = auth_header();
    if (!authorization) return;
    if (verify) setVerifying(true);
    try {
      const response = await fetch(
        `/api/merchant/transactions/${encodeURIComponent(reference)}${verify ? "?verify=1" : ""}`,
        { headers: { Authorization: authorization }, cache: "no-store" },
      );
      const body: DetailBackendResponse = await response.json();
      if (response.status === 401) return handleExpired();
      if (body.status === "error" || !body.data) {
        // On a manual gateway check, the page keeps its current state and
        // says nothing — a failed check is a no-op.
        if (!verify) {
          setNotFound(true);
        }
        return;
      }
      setTransaction(body.data.transaction);
    } catch {
      if (!verify) toast.error("Network error — is the backend running?");
      // A failed manual check stays silent — state and page untouched.
    } finally {
      setVerifying(false);
    }
  }

  const card_class =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

  const metadata =
    transaction?.metadata && Object.keys(transaction.metadata).length > 0
      ? transaction.metadata
      : null;
  const metadata_text = metadata ? JSON.stringify(metadata) : null;
  const metadata_truncated =
    metadata_text && metadata_text.length > 40
      ? `${metadata_text.slice(0, 40)}…`
      : metadata_text;

  if (not_found) {
    return (
      <div className="flex flex-col items-start px-1">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Transaction not found.
        </p>
        <Link
          href="/dashboard/transactions"
          className="mt-4 font-medium text-brand-primary hover:underline"
        >
          ← Back to transactions
        </Link>
      </div>
    );
  }

  if (!transaction) {
    return <div aria-hidden="true" className="h-64 animate-pulse rounded-2xl bg-zinc-100 dark:bg-zinc-900" />;
  }

  return (
    <div>
      <Link
        href="/dashboard/transactions"
        className="text-sm font-medium text-brand-primary hover:underline"
      >
        ← Back to transactions
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate font-mono text-lg text-zinc-800 dark:text-zinc-200">
            {transaction.reference}
          </h1>
          <div className="mt-2">
            <StatusPill status={transaction.status} />
          </div>
        </div>
        <p className="op-heading-bold text-4xl">
          {naira.format(transaction.amount)}
        </p>
      </div>

      <section className={`${card_class} mt-6`}>
        <h2 className="op-heading-bold text-lg">Details</h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Customer</dt>
            <dd className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
              {transaction.customer_email ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Gateway</dt>
            <dd className="mt-0.5 flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200">
              <GatewayLogo gateway={transaction.payment_gateway} />
              {gateway_display_name(transaction.payment_gateway)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Gateway status</dt>
            <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
              {transaction.payment_gateway_status ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Created</dt>
            <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
              {moment(transaction.initiated_at_ms).format("D MMM, HH:mm")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Resolved in</dt>
            <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
              {transaction.resolved_in_secs != null
                ? `${transaction.resolved_in_secs}s`
                : "—"}
            </dd>
          </div>
          <div className="min-w-0 sm:col-span-2">
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">Metadata</dt>
            {metadata ? (
              <>
                <dd className="mt-0.5 pr-6 truncate font-mono text-xs text-zinc-800 dark:text-zinc-200">
                  {metadata_truncated}
                </dd>
                <button
                  type="button"
                  onClick={() => setMetadataOpen(!metadata_open)}
                  className="mt-1 text-xs font-medium text-brand-primary hover:underline"
                >
                  {metadata_open ? "Hide full" : "View full"}
                </button>
              </>
            ) : (
              <dd className="mt-0.5 text-sm text-zinc-800 dark:text-zinc-200">
                —
              </dd>
            )}
          </div>
        </dl>

        {metadata && metadata_open ? (
          <pre className="mt-4 max-h-64 overflow-auto rounded-lg bg-zinc-100 p-3 font-mono text-xs leading-relaxed text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
            {JSON.stringify(metadata, null, 2)}
          </pre>
        ) : null}
      </section>

      {transaction.status === "pending" ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Still pending on {transaction.payment_gateway}. Ask your customer
            to complete the payment, or check with the gateway now.
          </p>
          <button
            type="button"
            disabled={verifying}
            onClick={() => load(true)}
            className="h-10 shrink-0 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {verifying ? "Checking…" : "Check with gateway"}
          </button>
        </div>
      ) : null}
    </div>
  );
}