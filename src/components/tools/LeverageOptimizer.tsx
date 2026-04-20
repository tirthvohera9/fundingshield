'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { maxSafeLeverage, formatUSD } from '@/utils/calculations';

export function LeverageOptimizer() {
  const { positionNotional, fundingRate, holdingDays, exchange } = useCalculator();

  const [localNotional, setLocalNotional] = useState(positionNotional);
  const [localRate, setLocalRate] = useState(fundingRate * 100);
  const [localDays, setLocalDays] = useState(holdingDays);
  const [bufferPct, setBufferPct] = useState(5);

  const { leverage, requiredMargin } = maxSafeLeverage(
    localNotional,
    localRate / 100,
    localDays,
    exchange,
    bufferPct / 100
  );

  const levelColor =
    leverage >= 10 ? 'var(--red)' : leverage >= 5 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '16px' }}>
          Leverage Optimizer
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '20px', lineHeight: 1.6 }}>
          Maximum safe leverage given funding and holding period
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
            <div style={{ marginBottom: '8px', fontWeight: 600 }}>Funding Rate (% / 8hr)</div>
            <input
              type="number"
              value={localRate}
              min={0}
              step={0.001}
              onChange={(e) => setLocalRate(parseFloat(e.target.value) || 0)}
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

          <label style={{ fontSize: '0.95rem', color: 'var(--text)' }}>
            <div style={{ marginBottom: '12px', fontWeight: 600 }}>
              Safety Buffer: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{bufferPct}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={bufferPct}
              onChange={(e) => setBufferPct(parseInt(e.target.value))}
              className="slider"
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
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
            Max Safe Leverage
          </div>
          <div style={{ fontSize: '1.6rem', fontFamily: 'monospace', fontWeight: 700, color: levelColor, marginBottom: '12px' }}>
            {leverage.toFixed(1)}×
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Min required margin:{' '}
            <span style={{ color: 'var(--text)', fontFamily: 'monospace', fontWeight: 600 }}>
              {formatUSD(requiredMargin)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
