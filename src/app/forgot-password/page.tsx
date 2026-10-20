"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ResendCodeButton from "@/components/resend-code-button";
import Logo from "@/components/logo";
import {
  FORGOT_PASSWORD_PENDING_KEY,
  type BackendResponse,
} from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<"email" | "otp" | "password">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // The client router cache restores this page's state (phase and field
  // values) when the route is revisited, so every entry into the flow
  // starts over at the email form.
  useEffect(() => {
    setPhase("email");
    setEmail("");
    setOtp("");
    setPassword("");
    setConfirmPassword("");
  }, []);

  // Leaving the page drops the saved resend email; email/otp/password are
  // component state and reset on unmount anyway.
  useEffect(() => {
    return () => localStorage.removeItem(FORGOT_PASSWORD_PENDING_KEY);
  }, []);

  // POST /auth/forgot-password → OTP goes out by email.
  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body: BackendResponse<{ message: string }> = await response.json();
      if (body.status === "error") {
        toast.error(body.message ?? "Could not send a reset code");
        return;
      }
      // Kept so the OTP page's resend button can re-call forgot-password.
      localStorage.setItem(FORGOT_PASSWORD_PENDING_KEY, JSON.stringify({ email }));
      toast.success(`Reset code sent to ${email}`);
      setPhase("otp");
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setSubmitting(false);
    }
  }

  // The code isn't validated server-side until the reset call, so "Proceed"
  // just moves to the password step.
  function handleOtpProceed(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPhase("password");
  }

  // Resend: replays the stored email to generate a fresh code.
  async function handleResendCode(): Promise<boolean> {
    const stored = localStorage.getItem(FORGOT_PASSWORD_PENDING_KEY);
    if (!stored) {
      toast.error("Missing email address — go back and resubmit the form.");
      return false;
    }
    try {
      const response = await fetch("/api/auth/forgot-password", {
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

  // POST /auth/reset-password takes { otp, password } and invalidates the code.
  async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp, password }),
      });
      const body: BackendResponse<{ message: string }> = await response.json();
      if (body.status === "error") {
        toast.error(body.message ?? "Invalid or expired code");
        return;
      }
      localStorage.removeItem(FORGOT_PASSWORD_PENDING_KEY);
      // Reset the flow before leaving, so revisiting the page starts at
      // the email form however the navigation gets restored.
      setPhase("email");
      setEmail("");
      setOtp("");
      setPassword("");
      setConfirmPassword("");
      toast.success("Password updated — sign in with your new password");
      router.push("/login");
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

        {phase === "email" ? (
          <>
            <h2 className="op-heading-bold mt-6 text-xl">Forgot password?</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              We'll email you a code to set a new password.
            </p>
            <form onSubmit={handleEmailSubmit} className="mt-6 flex flex-col gap-4">
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

              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Sending…" : "Send reset code"}
              </button>
            </form>
          </>
        ) : phase === "otp" ? (
          <>
            <h2 className="op-heading-bold mt-6 text-xl">Enter your code</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              We sent a 6-digit code to {email}.
            </p>
            <form onSubmit={handleOtpProceed} className="mt-6 flex flex-col gap-4">
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
                Proceed
              </button>
              <div className="flex justify-center">
                <ResendCodeButton onResend={handleResendCode} />
              </div>
              <button
                type="button"
                disabled={submitting}
                onClick={() => {
                  setPhase("email");
                  setOtp("");
                  localStorage.removeItem(FORGOT_PASSWORD_PENDING_KEY);
                }}
                className="text-sm text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Use a different email
              </button>
            </form>
          </>
        ) : (
          <>
            <h2 className="op-heading-bold mt-6 text-xl">Set a new password</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Choose a new password for your account.
            </p>
            <form onSubmit={handleResetSubmit} className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                New password
                <input
                  type="password"
                  required
                  minLength={8}
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={input_class}
                />
                <span className="text-xs text-zinc-400">
                  At least 8 characters.
                </span>
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                Confirm password
                <input
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  className={input_class}
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="h-11 rounded-lg bg-brand-primary text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          </>
        )}
      </main>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/login"
          className="font-medium text-brand-primary hover:underline"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}