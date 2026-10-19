"use client";

import { useEffect, useState } from "react";

// Right-hand table of contents for the docs page: click = smooth scroll,
// the active entry tracks the section currently in view.
const sections = [
  { id: "authentication", label: "1. Authentication" },
  { id: "initiate", label: "2. Initiate a transaction" },
  { id: "list", label: "3. List your transactions" },
  { id: "verify", label: "4. Verify a transaction" },
  { id: "webhooks", label: "5. Webhooks" },
  { id: "response-format", label: "6. Response format" },
];

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