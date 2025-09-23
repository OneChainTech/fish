"use client";

import { useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

const STORAGE_KEY = "fish-anon-id";

export function useAnonUser() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setUserId(saved);
      return;
    }
    const nextId = uuid();
    window.localStorage.setItem(STORAGE_KEY, nextId);
    setUserId(nextId);
  }, []);

  return userId;
}
