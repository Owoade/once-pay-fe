"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import GoogleButton from "@/components/google-button";
import Logo from "@/components/logo";
import ResendCodeButton from "@/components/resend-code-button";
import {
  NAME_STORAGE_KEY,
  SIGNUP_PENDING_KEY,
  TOKEN_STORAGE_KEY,
  type BackendResponse,
} from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // POST /auth/signup → OTP goes out by email, account isn't created yet.
  async function handleDetailsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const body: BackendResponse<{ message: string }> = await response.json();
      if (body.status === "error") {
        toast.error(body.message ?? "Could not create your account");
        return;
      }
      // Kept so the OTP page's resend button can re-call signup.
      localStorage.setItem(SIGNUP_PENDING_KEY, JSON.stringify({ name, email, password }));
      toast.success(`Verification code sent to ${email}`);
      setPhase("otp");
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  // Resend: replays the stored signup payload, which regenerates the OTP.
  async function handleResendCode(): Promise<boolean> {
    const stored = localStorage.getItem(SIGNUP_PENDING_KEY);
    if (!stored) {
      toast.error("Missing signup details — go back and resubmit the form.");
      return false;
    }
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: stored,
      });
      const body: BackendResponse<{ message: string }> = await response.json();
      if (body.status === "error") {
        toast.error(body.message ?? "Could not resend the code");
        return false;
      }
      toast.success("New code sent");
      return true;
    } catch {
      toast.error("Network error — is the backend running?");
      return false;
    }
  }

  // POST /auth/verify-otp creates the account but returns no token, so we
  // sign in with the credentials we still hold to hand over a session.
  async function handleOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const verify_response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });
      const verify_body: BackendResponse<{ message: string }> =
        await verify_response.json();
      if (verify_body.status === "error") {
        toast.error(verify_body.message ?? "Invalid or expired code");
        return;
      }

      const login_response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const login_body: BackendResponse<{ name: string; token: string }> =
        await login_response.json();
      if (login_body.status === "error" || !login_body.data?.token) {
        // Account exists but auto sign-in failed — send them to sign in.
        localStorage.removeItem(SIGNUP_PENDING_KEY);
        toast("Account created — sign in to continue");
        router.push("/login");
        return;
      }

      localStorage.setItem(TOKEN_STORAGE_KEY, login_body.data.token);
      localStorage.setItem(NAME_STORAGE_KEY, login_body.data.name);
      localStorage.removeItem(SIGNUP_PENDING_KEY);
      setOtp("");
      router.push("/dashboard");
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  const input_class =
    "h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 font-sans">
      <main className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* The lockup routes back to the landing page. */}
        <h1>
          <Link href="/" className="inline-flex">
            <Logo image_class="h-9 w-9" wordmark_class="text-3xl" />
          </Link>
        </h1>
        <h2 className="op-heading-bold mt-6 text-xl">Create your account</h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {phase === "details"
            ? "Start accepting payments in minutes."
            : `We sent a 6-digit code to ${email}.`}
        </p>

        {phase === "details" ? (
          <>
            <div className="mt-6">
              <GoogleButton label="Sign up with Google" />
            </div>

            <div className="my-6 flex items-center gap-4 text-xs text-zinc-400">
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              or with email
              <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
            </div>

            <form
              onSubmit={handleDetailsSubmit}
              className="flex flex-col gap-4"
            >
              <label className="flex flex-col gap-1.5 text-sm">
                Name
                <input
                  type="text"
                  required
                  minLength={3}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={input_class}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Email
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={input_class}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={input_class}
                />
                <span className="text-xs text-zinc-400">
                  At least 8 characters.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Creating account…" : "Continue"}
              </button>
            </form>
          </>
        ) : (
          <form onSubmit={handleOtpSubmit} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              Verification code
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                required
                autoFocus
                value={otp}
                onChange={(event) =>
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                className={`${input_class} text-center font-mono text-lg tracking-widest`}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Verifying…" : "Verify & sign in"}
            </button>
            <div className="flex justify-center">
              <ResendCodeButton onResend={handleResendCode} />
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => {
                setPhase("details");
                setOtp("");
              }}
              className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              Use a different email
            </button>
          </form>
        )}
      </main>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-brand-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}