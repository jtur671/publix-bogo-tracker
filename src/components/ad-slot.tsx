"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

type AdFormat = "horizontal" | "rectangle" | "auto";

interface AdSlotProps {
  slot: string;
  format?: AdFormat;
  dismissible?: boolean;
  className?: string;
}

const FORMAT_MAP: Record<AdFormat, string> = {
  horizontal: "horizontal",
  rectangle: "rectangle",
  auto: "auto",
};

export function AdSlot({ slot, format = "auto", dismissible = false, className = "" }: AdSlotProps) {
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (pushed.current || dismissed) return;
    try {
      const adsbygoogle = (window as any).adsbygoogle || [];
      adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // AdSense not loaded yet — no-op
    }
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <div className="flex items-center gap-1 mb-1">
        <span className="text-[10px] text-muted">Ad</span>
        {dismissible && (
          <button
            onClick={() => setDismissed(true)}
            className="text-muted hover:text-foreground p-0.5 rounded transition-colors"
            aria-label="Close ad"
          >
            <X size={12} />
          </button>
        )}
      </div>
      <ins
        ref={adRef}
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client="ca-pub-XXXXXXX"
        data-ad-slot={slot}
        data-ad-format={FORMAT_MAP[format]}
        data-full-width-responsive="true"
      />
    </div>
  );
}
