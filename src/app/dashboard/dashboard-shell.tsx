"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { NAME_STORAGE_KEY, TOKEN_STORAGE_KEY } from "@/lib/api";
import Logo from "@/components/logo";

// Three tabs share the header; the token guard lives here so every tab is
// protected without repeating it per page.
const nav_items = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4.5 w-4.5">
        <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
        <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
        <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: "Transactions",
    href: "/dashboard/transactions",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4.5 w-4.5">
        <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Developer",
    href: "/dashboard/developer",
    icon: (
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4.5 w-4.5">
        <path d="m9 8-4 4 4 4M15 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  function sign_out() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
    router.replace("/login");
  }

  if (!ready) return null;

  // The transaction detail route is not a tab — highlight its parent.
  function is_active(item: { href: string }) {
    if (item.href === "/dashboard") return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-3 md:px-8">
          <Link href="/dashboard" className="inline-flex">
            <Logo image_class="h-8 w-8" wordmark_class="text-xl md:text-2xl" />
          </Link>

          {/* Second row on small screens, inline on md+. */}
          <nav className="-mx-4 order-3 flex w-full gap-1 overflow-x-auto px-4 pb-1 md:order-none md:mx-0 md:w-auto md:flex-1 md:px-0 md:pb-0">
            {nav_items.map((item) => {
              const active = is_active(item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={sign_out}
            className="ml-auto flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 md:ml-0"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" className="h-4.5 w-4.5">
              <path d="M15 12H4m0 0 3.5-3.5M4 12l3.5 3.5M10 5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sign out
          </button>
        </div>
      </header>

      <main className="p-5 md:p-8">
        <div className="mx-auto max-w-3xl">{children}</div>
      </main>
    </div>
  );
}