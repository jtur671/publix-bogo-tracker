"use client";

import { useState, useEffect } from "react";
import { Bell, BellOff } from "lucide-react";

export function PushManager() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(async (reg) => {
        const sub = await reg.pushManager.getSubscription();
        setSubscribed(!!sub);
      });
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        alert("Push notifications not configured. Add VAPID keys to .env.local");
        return;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      await fetch("/api/push-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setSubscribed(true);
    } catch (err) {
      console.error("Push subscription failed:", err);
      alert("Failed to enable notifications. Check browser permissions.");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push-subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Unsubscribe failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 text-sm text-muted">
        Push notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {subscribed ? (
            <Bell size={20} className="text-publix-green" />
          ) : (
            <BellOff size={20} className="text-muted" />
          )}
          <div>
            <p className="text-sm font-medium">
              Push Notifications
            </p>
            <p className="text-xs text-muted">
              {subscribed
                ? "You'll be notified when list items go on sale"
                : "Get alerts when your list items are on deal"}
            </p>
          </div>
        </div>
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className={`text-xs font-semibold px-4 py-2 rounded-lg transition-colors ${
            subscribed
              ? "bg-gray-100 text-foreground hover:bg-gray-200"
              : "bg-publix-green text-white hover:bg-publix-green-dark"
          } disabled:opacity-50`}
        >
          {loading ? "..." : subscribed ? "Disable" : "Enable"}
        </button>
      </div>
    </div>
  );
}
