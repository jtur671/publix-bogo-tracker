"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistButtonProps {
  isWatched: boolean;
  onClick: () => void;
  size?: "sm" | "md";
}

export function WatchlistButton({
  isWatched,
  onClick,
  size = "sm",
}: WatchlistButtonProps) {
  const iconSize = size === "sm" ? 16 : 20;

  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full flex items-center justify-center transition-all",
        size === "sm" ? "w-8 h-8" : "w-10 h-10",
        isWatched
          ? "bg-red-50 hover:bg-red-100"
          : "bg-gray-100 hover:bg-gray-200"
      )}
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Heart
        size={iconSize}
        className={cn(
          isWatched ? "fill-danger text-danger" : "text-muted"
        )}
      />
    </button>
  );
}
