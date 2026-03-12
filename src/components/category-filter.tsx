"use client";

import { cn } from "@/lib/utils";
import { CATEGORIES } from "@/lib/categories";
import type { Deal } from "@/types";

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
  deals: Deal[];
}

export function CategoryFilter({ selected, onChange, deals }: CategoryFilterProps) {
  const counts = new Map<string, number>();
  for (const deal of deals) {
    counts.set(deal.category, (counts.get(deal.category) || 0) + 1);
  }

  const activeCategories = CATEGORIES.filter(
    (cat) => cat.name === "Other" || (counts.get(cat.name) || 0) > 0
  );

  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar py-1 px-1">
      <button
        onClick={() => onChange("")}
        className={cn(
          "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
          !selected
            ? "bg-publix-green text-white"
            : "bg-white text-foreground border border-border hover:bg-gray-50"
        )}
      >
        All ({deals.length})
      </button>
      {activeCategories.map((cat) => {
        const count = counts.get(cat.name) || 0;
        if (count === 0) return null;

        return (
          <button
            key={cat.name}
            onClick={() => onChange(cat.name === selected ? "" : cat.name)}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
              cat.name === selected
                ? "bg-publix-green text-white"
                : "bg-white text-foreground border border-border hover:bg-gray-50"
            )}
          >
            {cat.icon} {cat.name} ({count})
          </button>
        );
      })}
    </div>
  );
}
