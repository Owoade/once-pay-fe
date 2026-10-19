"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { BackendResponse } from "@/lib/api";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path
        fill="#EA4335"
        d="M12 5.04c1.7 0 3.23.59 4.43 1.74l3.3-3.3C17.74 1.64 15.08.5 12 .5 7.58.5 3.75 3.02 1.9 6.74l3.86 3C5.68 7.15 8.6 5.04 12 5.04z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.09-1.67-.24-2.45H12v4.64h6.44a5.5 5.5 0 0 1-2.39 3.62l3.72 2.88c2.17-2 3.73-4.96 3.73-8.69z"
      />
      <path
        fill="#FBBC05"
        d="M5.77 14.44a7.17 7.17 0 0 1 0-4.62l-3.86-3a11.5 11.5 0 0 0 0 10.62l3.86-3z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.08 0 5.67-1.01 7.55-2.75l-3.72-2.88c-1.03.69-2.34 1.1-3.83 1.1-3.4 0-6.32-2.11-7.24-5.03l-3.86 3C3.75 21.7 7.58 24 12 24z"
      />
    </svg>
  );
}

// Starts the shared Google OAuth flow: fetch the auth URL through the
// /api/auth proxy, then leave for Google's consent screen.
export default function GoogleButton({
  label = "Continue with Google",
}: {
  label?: string;
}) {
  const [starting, setStarting] = useState(false);

  async function handleClick() {
    setStarting(true);
    try {
      const response = await fetch("/api/auth/google");
      const body: BackendResponse<{ url: string }> = await response.json();
      if (body.status === "error" || !body.data?.url) {
        toast.error(body.message ?? "Could not start Google sign-in");
        setStarting(false);
        return;
      }
      // We come back via /auth/callback.
      window.location.href = body.data.url;
    } catch {
      toast.error("Network error — is the backend running?");
      setStarting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={starting}
      className="flex h-11 w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
    >
      <GoogleIcon />
      {starting ? "Redirecting…" : label}
    </button>
  );
}