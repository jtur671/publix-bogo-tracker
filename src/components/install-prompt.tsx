"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("bogo-install-dismissed");
    if (stored) setDismissed(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("bogo-install-dismissed", "1");
  };

  return (
    <div className="bg-publix-green-light border border-publix-green/20 rounded-xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 bg-publix-green rounded-xl flex items-center justify-center flex-shrink-0">
        <Download size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Install App</p>
        <p className="text-xs text-muted">Add to home screen for quick access</p>
      </div>
      <button
        onClick={handleInstall}
        className="bg-publix-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
      >
        Install
      </button>
      <button onClick={handleDismiss} className="text-muted">
        <X size={16} />
      </button>
    </div>
  );
}
