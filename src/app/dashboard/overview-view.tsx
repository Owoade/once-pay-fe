"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  NAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  type BackendResponse,
} from "@/lib/api";
import VolumeChart from "./volume-chart";

type TransactionSummary = {
  total_amount: number;
  transaction_count: number;
  daily_volumes: { date: string; amount: number }[];
};

export default function OverviewPage() {
  const router = useRouter();
  const [name, setName] = useState<string | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [loading_summary, setLoadingSummary] = useState(true);

  useEffect(() => {
    setName(localStorage.getItem(NAME_STORAGE_KEY));
  }, []);

  useEffect(() => {
    fetchSummary();
  }, []);

  // 401 anywhere on the dashboard means the session died — fall back to login.
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
    localStorage.removeItem(NAME_STORAGE_KEY);
    router.replace("/login");
  }

  async function fetchSummary() {
    const authorization = auth_header();
    if (!authorization) return;
    setLoadingSummary(true);
    try {
      const response = await fetch("/api/merchant/transactions/summary", {
        headers: { Authorization: authorization },
        cache: "no-store",
      });
      const body: BackendResponse<TransactionSummary> = await response.json();
      if (response.status === 401) return handleExpired();
      if (body.status === "error" || !body.data) {
        toast.error(body.message ?? "Could not load your summary");
        return;
      }
      setSummary(body.data);
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setLoadingSummary(false);
    }
  }

  const card_class =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";

  const total_formatted = summary
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(summary.total_amount)
    : "—";

  return (
    <div>
      <h1 className="op-heading-bold text-2xl">Overview</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Welcome back{name ? `, ${name}` : ""} — here's your live access layer.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className={card_class}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Total amount made
          </p>
          <p className="op-heading-bold mt-1 text-4xl" aria-busy={loading_summary}>
            {total_formatted}
          </p>
        </div>
        <div className={card_class}>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Successful transactions
          </p>
          <p className="op-heading-bold mt-1 text-4xl" aria-busy={loading_summary}>
            {summary ? summary.transaction_count.toLocaleString("en-NG") : "—"}
          </p>
        </div>
      </div>

      <section className={`${card_class} mt-5`}>
        <h2 className="op-heading-bold text-lg">Volume, last 7 days</h2>
        <VolumeChart daily_volumes={summary?.daily_volumes ?? null} />
      </section>
    </div>
  );
}