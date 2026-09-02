"use client";

import { useState, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  color: string;
  id?: string;
  children: ReactNode;
  onFirstOpen?: () => void;
}

export default function Accordion({ title, color, id, children, onFirstOpen }: AccordionProps) {
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);

  const toggle = () => {
    if (!opened) {
      setOpened(true);
      onFirstOpen?.();
    }
    setOpen((o) => !o);
  };

  return (
    <div
      id={id}
      className="scroll-mt-24 overflow-hidden rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
    >
      <button
        onClick={toggle}
        className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-ground/60 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
        aria-expanded={open}
      >
        <span className="h-5 w-1 rounded-full" style={{ backgroundColor: color }} aria-hidden />
        <span className="text-sm font-semibold text-ink">{title}</span>
        <svg
          className={`ml-auto h-4 w-4 text-ink-faint transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <div className="border-t border-line px-5 py-4">{children}</div>}
    </div>
  );
}
