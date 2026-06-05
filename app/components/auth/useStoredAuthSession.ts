"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AUTH_SESSION_STORAGE_KEY,
  AUTH_SESSION_UPDATED_EVENT,
  clearStoredAuthSession,
  readStoredAuthSession,
  storeAuthSession,
  type AuthSession,
} from "@/services/auth";

export function useStoredAuthSession() {
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  const reloadSession = useCallback(() => {
    setAuthSession(readStoredAuthSession());
    setSessionReady(true);
  }, []);

  useEffect(() => {
    const sessionLoadId = window.setTimeout(reloadSession, 0);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === AUTH_SESSION_STORAGE_KEY) {
        reloadSession();
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, reloadSession);

    return () => {
      window.clearTimeout(sessionLoadId);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, reloadSession);
    };
  }, [reloadSession]);

  const persistSession = useCallback((session: AuthSession) => {
    setAuthSession(session);
    setSessionReady(true);
    storeAuthSession(session);
  }, []);

  const clearSession = useCallback(() => {
    setAuthSession(null);
    setSessionReady(true);
    clearStoredAuthSession();
  }, []);

  return {
    authSession,
    clearSession,
    persistSession,
    reloadSession,
    sessionReady,
    setAuthSession,
  };
}
