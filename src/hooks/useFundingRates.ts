'use client';

import { useState, useCallback } from 'react';

interface BinancePremiumIndex {
  symbol: string;
  lastFundingRate: string;
  markPrice: string;
  nextFundingTime: number;
}

interface CachedRate {
  fundingRate: number;
  markPrice: number;
  nextFundingTime: number | null;
  ts: number;
}

const LS_KEY = 'fundingshield_rates';
const CACHE_TTL = 60_000; // 1 minute

function loadFromStorage(key: string): CachedRate | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw) as Record<string, CachedRate>;
    const entry = store[key];
    if (!entry || Date.now() - entry.ts > CACHE_TTL) return null;
    return entry;
  } catch {
    return null;
  }
}

function saveToStorage(key: string, data: CachedRate) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const store = raw ? (JSON.parse(raw) as Record<string, CachedRate>) : {};
    store[key] = data;
    localStorage.setItem(LS_KEY, JSON.stringify(store));
  } catch {
    // ignore storage errors
  }
}

export function useFundingRates() {
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = useCallback(
    async (
      _exchange: string,
      pair: string,
      onSuccess: (rate: number, markPrice: number) => void
    ) => {
      const cacheKey = pair.toUpperCase();

      // Return cached if fresh
      const cached = loadFromStorage(cacheKey);
      if (cached) {
        onSuccess(cached.fundingRate, cached.markPrice ?? 0);
        setLastUpdated(cached.ts);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const url = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${encodeURIComponent(pair.toUpperCase())}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = (await res.json()) as BinancePremiumIndex;
        const fundingRate = parseFloat(json.lastFundingRate) || 0;
        const markPrice = parseFloat(json.markPrice) || 0;
        const nextFundingTime = json.nextFundingTime ?? null;
        const ts = Date.now();

        onSuccess(fundingRate, markPrice);
        setLastUpdated(ts);
        saveToStorage(cacheKey, { fundingRate, markPrice, nextFundingTime, ts });
      } catch (err) {
        console.error('Funding rate fetch error:', err);
        setError('Could not fetch live rate — enter manually');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { fetchRate, loading, lastUpdated, error };
}
