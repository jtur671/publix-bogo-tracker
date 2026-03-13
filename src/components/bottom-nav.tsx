"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Tag, Heart, ShoppingCart, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/watchlist", label: "Watchlist", icon: Heart },
  { href: "/shop", label: "Shop", icon: ShoppingCart },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav({ watchlistMatchCount }: { watchlistMatchCount?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          const showBadge = tab.href === "/app" && (watchlistMatchCount ?? 0) > 0;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 w-14 py-1 relative",
                isActive ? "text-publix-green" : "text-muted"
              )}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-danger text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {watchlistMatchCount}
                  </span>
                )}
              </div>
              <span className={cn("text-[10px]", isActive && "font-semibold")}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
