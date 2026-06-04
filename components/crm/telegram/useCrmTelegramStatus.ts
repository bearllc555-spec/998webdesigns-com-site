"use client";

import { useCallback, useEffect, useState } from "react";
import type { TelegramStatus } from "@/components/crm/telegram/types";

export function useCrmTelegramStatus() {
  const [status, setStatus] = useState<TelegramStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyStatus = useCallback((data: TelegramStatus) => {
    setStatus(data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/crm/telegram", { credentials: "include" });
      if (res.status === 401) {
        window.location.href = "/crm/login";
        return;
      }
      if (!res.ok) throw new Error("Failed to load");
      applyStatus((await res.json()) as TelegramStatus);
    } catch {
      setError("Could not load Telegram settings.");
    } finally {
      setLoading(false);
    }
  }, [applyStatus]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    status,
    loading,
    message,
    error,
    setMessage,
    setError,
    load,
    applyStatus,
  };
}
