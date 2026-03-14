"use client";

import { useState, useEffect, useCallback } from "react";

const LOCAL_KEY = "publix-email";

export function usePublixAccount() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    if (stored) setEmail(stored);
  }, []);

  const saveEmail = useCallback((newEmail: string) => {
    localStorage.setItem(LOCAL_KEY, newEmail);
    setEmail(newEmail);
  }, []);

  const clearEmail = useCallback(() => {
    localStorage.removeItem(LOCAL_KEY);
    setEmail(null);
  }, []);

  return { email, hasEmail: email !== null, saveEmail, clearEmail };
}
