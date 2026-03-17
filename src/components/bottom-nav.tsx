"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, Tag, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/app", label: "List", icon: ListChecks, mobileOnly: true },
  { href: "/deals", label: "Deals", icon: Tag },
  { href: "/history", label: "History", icon: Clock },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function BottomNav({ listMatchCount, hasNewDeals }: { listMatchCount?: number; hasNewDeals?: boolean }) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border safe-bottom z-50">
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          const showBadge = tab.href === "/app" && (listMatchCount ?? 0) > 0;
          const showDot = tab.href === "/deals" && hasNewDeals;
          const disabled = tab.mobileOnly && !isMobile;

          // Hide mobile-only tabs on desktop
          if (disabled) return null;

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
                    {listMatchCount}
                  </span>
                )}
                {showDot && (
                  <span className="absolute -top-0.5 -right-1 bg-publix-green rounded-full w-2 h-2" />
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
