'use client';

import { useCallback, useEffect, useRef } from 'react';

/* ─── Module-level session ID (stable for the entire browser tab lifetime) ─── */
let _sessionId: string | null = null;

function getSessionId(): string {
  if (_sessionId) return _sessionId;
  try {
    const KEY = 'fs_session_id';
    const stored = sessionStorage.getItem(KEY);
    if (stored) { _sessionId = stored; return stored; }
    const id = crypto.randomUUID();
    sessionStorage.setItem(KEY, id);
    _sessionId = id;
    return id;
  } catch {
    // SSR or storage blocked — fall back to a runtime-stable value
    _sessionId = crypto.randomUUID();
    return _sessionId;
  }
}

/* ─── Hook ─── */
export function useEvents(userId: string | null = null) {
  /* Debounce timers keyed by eventType — so each event type has its own timer */
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /* Clean up any pending timers on unmount */
  useEffect(() => {
    const t = timers.current;
    return () => { t.forEach(clearTimeout); t.clear(); };
  }, []);

  /**
   * Fire-and-forget event. Never throws, never blocks the UI thread.
   * All errors are swallowed — telemetry must not degrade the product.
   */
  const logEvent = useCallback(
    (eventType: string, data: Record<string, unknown> = {}) => {
      const sessionId = getSessionId();
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          data,
          sessionId,
          userId,
          timestamp: new Date().toISOString(),
        }),
      }).catch(() => { /* silently swallow — never crash the app */ });
    },
    [userId],
  );

  /**
   * Debounced variant. Useful for events that fire on every keystroke / slider tick.
   * Uses per-eventType timers so debouncing one event doesn't affect others.
   * @param delay  milliseconds to wait before firing (default: 1000ms)
   */
  const logEventDebounced = useCallback(
    (eventType: string, data: Record<string, unknown>, delay = 1000) => {
      const existing = timers.current.get(eventType);
      if (existing) clearTimeout(existing);

      const timer = setTimeout(() => {
        logEvent(eventType, data);
        timers.current.delete(eventType);
      }, delay);

      timers.current.set(eventType, timer);
    },
    [logEvent],
  );

  return { logEvent, logEventDebounced };
}
