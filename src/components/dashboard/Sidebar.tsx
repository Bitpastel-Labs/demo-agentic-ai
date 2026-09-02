"use client";

import { DOMAINS } from "@/lib/domains";

export default function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 flex-col bg-sidebar lg:flex">
      <div className="border-b border-sidebar-line px-6 py-5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-brand font-display text-sm font-semibold text-white">
            BI
          </span>
          <div>
            <p className="font-display text-[15px] font-semibold leading-tight text-white">
              Business Intelligence
            </p>
            <p className="text-[11px] text-sidebar-text">Store command center</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4">
        <a
          href="#overview"
          className="block rounded-md px-3 py-2 text-sm font-medium text-white transition hover:bg-white/5"
        >
          Overview
        </a>
        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-sidebar-text/70">
          Analysis
        </p>
        {DOMAINS.map((d) => (
          <a
            key={d.key}
            href={`#${d.key}-analysis`}
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-sidebar-text transition hover:bg-white/5 hover:text-white"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: d.color }} aria-hidden />
            {d.label}
          </a>
        ))}
      </nav>

      <div className="border-t border-sidebar-line px-6 py-4">
        <p className="text-[11px] text-sidebar-text">
          One agent. Four domains.
          <br />
          Nothing else.
        </p>
      </div>
    </aside>
  );
}
