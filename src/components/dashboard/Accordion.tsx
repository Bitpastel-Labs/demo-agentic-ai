"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { OPEN_ANALYSIS_EVENT } from "@/lib/analysisNav";

interface AccordionProps {
  title: string;
  color: string;
  id?: string;
  children: ReactNode;
  onFirstOpen?: () => void;
}

export default function Accordion({ title, color, id, children, onFirstOpen }: AccordionProps) {
  const [open, setOpen] = useState(false);
  const openedRef = useRef(false);
  const firstOpenRef = useRef(onFirstOpen);
  useEffect(() => {
    firstOpenRef.current = onFirstOpen;
  }, [onFirstOpen]);

  const openNow = () => {
    if (!openedRef.current) {
      openedRef.current = true;
      firstOpenRef.current?.();
    }
    setOpen(true);
  };

  const toggle = () => (open ? setOpen(false) : openNow());

  useEffect(() => {
    if (!id) return;
    const onOpenRequest = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) return;
      if (!openedRef.current) {
        openedRef.current = true;
        firstOpenRef.current?.();
      }
      setOpen(true);
    };
    window.addEventListener(OPEN_ANALYSIS_EVENT, onOpenRequest);
    return () => window.removeEventListener(OPEN_ANALYSIS_EVENT, onOpenRequest);
  }, [id]);

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
      {/* Height animates via grid rows (0fr -> 1fr); content stays mounted so lazy-loaded data is kept. */}
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
      >
        <div className="min-h-0 overflow-hidden">
          <div
            inert={!open}
            className={`border-t border-line px-5 py-4 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
