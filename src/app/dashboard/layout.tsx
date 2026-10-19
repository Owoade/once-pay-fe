import { Suspense } from "react";
import DashboardShell from "./dashboard-shell";

// Auth-gated client UI (localStorage token) — can't participate in the
// instant-navigation static shell, so opt out of its validation.
export const instant = false;

// Server shell: the client nav (usePathname) must sit inside a Suspense
// boundary for the cached-prerender validation to pass.
export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <Suspense fallback={null}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}