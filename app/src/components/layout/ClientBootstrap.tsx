"use client";

import { useEffect } from "react";
import { useAnonUser } from "@/hooks/useAnonUser";
import { useFishStore } from "@/store/useFishStore";

const STORAGE_PHONE_KEY = "fish-user-phone";
const STORAGE_USER_KEY = "fish-anon-id";

export function ClientBootstrap() {
  const anonId = useAnonUser();
  const setUserId = useFishStore((state) => state.setUserId);
  const setUserPhone = useFishStore((state) => state.setUserPhone);
  const setIsLoggedIn = useFishStore((state) => state.setIsLoggedIn);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPhone = window.localStorage.getItem(STORAGE_PHONE_KEY);
    const savedUserId = window.localStorage.getItem(STORAGE_USER_KEY);
    
    // 检查是否已登录（用户ID是手机号格式）
    if (savedPhone && savedUserId && savedUserId === savedPhone) {
      setUserId(savedUserId);
      setUserPhone(savedPhone);
      setIsLoggedIn(true);
    } else if (anonId) {
      // 使用匿名用户ID
      setUserId(anonId);
      setUserPhone(null);
      setIsLoggedIn(false);
    }
  }, [anonId, setUserId, setUserPhone, setIsLoggedIn]);

  // 当本地登录状态变化时（localStorage被写入），同步一次store
  useEffect(() => {
    const onStorage = () => {
      try {
        const savedPhone = window.localStorage.getItem(STORAGE_PHONE_KEY);
        const savedUserId = window.localStorage.getItem(STORAGE_USER_KEY);
        if (savedPhone && savedUserId && savedUserId === savedPhone) {
          setUserId(savedUserId);
          setUserPhone(savedPhone);
          setIsLoggedIn(true);
        }
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [setUserId, setUserPhone, setIsLoggedIn]);

  return null;
}
