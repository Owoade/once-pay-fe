"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import StatusPill from "@/components/status-pill";
import GatewayLogo, { gateway_display_name } from "@/components/gateway-logo";
import { TOKEN_STORAGE_KEY, type BackendResponse } from "@/lib/api";
import moment from "moment";

type MerchantTransaction = {
  reference: string;
  amount: number;
  status: string;
  payment_gateway: string;
  customer_email: string | null;
  initiated_at_ms: number | string;
  createdAt?: string;
};

const PAGE_SIZE = 20;

const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
});

function date_of(entry: MerchantTransaction): string {
  // `initiated_at_ms` can arrive as either a number or a numeric string
  // (Sequelize's BIGINT sanitizer emits strings for large integers), so
  // coerce once and check it resolved to a real timestamp — otherwise the
  // Intl format call throws "date value is not finite".
  const ms = entry.createdAt
    ? new Date(entry.createdAt).getTime()
    : Number(entry.initiated_at_ms);

  if (!Number.isFinite(ms)) return "—";

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(ms);
}

const filters = [
  { key: "all", label: "All" },
  { key: "successful", label: "Successful" },
  { key: "pending", label: "Pending" },
  { key: "failed", label: "Failed" },
];

export default function TransactionsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<MerchantTransaction[] | null>(null);
  const [total, setTotal] = useState(0);
  const [status_filter, setStatusFilter] = useState("all");
  const [refetching, setRefetching] = useState(false);
  const [loading_more, setLoadingMore] = useState(false);

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

  async function load(
    { append = false, status = status_filter, offset = 0 } = {},
  ) {
    const authorization = auth_header();
    if (!authorization) return;
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (status !== "all") params.set("status", status);

    if (append) setLoadingMore(true);
    else setRefetching(true);
    try {
      const response = await fetch(`/api/merchant/transactions?${params}`, {
        headers: { Authorization: authorization },
        cache: "no-store",
      });
      const body: BackendResponse<{
        transactions: MerchantTransaction[];
        total: number;
      }> = await response.json();
      if (response.status === 401) return handleExpired();
      if (body.status === "error" || !body.data) {
        toast.error(body.message ?? "Could not load transactions");
        return;
      }
      setRows(append ? [...(rows ?? []), ...body.data.transactions] : body.data.transactions);
      setTotal(body.data.total);
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      if (append) setLoadingMore(false);
      else setRefetching(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="op-heading-bold text-2xl">Transactions</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Every transaction across your linked gateways.
          </p>
        </div>
        {rows ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400" aria-live="polite">
            {Math.min(rows.length, total)} of {total}
          </p>
        ) : null}
      </div>

      {/* Filters: one row, above the table. */}
      <div className="mt-5 flex gap-1.5" aria-label="Filter by status">
        {filters.map((filter) => {
          const active = status_filter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = filter.key;
                setStatusFilter(next);
                load({ status: next, offset: 0 });
              }}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="overflow-x-auto" aria-busy={refetching}>
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Reference</th>
                <th className="px-4 py-3 font-medium">Gateway</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className={refetching ? "opacity-50 transition-opacity" : "transition-opacity"}>
              {rows
                ? rows.map((entry) => (
                    <tr
                      key={entry.reference}
                      className="group cursor-pointer border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800/70 dark:hover:bg-zinc-900/60"
                      onClick={() => router.push(`/dashboard/transactions/${encodeURIComponent(entry.reference)}`)}
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-zinc-500 dark:text-zinc-400">
                        {moment(entry.initiated_at_ms).format("D MMM, HH:mm")}
                      </td>
                      <td className="max-w-40 truncate px-4 py-3 font-mono text-xs text-zinc-700 group-hover:text-brand-primary dark:text-zinc-300">
                        {entry.reference}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                          <GatewayLogo gateway={entry.payment_gateway} />
                          {gateway_display_name(entry.payment_gateway)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right tabular-nums text-zinc-800 dark:text-zinc-200">
                        {naira.format(entry.amount)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusPill status={entry.status} />
                      </td>
                    </tr>
                  ))
                : Array.from({ length: 5 }).map((_, index) => (
                    <tr key={index} aria-hidden="true">
                      <td colSpan={5} className="px-4 py-4">
                        <span className="block h-4 animate-pulse rounded bg-zinc-100 dark:bg-zinc-900" />
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {rows && rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
            No {status_filter === "all" ? "" : `${status_filter} `}
            transactions yet.
          </p>
        ) : null}
      </section>

      {rows && rows.length < total ? (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            disabled={loading_more}
            onClick={() => load({ append: true, offset: rows.length })}
            className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {loading_more ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}