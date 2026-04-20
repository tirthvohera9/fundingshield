'use client';

import { useState, useEffect } from 'react';

export interface FundingRecord {
  time: number;
  rate: number; // % per 8hr (already multiplied by 100)
}

const HIST_TTL = 3600_000; // 1 hour

export function useFundingHistory(pair: string | null) {
  const [history, setHistory] = useState<FundingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pair) return;
    const sym = pair.toUpperCase();
    const cacheKey = `fs_fhist_${sym}`;

    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (raw) {
        const { data, ts } = JSON.parse(raw) as { data: FundingRecord[]; ts: number };
        if (Date.now() - ts < HIST_TTL) {
          setHistory(data);
          return;
        }
      }
    } catch {}

    setLoading(true);
    setError(null);

    fetch(`/api/funding-history?symbol=${sym}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json: { fundingRate: string; fundingTime: number }[]) => {
        const records: FundingRecord[] = json.map((item) => ({
          time: item.fundingTime,
          rate: parseFloat(item.fundingRate) * 100,
        }));
        setHistory(records);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data: records, ts: Date.now() }));
        } catch {}
      })
      .catch((err) => {
        console.error('Funding history error:', err);
        setError('Could not load funding history');
      })
      .finally(() => setLoading(false));
  }, [pair]);

  return { history, loading, error };
}
