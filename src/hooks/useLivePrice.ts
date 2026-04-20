'use client';

import { useState, useEffect, useRef } from 'react';

const BINANCE_BASE = 'https://api.binance.com/api/v3/ticker/price';

async function fetchPrice(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`${BINANCE_BASE}?symbol=${encodeURIComponent(symbol)}`);
    if (!res.ok) return null;
    const data = await res.json() as { price: string };
    return parseFloat(data.price) || null;
  } catch {
    return null;
  }
}

/** Polls Binance public REST every 5s for a live price. Cleans up on unmount. */
export function useLivePrice(symbol: string | null) {
  const [price, setPrice] = useState<number | null>(null);
  const [error, setError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!symbol) { setPrice(null); return; }

    const poll = async () => {
      const p = await fetchPrice(symbol);
      if (p !== null) { setPrice(p); setError(false); }
      else setError(true);
    };

    poll();
    intervalRef.current = setInterval(poll, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [symbol]);

  return { price, error };
}

/** Compute unrealised P&L for a saved position */
export function computePnl(
  entryPrice: number,
  currentPrice: number,
  positionNotional: number,
  isLong: boolean
): number {
  const priceDelta = isLong ? currentPrice - entryPrice : entryPrice - currentPrice;
  return (priceDelta / entryPrice) * positionNotional;
}
