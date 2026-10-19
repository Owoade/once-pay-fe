"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NAME_STORAGE_KEY, TOKEN_STORAGE_KEY } from "@/lib/api";

// The backend's /auth/google/callback redirects here with ?token=&name=
export default function AuthCallbackPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const name = params.get("name");

    if (!token) {
      setError("Google sign-in did not return a session. Please try again.");
      return;
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    if (name) localStorage.setItem(NAME_STORAGE_KEY, name);
    window.location.replace("/dashboard");
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 font-sans">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Link
          href="/login"
          className="mt-4 font-medium text-brand-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center font-sans text-zinc-600 dark:text-zinc-400">
      Signing you in…
    </div>
  );
}