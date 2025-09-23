"use client";

import { useEffect } from "react";
import { useAnonUser } from "@/hooks/useAnonUser";
import { useFishStore } from "@/store/useFishStore";

export function ClientBootstrap() {
  const anonId = useAnonUser();
  const setUserId = useFishStore((state) => state.setUserId);

  useEffect(() => {
    if (anonId) {
      setUserId(anonId);
    }
  }, [anonId, setUserId]);

  return null;
}
