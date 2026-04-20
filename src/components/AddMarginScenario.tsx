'use client';

import { useState, useEffect } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { formatUSD } from '@/utils/calculations';
import { useEvents } from '@/hooks/useEvents';

export function AddMarginScenario() {
  const { margin, additionalMargin, leverage, setScenarioData } = useCalculator();
  const { logEventDebounced } = useEvents();
  const maxSlider = Math.min(margin * 5, 50000);
  const sliderPct = maxSlider > 0 ? (additionalMargin / maxSlider) * 100 : 0;

  const [raw, setRaw] = useState(additionalMargin === 0 ? '' : String(additionalMargin));

  useEffect(() => {
    setRaw(additionalMargin === 0 ? '' : String(additionalMargin));
  }, [additionalMargin]);

  const commitValue = (v: number) => {
    const clamped = Math.max(0, Math.min(v, maxSlider));
    setScenarioData({ additionalMargin: clamped });
    if (clamped > 0) {
      logEventDebounced('margin_scenario_adjusted', {
        additionalMargin: clamped,
        currentMargin: margin,
        leverage,
      }, 1500);
    }
  };

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 24px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Margin Scenario
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '10px', display: 'block' }}>
              Additional Margin (USDT)
            </label>
            <input
              type="number"
              value={raw}
              min={0}
              max={maxSlider}
              placeholder="0"
              onChange={(e) => {
                const s = e.target.value;
                setRaw(s);
                if (s === '' || s === '0') {
                  setScenarioData({ additionalMargin: 0 });
                  return;
                }
                const v = parseFloat(s);
                if (!isNaN(v) && v >= 0) commitValue(v);
              }}
              onBlur={() => {
                const v = parseFloat(raw);
                if (isNaN(v) || v < 0) {
                  setRaw('');
                  setScenarioData({ additionalMargin: 0 });
                }
              }}
              className="input-field font-mono"
            />
          </div>

          <div>
            <div style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Slider: $0 to {formatUSD(maxSlider)}
            </div>
            <input
              type="range"
              min={0}
              max={maxSlider}
              step={Math.max(1, Math.floor(maxSlider / 200))}
              value={additionalMargin}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setScenarioData({ additionalMargin: v });
                setRaw(v === 0 ? '' : String(v));
              }}
              className="slider"
              style={{
                width: '100%',
                marginBottom: '12px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span>$0</span>
              <span>{formatUSD(maxSlider / 2)}</span>
              <span>{formatUSD(maxSlider)}</span>
            </div>
          </div>

          {additionalMargin > 0 && (
            <div style={{ fontSize: '0.95rem', color: 'var(--text)', padding: '14px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div style={{ marginBottom: '8px' }}>
                Current margin: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatUSD(margin)}</span>
              </div>
              <div>
                After adding: <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent)' }}>
                  {formatUSD(margin + additionalMargin)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
