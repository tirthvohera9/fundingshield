'use client';

import { useState, useEffect, useRef } from 'react';

export function useMarkPrice(symbol: string | null) {
  const [price, setPrice] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const mountedRef = useRef(true);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    if (!symbol) return;

    const sym = symbol.toLowerCase();

    function connect() {
      if (!mountedRef.current) return;
      const ws = new WebSocket(`wss://fstream.binance.com/ws/${sym}@markPrice@1s`);
      wsRef.current = ws;

      ws.onopen = () => { if (mountedRef.current) setConnected(true); };
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data as string);
          if (data.p && mountedRef.current) setPrice(parseFloat(data.p));
        } catch {}
      };
      ws.onerror = () => ws.close();
      ws.onclose = () => {
        if (mountedRef.current) {
          setConnected(false);
          timerRef.current = setTimeout(connect, 3000);
        }
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [symbol]);

  return { price, connected };
}
