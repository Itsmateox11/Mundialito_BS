"use client";

import { useId, useState } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Tab {
  label: string;
  rows: Array<{ label: string; value: string }>;
}

export function ProfileTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const baseId = useId();
  const current = tabs[active];

  return (
    <Card className="overflow-hidden">
      <div
        role="tablist"
        aria-label="Secciones del perfil"
        className="flex overflow-x-auto border-b border-hairline scrollbar-slim"
      >
        {tabs.map((tab, i) => {
          const selected = active === i;
          return (
            <button
              key={tab.label}
              type="button"
              role="tab"
              id={`${baseId}-tab-${i}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${i}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(i)}
              className={cn(
                "shrink-0 border-b-[3px] px-6 py-[18px] text-[15px] font-semibold transition-colors",
                selected
                  ? "border-red text-navy"
                  : "border-transparent text-ink-muted hover:text-navy",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        key={active}
        role="tabpanel"
        id={`${baseId}-panel-${active}`}
        aria-labelledby={`${baseId}-tab-${active}`}
        className="grid animate-rise-in-fast gap-x-[30px] gap-y-[22px] px-6 pb-8 pt-7 md:grid-cols-2 md:px-[30px]"
      >
        {current.rows.map((row) => (
          <div key={row.label} className="border-b border-hairline-soft pb-3.5">
            <div className="eyebrow tracking-[.14em] text-ink-muted">
              {row.label}
            </div>
            <div className="mt-1.5 text-base font-medium text-navy">
              {row.value}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
