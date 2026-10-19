"use client";

import { useState } from "react";

// Daily successful volume, last 7 days. Single series — the card title names
// it, so no legend. Bars are divs: <=24px wide, 4px rounded cap at the data
// end, square at the baseline, with a per-mark hover/focus tooltip. Dark mode
// uses the brand accent step (#3b82f6) — the only blue validated against the
// dark surface alongside #2563eb (both pass the six checks).
const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

type DailyVolume = { date: string; amount: number };

// Clean y-axis top: the next 1/2/5-step value at or above the data max.
function nice_ceil(value: number): number {
  if (value <= 0) return 1000;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  for (const step of [1, 2, 5, 10]) {
    if (value <= step * base) return step * base;
  }
  return 10 * base;
}

function compact(value: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function day_label(date: string): string {
  return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" })
    .format(new Date(`${date}T00:00:00Z`));
}

function full_label(date: string): string {
  return new Intl.DateTimeFormat("en", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export default function VolumeChart({
  daily_volumes,
}: {
  daily_volumes: DailyVolume[] | null;
}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const volumes = daily_volumes ?? [];
  const max = Math.max(...volumes.map((d) => d.amount), 0);
  const axis_max = nice_ceil(max);
  const peak_index =
    max > 0 ? volumes.findIndex((d) => d.amount === max) : -1;

  if (!daily_volumes) {
    return <div className="mt-4 h-44" aria-hidden="true" />;
  }

  if (max === 0) {
    return (
      <p className="mt-4 flex h-44 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
        No successful transactions yet.
      </p>
    );
  }

  return (
    <div>
      <div className="relative mt-4 flex h-48 gap-4 px-1">
        {/* Y ticks: the hairlines sit behind the bars, recessive. */}
        <div className="relative min-w-10 border-r border-zinc-200 text-right dark:border-zinc-800">
          {[["1", "top"], ["0.5", "mid"]].map(([position]) => {
            const step = position === "top" ? axis_max : axis_max / 2;
            return (
              <span
                key={position}
                className="absolute -top-2 right-1.5 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400"
                style={{ top: position === "top" ? 0 : "50%" }}
              >
                {compact(step)}
              </span>
            );
          })}
          <span className="absolute -bottom-2 right-1.5 text-[10px] tabular-nums text-zinc-500 dark:text-zinc-400">
            0
          </span>
        </div>

        <div className="relative flex-1">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-px bg-zinc-200 dark:bg-zinc-800"
          />
          <div
            aria-hidden="true"
            className="absolute inset-x-0 top-1/2 h-px bg-zinc-200 dark:bg-zinc-800"
          />

          <div className="flex h-48 items-end">
            {volumes.map((entry, index) => {
              const height_pct = (entry.amount / axis_max) * 100 * 0.94;
              const is_hovered = hovered === index;
              return (
                <div
                  key={entry.date}
                  className="relative flex h-full flex-1 items-end justify-center"
                >
                  <button
                    type="button"
                    aria-label={`${naira.format(entry.amount)} on ${full_label(entry.date)}`}
                    onMouseEnter={() => setHovered(index)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(index)}
                    onBlur={() => setHovered(null)}
                    className="group relative flex h-full w-full max-w-6 items-end justify-center outline-none focus-visible:ring-2 focus-visible:ring-brand-accent/40"
                  >
                    {is_hovered ? (
                      <span
                        role="status"
                        className="pointer-events-none absolute top-0 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                      >
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {naira.format(entry.amount)}
                        </span>{" "}
                        <span className="text-zinc-500 dark:text-zinc-400">
                          {full_label(entry.date)}
                        </span>
                      </span>
                    ) : null}

                    {index === peak_index ? (
                      <span
                        className="pointer-events-none absolute z-10 text-xs tabular-nums text-zinc-600 dark:text-zinc-300"
                        style={{ bottom: `calc(${height_pct}% + 4px)` }}
                      >
                        {compact(entry.amount)}
                      </span>
                    ) : null}

                    <span
                      className="w-5 rounded-t-[4px] bg-brand-primary group-hover:bg-brand-accent group-focus-visible:bg-brand-accent dark:bg-brand-accent"
                      style={{ height: `${height_pct}%` }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-2 flex gap-4 px-1">
        <span className="w-10" aria-hidden="true" />
        <div className="flex flex-1">
          {volumes.map((entry) => (
            <span
              key={entry.date}
              className="flex-1 text-center text-[10px] text-zinc-500 dark:text-zinc-400"
            >
              {day_label(entry.date)}
            </span>
          ))}
        </div>
      </div>

      {/* Every tooltip value stays reachable without hover. */}
      <details className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <summary className="cursor-pointer select-none">
          View as table
        </summary>
        <table className="mt-2 w-full text-left tabular-nums">
          <thead>
            <tr className="text-zinc-500 dark:text-zinc-400">
              <th className="py-1 font-medium">Day</th>
              <th className="py-1 text-right font-medium">Volume</th>
            </tr>
          </thead>
          <tbody>
            {volumes.map((entry) => (
              <tr key={entry.date} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="py-1">{full_label(entry.date)}</td>
                <td className="py-1 text-right text-zinc-800 dark:text-zinc-200">
                  {naira.format(entry.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}