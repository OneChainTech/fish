"use client";

import { useEffect } from "react";
import { useFishStore } from "@/store/useFishStore";

const STORAGE_PHONE_KEY = "fish-user-phone";
const STORAGE_USER_KEY = "fish-user-id";

export function ClientBootstrap() {
  const setUserId = useFishStore((state) => state.setUserId);
  const setUserPhone = useFishStore((state) => state.setUserPhone);
  const setIsLoggedIn = useFishStore((state) => state.setIsLoggedIn);
  const resetUser = useFishStore((state) => state.resetUser);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPhone = window.localStorage.getItem(STORAGE_PHONE_KEY);
    const savedUserId = window.localStorage.getItem(STORAGE_USER_KEY);

    if (savedPhone && savedUserId) {
      setUserId(savedUserId);
      setUserPhone(savedPhone);
      setIsLoggedIn(true);
    } else {
      resetUser();
    }
  }, [setUserId, setUserPhone, setIsLoggedIn, resetUser]);

  useEffect(() => {
    const onStorage = () => {
      try {
        const savedPhone = window.localStorage.getItem(STORAGE_PHONE_KEY);
        const savedUserId = window.localStorage.getItem(STORAGE_USER_KEY);
        if (savedPhone && savedUserId) {
          setUserId(savedUserId);
          setUserPhone(savedPhone);
          setIsLoggedIn(true);
        } else {
          resetUser();
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setUserId, setUserPhone, setIsLoggedIn, resetUser]);

  return null;
}
