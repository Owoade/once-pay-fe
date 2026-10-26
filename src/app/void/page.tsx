"use client";

import { useEffect } from "react";

export default function VoidPage() {
  useEffect(() => {
    window.close();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="max-w-sm text-center">
        <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          You can close this tab.
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          This page has nothing left for you here — safe to close this tab now.
        </p>
      </div>
    </main>
  );
}