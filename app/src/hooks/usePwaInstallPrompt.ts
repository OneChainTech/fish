"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
};

type InstallPromptVariant = "android" | "ios" | null;

const STORAGE_KEY = "pwa-install-prompt-dismissed";
const DISMISS_TTL_DAYS = 14;

function getStoredDismissedAt() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return null;
    }
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function storeDismissedNow() {
  try {
    window.localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // 忽略存储失败，避免影响主流程
  }
}

function shouldSkipPrompt(): boolean {
  const dismissedAt = getStoredDismissedAt();
  if (!dismissedAt) {
    return false;
  }
  const diff = Date.now() - dismissedAt;
  return diff < DISMISS_TTL_DAYS * 24 * 60 * 60 * 1000;
}

function isIos(deviceNavigator: Navigator) {
  const ua = deviceNavigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua);
}

function isStandaloneMode(deviceNavigator: Navigator) {
  return (
    // @ts-expect-error - Safari 独有属性
    (typeof deviceNavigator.standalone === "boolean" && deviceNavigator.standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function usePwaInstallPrompt() {
  const [deferredEvent, setDeferredEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [variant, setVariant] = useState<InstallPromptVariant>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (shouldSkipPrompt()) {
      return;
    }

    const navigatorRef = window.navigator;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      const promptEvent = event as BeforeInstallPromptEvent;
      setDeferredEvent(promptEvent);
      setVariant("android");
      setIsVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // iOS Safari 不会触发 beforeinstallprompt，单独处理
    if (isIos(navigatorRef) && !isStandaloneMode(navigatorRef)) {
      setVariant("ios");
      setIsVisible(true);
    }

    const handleAppInstalled = () => {
      setIsVisible(false);
      setDeferredEvent(null);
      storeDismissedNow();
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setDeferredEvent(null);
    storeDismissedNow();
  }, []);

  const triggerInstall = useCallback(async () => {
    if (variant === "android" && deferredEvent) {
      try {
        await deferredEvent.prompt();
        const choice = await deferredEvent.userChoice;
        if (choice.outcome === "accepted") {
          storeDismissedNow();
          setIsVisible(false);
        } else {
          storeDismissedNow();
          setIsVisible(false);
        }
      } catch {
        storeDismissedNow();
        setIsVisible(false);
      } finally {
        setDeferredEvent(null);
      }
    }
  }, [deferredEvent, variant]);

  return useMemo(
    () => ({
      isVisible,
      variant,
      triggerInstall,
      dismiss,
    }),
    [dismiss, isVisible, triggerInstall, variant]
  );
}
