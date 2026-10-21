"use client";

import { Fragment, useState, type ReactNode } from "react";
import { toast } from "sonner";

export type CodeLanguage = "json" | "shell" | "nodejs";

const t = {
  key: "text-brand-primary dark:text-brand-accent",
  string: "text-emerald-700 dark:text-emerald-400",
  number: "text-amber-700 dark:text-amber-400",
  bool: "text-purple-700 dark:text-purple-400",
  punct: "text-zinc-400 dark:text-zinc-500",
  comment: "text-zinc-500 dark:text-zinc-500 italic",
  flag: "text-sky-700 dark:text-sky-400",
  command: "font-semibold text-zinc-900 dark:text-zinc-100",
  keyword: "text-purple-700 dark:text-purple-400",
};

function Span({ kind, children }: { kind: keyof typeof t; children: ReactNode }) {
  return <span className={t[kind]}>{children}</span>;
}

// JSON colors are computed from the parsed value, so quoting/escaping can
// never lie to the reader. Falls back to plain text if it isn't JSON.
function JsonValue({ value, level = 0 }: { value: any; level?: number }): ReactNode {
  const pad = "  ".repeat(level);

  if (value === null) return <Span kind="bool">null</Span>;
  if (typeof value === "boolean") return <Span kind="bool">{String(value)}</Span>;
  if (typeof value === "number") return <Span kind="number">{String(value)}</Span>;
  if (typeof value === "string")
    return <Span kind="string">{"\"" + value + "\""}</Span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <Span kind="punct">[]</Span>;
    return (
      <Fragment>
        <Span kind="punct">[</Span>
        {"\n"}
        {value.map((item, index) => (
          <Fragment key={index}>
            {"  ".repeat(level + 1)}
            <JsonValue value={item} level={level + 1} />
            {index < value.length - 1 ? <Span kind="punct">,</Span> : null}
            {"\n"}
          </Fragment>
        ))}
        {pad}
        <Span kind="punct">]</Span>
      </Fragment>
    );
  }

  const entries = Object.entries(value);
  if (entries.length === 0) return <Span kind="punct">{"{}"}</Span>;
  return (
    <Fragment>
      <Span kind="punct">{"{"}</Span>
      {"\n"}
      {entries.map(([entry_key, entry_value], index) => (
        <Fragment key={entry_key}>
          {"  ".repeat(level + 1)}
          <Span kind="key">{"\"" + entry_key + "\""}</Span>
          <Span kind="punct">: </Span>
          <JsonValue value={entry_value} level={level + 1} />
          {index < entries.length - 1 ? <Span kind="punct">,</Span> : null}
          {"\n"}
        </Fragment>
      ))}
      {pad}
      <Span kind="punct">{"}"}</Span>
    </Fragment>
  );
}

function ShellOrNodeText({ code, language }: { code: string; language: "shell" | "nodejs" }) {
  const pattern =
    language === "shell"
      ? /("(?:[^"\\]|\\.)*")|(#[^\n]*)|\b(curl)\b|(?<=\s|^)(-{1,2}[A-Za-z][A-Za-z-]*)|\b(\d+)\b/g
      : /("(?:[^"\\]|\\.)*")|(\/\/[^\n]*)|\b(import|from|const|let|export|default|function|return|async|await|new|typeof)\b|\b(\d+)\b/g;

  const kinds: (keyof typeof t)[] =
    language === "shell"
      ? ["string", "comment", "command", "flag", "number"]
      : ["string", "comment", "keyword", "number"];

  const nodes: ReactNode[] = [];
  let index = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > index) nodes.push(code.slice(index, match.index));
    const group = match.slice(1).findIndex((captured) => captured !== undefined);
    const kind = kinds[group] ?? "punct";
    nodes.push(
      <Span key={nodes.length} kind={kind}>
        {match[0]}
      </Span>,
    );
    index = match.index + match[0].length;
  }
  if (index < code.length) nodes.push(code.slice(index));

  return <Fragment>{nodes}</Fragment>;
}

function highlighted(code: string, language?: CodeLanguage): ReactNode {
  if (language === "json") {
    try {
      return <JsonValue value={JSON.parse(code)} />;
    } catch {
      return code;
    }
  }
  if (language === "shell" || language === "nodejs") {
    return <ShellOrNodeText code={code} language={language} />;
  }
  return code;
}

// Copyable code block: a chrome bar with the language label and a copy
// button, code below rendered as text (never markup).
export default function CodeBlock({
  label,
  code,
  language,
}: {
  label?: string;
  code: string;
  language?: CodeLanguage;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy because your browser blocked clipboard access");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900">
        <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label ?? "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="text-xs font-medium text-zinc-500 hover:text-brand-primary dark:text-zinc-400"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="overflow-x-auto bg-white p-3 font-mono text-xs leading-relaxed text-zinc-800 [font-variant-ligatures:none] dark:bg-zinc-950 dark:text-zinc-200"
      >
        {highlighted(code, language)}
      </pre>
    </div>
  );
}