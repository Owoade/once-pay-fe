"use client";

import { useEffect, useState } from "react";

// Table of contents for the docs page: click = smooth scroll, the active
// entry tracks the section currently in view. Desktop gets the right-hand
// rail; mobile gets a hamburger that toggles a dropdown of the same sections.

const sections = [
  { id: "authentication", label: "1. Authentication" },
  { id: "initiate", label: "2. Initiate a transaction" },
  { id: "list", label: "3. List your transactions" },
  { id: "verify", label: "4. Verify a transaction" },
  { id: "webhooks", label: "5. Webhooks" },
  { id: "response-format", label: "6. Response format" },
  { id: "js-sdk", label: "7. JS Client SDK" },
];

const menu_link_class = (is_active: boolean) =>
  `block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
    is_active
      ? "bg-brand-primary/10 font-medium text-brand-primary dark:text-brand-accent"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
  }`;

function scrollToSection(id: string) {
  document
    .getElementById(id)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function useActiveSection() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    function on_scroll() {
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 120) current = section.id;
      }
      setActive(current);
    }
    window.addEventListener("scroll", on_scroll, { passive: true });
    on_scroll();
    return () => window.removeEventListener("scroll", on_scroll);
  }, []);

  return active;
}

// Mobile-only: hamburger in the docs header that opens the section list as a
// dropdown panel. The docs header must be `relative` so the panel anchors to it.
export function DocsMobileNav() {
  const [open, setOpen] = useState(false);
  const active = useActiveSection();

  useEffect(() => {
    if (!open) return;
    const on_key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", on_key);
    return () => window.removeEventListener("keydown", on_key);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(new_open => !new_open)}
        aria-label={open ? "Close menu" : "Open section menu"}
        aria-expanded={open}
        className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
          open
            ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
        }`}
      >
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-5 w-5" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav
          aria-label="Table of contents"
          className="absolute inset-x-0 top-full z-20 border-b border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          <ul className="mx-auto max-w-5xl px-4 py-3">
            {sections.map(section => (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => {
                    scrollToSection(section.id);
                    setOpen(false);
                  }}
                  className={menu_link_class(section.id === active)}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}

// Right-hand table of contents for the docs page: click = smooth scroll,
// the active entry tracks the section currently in view.

export default function DocsToc() {
  const [active, setActive] = useState(sections[0].id);

  useEffect(() => {
    function on_scroll() {
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el && el.getBoundingClientRect().top <= 120) current = section.id;
      }
      setActive(current);
    }
    window.addEventListener("scroll", on_scroll, { passive: true });
    on_scroll();
    return () => window.removeEventListener("scroll", on_scroll);
  }, []);

  return (
    <nav
      className="sticky top-20 hidden w-44 shrink-0 self-start lg:block"
      aria-label="Table of contents"
    >
      <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        On this page
      </p>
      <ul className="mt- flex flex-col gap-0.5 border-l border-zinc-200 dark:border-zinc-800">
        {sections.map((section) => (
          <li key={section.id}>
            <button
              type="button"
              onClick={() =>
                document
                  .getElementById(section.id)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" })
              }
              className={`-ml-px block w-full border-l-2 py-1 pl-3 text-left text-xs transition-colors ${
                active === section.id
                  ? "border-brand-primary font-medium text-brand-primary dark:text-brand-accent"
                  : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {section.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}