"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import GoogleButton from "@/components/google-button";
import {
  NAME_STORAGE_KEY,
  TOKEN_STORAGE_KEY,
  type BackendResponse,
} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  async function handleSignIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSigningIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body: BackendResponse<{ name: string; token: string }> =
        await response.json();
      if (body.status === "error" || !body.data?.token) {
        toast.error(body.message ?? "Could not sign you in");
        return;
      }
      localStorage.setItem(TOKEN_STORAGE_KEY, body.data.token);
      localStorage.setItem(NAME_STORAGE_KEY, body.data.name);
      router.push("/dashboard");
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setSigningIn(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 font-sans">
      <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="op-wordmark text-3xl">Once-Pay</h1>
        <h2 className="op-heading-bold mt-6 text-xl">Welcome back</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to your merchant account.
        </p>

        <div className="mt-6">
          <GoogleButton />
        </div>

        <div className="my-6 flex items-center gap-4 text-xs text-zinc-400">
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          or with email
          <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form onSubmit={handleSignIn} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Forgot password?
            </Link>
          </label>

          <button
            type="submit"
            disabled={signingIn}
            className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {signingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        New to Once-Pay?{" "}
        <Link href="/signup" className="font-medium text-brand-primary hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}