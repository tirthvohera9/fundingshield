'use client';

import { useState, useEffect } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { useFundingRates } from '@/hooks/useFundingRates';
import { useEvents } from '@/hooks/useEvents';

type DurationUnit = 'days' | 'hours';

export function FundingFeeInput() {
  const { exchange, pair, fundingRate, holdingDays, setScenarioData } = useCalculator();
  const { fetchRate, loading, lastUpdated, error } = useFundingRates();
  const { logEvent } = useEvents();

  const [unit, setUnit] = useState<DurationUnit>('days');
  const [rawRate, setRawRate] = useState(fundingRate === 0 ? '' : (fundingRate * 100).toFixed(4));

  useEffect(() => {
    setRawRate(fundingRate === 0 ? '' : (fundingRate * 100).toFixed(4));
  }, [fundingRate]);

  const fundingPct = (fundingRate * 100).toFixed(4);
  const displayDuration = Math.round((unit === 'hours' ? holdingDays * 24 : holdingDays) * 10) / 10;

  const handleFetchLive = () => {
    fetchRate(exchange, pair, (rate) => {
      setScenarioData({ fundingRate: rate });
      logEvent('funding_rate_fetched', { pair, rate: rate * 100 });
    });
  };

  const handleDurationChange = (displayVal: number) => {
    const days = unit === 'hours' ? displayVal / 24 : displayVal;
    if (days > 0 && days <= 999) setScenarioData({ holdingDays: days });
  };

  const secondsAgo = lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : null;

  const dayQuickSelect = [1, 3, 5, 7, 14, 30];
  const hourQuickSelect = [1, 4, 8, 12, 24, 48];

  const isQuickSelected = (val: number) => {
    if (unit === 'days') return holdingDays === val;
    return Math.abs(holdingDays * 24 - val) < 0.01;
  };

  return (
    <div className="card">
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            Funding Parameters
          </h2>
          <button
            onClick={handleFetchLive}
            disabled={loading}
            style={{
              padding: '8px 14px',
              fontSize: '0.85rem',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              background: 'transparent',
              color: loading ? 'var(--text-muted)' : 'var(--accent)',
              fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.2s',
              opacity: loading ? 0.6 : 1,
            }}
            title="Fetch live funding rate"
          >
            {loading ? '⏳ Fetching…' : '⚡ Live Rate'}
          </button>
        </div>

        {(secondsAgo !== null || error) && (
          <div style={{ fontSize: '0.85rem', marginBottom: '16px', color: error ? 'var(--yellow)' : 'var(--text-muted)' }}>
            {error ? `⚠️ ${error}` : `✓ Updated ${secondsAgo}s ago`}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Funding Rate */}
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Funding Rate (% per 8hr)
              <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                3 settlements/day
              </span>
            </label>
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <input
                type="number"
                value={rawRate}
                step={0.001}
                min={-0.1}
                max={10}
                placeholder=""
                onChange={(e) => {
                  const s = e.target.value;
                  setRawRate(s);
                  const v = parseFloat(s);
                  if (!isNaN(v) && v >= -0.1 && v <= 10) {
                    setScenarioData({ fundingRate: v / 100 });
                  } else if (s === '') {
                    setScenarioData({ fundingRate: 0 });
                  }
                }}
                onBlur={() => {
                  const v = parseFloat(rawRate);
                  if (isNaN(v)) {
                    setRawRate('');
                    setScenarioData({ fundingRate: 0 });
                  }
                }}
                className="input-field font-mono"
                style={{ paddingRight: '40px' }}
              />
              <span style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.95rem',
                pointerEvents: 'none',
                fontWeight: 500,
              }}>%</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[0.01, 0.03, 0.05, 0.08, 0.1].map((r) => (
                <button
                  key={r}
                  onClick={() => setScenarioData({ fundingRate: r / 100 })}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    border: `1px solid ${Math.abs(fundingRate * 100 - r) < 0.001 ? 'var(--accent)' : 'var(--border)'}`,
                    background: Math.abs(fundingRate * 100 - r) < 0.001 ? 'var(--accent-dim)' : 'transparent',
                    color: Math.abs(fundingRate * 100 - r) < 0.001 ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {r}%
                </button>
              ))}
            </div>
          </div>

          {/* Holding Duration */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
                Holding Duration
              </label>
              <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                {(['days', 'hours'] as DurationUnit[]).map((u) => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      border: 'none',
                      background: unit === u ? 'var(--accent)' : 'transparent',
                      color: unit === u ? '#ffffff' : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              value={displayDuration}
              min={unit === 'hours' ? 0.5 : 0.1}
              max={unit === 'hours' ? 23976 : 999}
              step={0.5}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                if (!isNaN(v) && v > 0) handleDurationChange(v);
              }}
              className="input-field font-mono"
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {(unit === 'days' ? dayQuickSelect : hourQuickSelect).map((val) => (
                <button
                  key={val}
                  onClick={() => handleDurationChange(val)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    border: `1px solid ${isQuickSelected(val) ? 'var(--accent)' : 'var(--border)'}`,
                    background: isQuickSelected(val) ? 'var(--accent-dim)' : 'transparent',
                    color: isQuickSelected(val) ? 'var(--accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {val}{unit === 'days' ? 'd' : 'h'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
