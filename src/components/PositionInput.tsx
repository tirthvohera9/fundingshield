'use client';

import { useState, useRef, useEffect } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { useCoinList } from '@/hooks/useCoinList';
import { useFundingRates } from '@/hooks/useFundingRates';
import { useEvents } from '@/hooks/useEvents';

const POPULAR_PAIRS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT'];

/** Controlled numeric input that allows clearing the field. */
function NumericInput({
  value,
  min,
  max,
  step,
  placeholder,
  className,
  suffix,
  onCommit,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  className?: string;
  suffix?: string;
  onCommit: (v: number) => void;
}) {
  const [raw, setRaw] = useState(String(value));

  useEffect(() => {
    const parsed = parseFloat(raw);
    if (isNaN(parsed) || Math.abs(parsed - value) > 0.001) {
      setRaw(value === 0 ? '' : String(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = e.target.value;
    setRaw(s);
    const v = parseFloat(s);
    if (!isNaN(v) && (min === undefined || v >= min) && (max === undefined || v <= max)) {
      onCommit(v);
    }
  };

  const handleBlur = () => {
    const v = parseFloat(raw);
    if (isNaN(v) || (min !== undefined && v < min)) {
      setRaw(value === 0 ? '' : String(value));
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="number"
        value={raw}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder ?? '0'}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`input-field font-mono ${className ?? ''}`}
        style={{
          paddingRight: suffix ? '40px' : undefined,
        }}
      />
      {suffix && (
        <span
          style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
            pointerEvents: 'none',
            fontWeight: 500,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

export function PositionInput() {
  const {
    pair,
    entryPrice,
    positionNotional,
    margin,
    leverage,
    isLong,
    setPositionData,
  } = useCalculator();
  const { coins } = useCoinList();
  const { fetchRate } = useFundingRates();
  const { logEvent } = useEvents();

  const [pairQuery, setPairQuery] = useState(pair);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedPrice, setSuggestedPrice] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchMarkPrice = (p: string) => {
    fetchRate('binance', p, (_rate, markPrice) => {
      if (markPrice > 0) setSuggestedPrice(markPrice);
    });
  };

  const handlePairInput = (val: string) => {
    const upper = val.toUpperCase();
    setPairQuery(upper);
    setPositionData({ pair: upper });
    setSuggestedPrice(null);
    if (upper.length >= 2) {
      setSuggestions(coins.filter((c) => c.includes(upper)).slice(0, 10));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectPair = (p: string, method: 'quick_select' | 'autocomplete' | 'typed' = 'autocomplete') => {
    setPairQuery(p);
    setPositionData({ pair: p });
    setShowSuggestions(false);
    setSuggestedPrice(null);
    logEvent('pair_selected', { pair: p, method });
    fetchMarkPrice(p);
  };

  const handleLeverageChange = (lev: number) => {
    const newMargin = positionNotional / lev;
    setPositionData({ leverage: lev, margin: newMargin });
  };

  const handleMarginChange = (m: number) => {
    const newLeverage = positionNotional / m;
    setPositionData({ margin: m, leverage: Math.round(newLeverage * 10) / 10 });
  };

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)', margin: '0 0 28px 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Position Setup
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Pair with autocomplete */}
        <div>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', display: 'block' }}>
            Trading Pair
          </label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {POPULAR_PAIRS.map((p) => (
              <button
                key={p}
                onClick={() => selectPair(p, 'quick_select')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: pair === p ? `2px solid var(--accent)` : '1px solid var(--border)',
                  background: pair === p ? 'var(--accent-dim)' : 'transparent',
                  color: pair === p ? 'var(--accent)' : 'var(--text-muted)',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                  fontFamily: 'monospace',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (pair !== p) {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (pair !== p) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {p}
              </button>
            ))}
          </div>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <input
              type="text"
              value={pairQuery}
              onChange={(e) => handlePairInput(e.target.value)}
              onFocus={() => {
                if (pairQuery.length >= 2) {
                  setSuggestions(coins.filter((c) => c.includes(pairQuery.toUpperCase())).slice(0, 10));
                  setShowSuggestions(true);
                }
              }}
              placeholder="Type BTC, ETH, etc..."
              className="input-field font-mono"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  zIndex: 50,
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                }}
              >
                {suggestions.map((s) => (
                  <li
                    key={s}
                    onMouseDown={() => selectPair(s, 'autocomplete')}
                    style={{
                      padding: '10px 14px',
                      fontFamily: 'monospace',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                      color: 'var(--text)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Entry Price & Notional */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Entry Price
            </label>
            <NumericInput
              value={entryPrice}
              min={0.001}
              placeholder=""
              onCommit={(v) => setPositionData({ entryPrice: v })}
            />
            {suggestedPrice !== null && (
              <button
                onClick={() => {
                  setPositionData({ entryPrice: suggestedPrice });
                  setSuggestedPrice(null);
                }}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border)',
                  background: 'var(--surface)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  display: 'block',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--accent)';
                  e.currentTarget.style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                📍 Use mark price ${suggestedPrice.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              </button>
            )}
          </div>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Position Size
            </label>
            <NumericInput
              value={positionNotional}
              min={1}
              placeholder=""
              onCommit={(v) => {
                const newLev = v / margin;
                setPositionData({ positionNotional: v, leverage: Math.round(newLev * 10) / 10 });
              }}
              suffix="USDT"
            />
          </div>
        </div>

        {/* Margin & Leverage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Margin
            </label>
            <NumericInput
              value={Math.round(margin * 100) / 100}
              min={0.01}
              placeholder=""
              onCommit={handleMarginChange}
              suffix="USDT"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'block' }}>
              Leverage
            </label>
            <NumericInput
              value={Math.round(leverage * 10) / 10}
              min={0.1}
              max={200}
              step={0.1}
              placeholder=""
              suffix="×"
              onCommit={handleLeverageChange}
            />
          </div>
        </div>

        {/* Long / Short */}
        <div>
          <label style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)', marginBottom: '12px', display: 'block' }}>
            Direction
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setPositionData({ isLong: true })}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: isLong ? '2px solid var(--green)' : '1px solid var(--border)',
                background: isLong ? 'rgba(22, 163, 74, 0.08)' : 'transparent',
                color: isLong ? 'var(--green)' : 'var(--text-muted)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (!isLong) {
                  e.currentTarget.style.borderColor = 'var(--green)';
                  e.currentTarget.style.color = 'var(--green)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLong) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              📈 Long
            </button>
            <button
              onClick={() => setPositionData({ isLong: false })}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: !isLong ? '2px solid var(--red)' : '1px solid var(--border)',
                background: !isLong ? 'rgba(220, 38, 38, 0.08)' : 'transparent',
                color: !isLong ? 'var(--red)' : 'var(--text-muted)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                if (isLong) {
                  e.currentTarget.style.borderColor = 'var(--red)';
                  e.currentTarget.style.color = 'var(--red)';
                }
              }}
              onMouseLeave={(e) => {
                if (isLong) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              📉 Short
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
