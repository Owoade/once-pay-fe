"use client";

import { useEffect, useState } from "react";

// Countdown-gated resend control: shows "Resend code in Ns" until the
// cooldown passes, then enables the button. Resolves `true` from onResend
// to restart the cooldown (a fresh code went out); false keeps it editable.
export default function ResendCodeButton({
  seconds = 60,
  onResend,
}: {
  seconds?: number;
  onResend: () => Promise<boolean>;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const timer = setInterval(
      () => setRemaining((value) => (value > 0 ? value - 1 : value)),
      1000,
    );
    return () => clearInterval(timer);
  }, []);

  async function handleClick() {
    setSending(true);
    const sent = await onResend();
    setSending(false);
    if (sent) setRemaining(seconds);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={remaining > 0 || sending}
      className="text-sm font-medium text-brand-primary transition-opacity hover:underline disabled:cursor-not-allowed disabled:text-zinc-400 disabled:no-underline dark:disabled:text-zinc-600"
    >
      {sending ? "Sending…" : remaining > 0 ? `Resend code in ${remaining}s` : "Resend code"}
    </button>
  );
}