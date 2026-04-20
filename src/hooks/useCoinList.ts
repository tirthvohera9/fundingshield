'use client';

import { useState, useEffect } from 'react';
import { CRYPTO_PAIRS } from '@/data/cryptoPairs';

const SS_KEY = 'fundingshield_coins_v2';
const SS_TTL = 30 * 60 * 1000; // 30 minutes

interface BinanceSymbol {
  symbol: string;
  contractType: string;
  quoteAsset: string;
  status: string;
}

// Popular coins shown at the top of sorted results
const PRIORITY = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT','DOGEUSDT','ADAUSDT','AVAXUSDT','LINKUSDT','DOTUSDT'];

function sortCoins(coins: string[]): string[] {
  const priority = PRIORITY.filter((p) => coins.includes(p));
  const rest = coins.filter((c) => !PRIORITY.includes(c)).sort();
  return [...priority, ...rest];
}

export function useCoinList() {
  const [coins, setCoins] = useState<string[]>(CRYPTO_PAIRS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // 1. Try sessionStorage cache first
    try {
      const raw = sessionStorage.getItem(SS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { data: string[]; ts: number };
        if (Date.now() - parsed.ts < SS_TTL && parsed.data?.length > 50) {
          setCoins(parsed.data);
          return;
        }
      }
    } catch {
      // ignore
    }

    setLoading(true);

    const persist = (list: string[]) => {
      setCoins(list);
      try {
        sessionStorage.setItem(SS_KEY, JSON.stringify({ data: list, ts: Date.now() }));
      } catch {
        // ignore
      }
    };

    // 2. Try server route first (volume-sorted, ~200ms on Vercel edge)
    fetch('/api/coins', { signal: AbortSignal.timeout(4000) })
      .then(async (r) => {
        if (!r.ok) throw new Error('server route failed');
        const json = (await r.json()) as { coins?: string[] };
        if (json.coins && json.coins.length > 50) {
          persist(json.coins);
          setLoading(false);
          return;
        }
        throw new Error('empty response');
      })
      .catch(() => {
        // 3. Fallback: fetch Binance exchangeInfo directly from browser (CORS-enabled)
        fetch('https://fapi.binance.com/fapi/v1/exchangeInfo', {
          signal: AbortSignal.timeout(10000),
        })
          .then(async (r) => {
            const json = (await r.json()) as { symbols: BinanceSymbol[] };
            const list = sortCoins(
              json.symbols
                .filter(
                  (s) =>
                    s.contractType === 'PERPETUAL' &&
                    s.quoteAsset === 'USDT' &&
                    s.status === 'TRADING'
                )
                .map((s) => s.symbol)
            );
            if (list.length > 10) persist(list);
          })
          .catch(() => {
            // keep static fallback — do nothing
          })
          .finally(() => setLoading(false));
      });
  }, []);

  return { coins, loading };
}
