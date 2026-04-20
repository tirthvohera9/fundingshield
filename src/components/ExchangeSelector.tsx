'use client';

import { useCalculator } from '@/hooks/useCalculator';

const EXCHANGES = [
  { value: 'binance', label: 'Binance' },
  { value: 'bybit', label: 'Bybit' },
  { value: 'okx', label: 'OKX' },
  { value: 'coindcx', label: 'CoinDCX' },
] as const;

export function ExchangeSelector() {
  const { exchange, setPositionData } = useCalculator();

  return (
    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
      {EXCHANGES.map((ex) => (
        <button
          key={ex.value}
          onClick={() => setPositionData({ exchange: ex.value })}
          style={{
            padding: '7px 16px',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 500,
            border: `1px solid ${exchange === ex.value ? 'rgba(255,255,255,0.4)' : 'var(--border)'}`,
            background: exchange === ex.value ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: exchange === ex.value ? 'var(--text)' : 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 0.25s var(--ease-spring)',
            letterSpacing: '0.02em',
          }}
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}
