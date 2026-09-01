"use client";

import { useState, type ReactNode } from "react";

interface AccordionProps {
  title: string;
  children: ReactNode;
  onFirstOpen?: () => void;
}

export default function Accordion({ title, children, onFirstOpen }: AccordionProps) {
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
    <div className="rounded-xl border border-slate-800 bg-slate-900/60">
      <button
        onClick={toggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-slate-200">{title}</span>
        <span
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open && <div className="border-t border-slate-800 px-5 py-4">{children}</div>}
    </div>
  );
}
