"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  NAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  type BackendResponse,
} from "@/lib/api";

// Gate link: /gate?session=<Once-Pay JWT> signs the holder in. The token is
// exchanged at the backend for a fresh session — same shape login returns —
// then stored the way email/password auth stores its own.
export default function GatePage() {
  const [error, setError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    // The backend's Google callback redirects here on failure with
    // ?error=<message>; surface that instead of a generic "missing token".
    const handoff_error = params.get("error");
    if (handoff_error) {
      setError(true);
      toast.error(handoff_error);
      return;
    }

    const session = params.get("session");

    if (!session) {
      setError(true);
      toast.error("This sign-in link is missing its session token");
      return;
    }

    fetch(`/api/auth/verify-session?session=${encodeURIComponent(session)}`, {
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((body: BackendResponse<{ token: string; name: string }>) => {
        if (body.status === "error" || !body.data?.token) {
          setError(true);
          toast.error(body.message ?? "This sign-in link has expired");
          return;
        }
        localStorage.setItem(TOKEN_STORAGE_KEY, body.data.token);
        localStorage.setItem(NAME_STORAGE_KEY, body.data.name);
        window.location.replace("/dashboard");
      })
      .catch(() => {
        setError(true);
        toast.error("Network error — is the backend running?");
      });
  }, []);

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 font-sans">
        <Link
          href="/login"
          className="font-medium text-brand-primary hover:underline"
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