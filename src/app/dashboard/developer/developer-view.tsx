"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TOKEN_STORAGE_KEY, type BackendResponse } from "@/lib/api";

type DeveloperSettings = { api_key: string; webhook_url: string };

export default function DeveloperClientView() {
  const router = useRouter();
  const [settings, setSettings] = useState<DeveloperSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [key_visible, setKeyVisible] = useState(false);
  const [webhook_url, setWebhookUrl] = useState("");
  const [saving_webhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  // 401 anywhere on the dashboard means the session died — fall back to login.
  function auth_header(): string | null {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      router.replace("/login");
      return null;
    }
    return `Bearer ${token}`;
  }

  function handleExpired() {
    toast.error("Session expired — sign in again");
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("op_name");
    router.replace("/login");
  }

  async function loadSettings() {
    const authorization = auth_header();
    if (!authorization) return;
    setLoading(true);
    try {
      const response = await fetch("/api/merchant/developers", {
        headers: { Authorization: authorization },
        cache: "no-store",
      });
      const body: BackendResponse<DeveloperSettings> = await response.json();
      if (response.status === 401) return handleExpired();
      if (body.status === "error" || !body.data) {
        toast.error(body.message ?? "Could not load developer settings");
        return;
      }
      setSettings(body.data);
      if (body.data.webhook_url) setWebhookUrl(body.data.webhook_url);
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyKey() {
    if (!settings?.api_key) return;
    try {
      await navigator.clipboard.writeText(settings.api_key);
      toast.success("API key copied");
    } catch {
      toast.error("Could not copy — your browser blocked clipboard access");
    }
  }

  async function handleWebhookSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const authorization = auth_header();
    if (!authorization) return;
    setSavingWebhook(true);
    try {
      const response = await fetch("/api/merchant/webhook-url", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: authorization },
        body: JSON.stringify({ webhook_url }),
      });
      const body: BackendResponse<{ message: string }> = await response.json();
      if (response.status === 401) return handleExpired();
      if (body.status === "error") {
        toast.error(body.message ?? "Could not save the webhook URL");
        return;
      }
      setSettings((settings) =>
        settings ? { ...settings, webhook_url } : settings,
      );
      toast.success("Webhook URL saved");
    } catch {
      toast.error("Network error — is the backend running?");
    } finally {
      setSavingWebhook(false);
    }
  }

  const card_class =
    "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950";
  const button_class =
    "h-10 rounded-lg bg-brand-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50";
  const key = settings?.api_key;

  return (
    <div>
      <h1 className="op-heading-bold text-2xl">Developer</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Keys, webhooks and API reference.
      </p>

      <div className="mt-6 flex flex-col gap-5">
        <section className={card_class}>
          <h2 className="op-heading-bold text-lg">Live API access</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Authenticate your integration with your Once-Pay key.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {key
                ? key_visible
                  ? key
                  : `${key.slice(0, 6)}${"•".repeat(20)}`
                : "pk_••••••••••••••••••••"}
            </code>
            {key ? (
              <button
                type="button"
                onClick={() => setKeyVisible(!key_visible)}
                className="h-10 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {key_visible ? "Hide" : "Reveal"}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleCopyKey}
              disabled={!key}
              className={button_class}
            >
              {loading ? "Loading…" : key ? "Copy" : "Loading…"}
            </button>
          </div>
        </section>

        <section className={card_class}>
          <h2 className="op-heading-bold text-lg">Webhook endpoint</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            We'll POST <code className="text-xs">transaction.success</code> here,
            signed with your API key in{" "}
            <code className="text-xs">X-Signature</code>.
          </p>
          <form
            onSubmit={handleWebhookSave}
            className="mt-4 flex flex-wrap gap-3"
          >
            <input
              type="url"
              required
              placeholder="https://your-server.com/webhooks/once-pay"
              value={webhook_url}
              onChange={(event) => setWebhookUrl(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-accent/30 dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="submit"
              disabled={saving_webhook}
              className={button_class}
            >
              {saving_webhook ? "Saving…" : "Save"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}