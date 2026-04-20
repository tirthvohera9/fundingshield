'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { positionSizeFromRisk, formatUSD } from '@/utils/calculations';

export function PositionSizer() {
  const { entryPrice, leverage } = useCalculator();

  const [accountSize, setAccountSize] = useState(10000);
  const [maxLossPct, setMaxLossPct] = useState(2);
  const [localEntry, setLocalEntry] = useState(entryPrice);
  const [stopLoss, setStopLoss] = useState(entryPrice * 0.97);
  const [localLeverage, setLocalLeverage] = useState(leverage);

  const { positionSize, margin, riskAmount } = positionSizeFromRisk(
    accountSize,
    maxLossPct,
    localEntry,
    stopLoss,
    localLeverage
  );

  const stopPct =
    localEntry > 0
      ? (Math.abs(localEntry - stopLoss) / localEntry) * 100
      : 0;

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          Position Sizer
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.6 }}>
          Risk-based sizing — never risk more than you set
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Account Size (USDT)</div>
            <input
              type="number"
              value={accountSize}
              min={1}
              onChange={(e) => setAccountSize(parseFloat(e.target.value) || 0)}
              className="input-field font-mono"
              style={{ width: '100%' }}
            />
          </label>

          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '12px', fontWeight: 600 }}>
              Max Loss: <span style={{ color: maxLossPct > 3 ? 'var(--red)' : 'var(--text)', fontWeight: 700 }}>{maxLossPct}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={maxLossPct}
              onChange={(e) => setMaxLossPct(parseFloat(e.target.value))}
              className="slider"
              style={{ width: '100%' }}
            />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>Entry Price</div>
              <input
                type="number"
                value={localEntry}
                min={0.001}
                onChange={(e) => setLocalEntry(parseFloat(e.target.value) || 0)}
                className="input-field font-mono"
                style={{ width: '100%' }}
              />
            </label>
            <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
              <div style={{ marginBottom: '8px', fontWeight: 600 }}>Stop Loss</div>
              <input
                type="number"
                value={stopLoss}
                min={0.001}
                onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                className="input-field font-mono"
                style={{ width: '100%' }}
              />
            </label>
          </div>

          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Leverage</div>
            <input
              type="number"
              value={localLeverage}
              min={0.1}
              max={200}
              step={0.5}
              onChange={(e) => setLocalLeverage(parseFloat(e.target.value) || 1)}
              className="input-field font-mono"
              style={{ width: '100%' }}
            />
          </label>
        </div>

        <div
          style={{
            padding: '18px 22px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Position Size</span>
            <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
              {formatUSD(positionSize)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: '10px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Required Margin</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
              {formatUSD(margin)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Max Risk Amount</span>
            <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--red)', fontWeight: 700 }}>
              {formatUSD(riskAmount)}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '8px' }}>
            Stop distance: {stopPct.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
