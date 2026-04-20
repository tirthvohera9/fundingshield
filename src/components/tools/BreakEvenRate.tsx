'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { breakEvenFundingRate, getCurrentMMR, formatPercent } from '@/utils/calculations';

export function BreakEvenRate() {
  const { positionNotional, margin, exchange, fundingRate, holdingDays } = useCalculator();

  const [localNotional, setLocalNotional] = useState(positionNotional);
  const [localMargin, setLocalMargin] = useState(margin);
  const [localDays, setLocalDays] = useState(holdingDays);

  const mmr = getCurrentMMR(localNotional, exchange);
  const maxRate = breakEvenFundingRate(localNotional, localMargin, mmr, localDays);
  const currentRatePct = fundingRate * 100;
  const maxRatePct = maxRate * 100;
  const safetyRatio = maxRate > 0 ? fundingRate / maxRate : 0;

  return (
    <div className="card">
      <div style={{ padding: '24px' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>
          Break-Even Rate
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.6 }}>
          Maximum funding rate before your margin depletes
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Position Size (USDT)</div>
            <input
              type="number"
              value={localNotional}
              min={1}
              onChange={(e) => setLocalNotional(parseFloat(e.target.value) || 0)}
              className="input-field font-mono"
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Margin (USDT)</div>
            <input
              type="number"
              value={localMargin}
              min={0.01}
              onChange={(e) => setLocalMargin(parseFloat(e.target.value) || 0)}
              className="input-field font-mono"
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Holding Days</div>
            <input
              type="number"
              value={localDays}
              min={0.1}
              max={365}
              step={0.5}
              onChange={(e) => setLocalDays(parseFloat(e.target.value) || 1)}
              className="input-field font-mono"
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div
          style={{
            padding: '18px 22px',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${safetyRatio > 0.8 ? 'rgba(220, 38, 38, 0.3)' : safetyRatio > 0.5 ? 'rgba(202, 138, 4, 0.3)' : 'rgba(22, 163, 74, 0.3)'}`,
            background: `${safetyRatio > 0.8 ? 'rgba(220, 38, 38, 0.05)' : safetyRatio > 0.5 ? 'rgba(202, 138, 4, 0.05)' : 'rgba(22, 163, 74, 0.05)'}`,
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
            Max Safe Funding Rate
          </div>
          <div
            style={{
              fontSize: '1.4rem',
              fontFamily: 'monospace',
              fontWeight: 700,
              color: safetyRatio > 0.8 ? 'var(--red)' : safetyRatio > 0.5 ? 'var(--yellow)' : 'var(--green)',
            }}
          >
            {formatPercent(maxRate)} / 8hr
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '10px' }}>
            Current: <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text)' }}>{currentRatePct.toFixed(4)}%</span>
            {maxRate > 0 && (
              <span style={{ marginLeft: '12px', color: safetyRatio > 0.8 ? 'var(--red)' : 'var(--text-muted)' }}>
                ({(safetyRatio * 100).toFixed(0)}% of max)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
