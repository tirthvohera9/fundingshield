'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useFundingHistory } from '@/hooks/useFundingHistory';
import { useCalculator } from '@/hooks/useCalculator';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatRate(rate: number): string {
  return rate.toFixed(4) + '%';
}

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null;
  const rate = payload[0].value;
  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '8px 12px',
        fontSize: '0.75rem',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>
        {label ? formatDate(label) : ''}
      </div>
      <div style={{ color: rate >= 0 ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
        {rate >= 0 ? '+' : ''}{formatRate(rate)}
      </div>
    </div>
  );
}

export function FundingRateChart() {
  const { pair, fundingRate } = useCalculator();
  const { history, loading, error } = useFundingHistory(pair);

  if (loading) {
    return (
      <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Loading history…</span>
      </div>
    );
  }

  if (error || history.length === 0) {
    return (
      <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
          {error ?? 'No history available'}
        </span>
      </div>
    );
  }

  const currentRatePct = fundingRate * 100;
  const min = Math.min(...history.map((h) => h.rate));
  const max = Math.max(...history.map((h) => h.rate));
  const padding = (max - min) * 0.15 || 0.001;

  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ fontSize: '0.63rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
        Funding Rate History ({history.length} settlements)
      </div>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={history} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="rateGradPos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="rateGradNeg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={formatDate}
            tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[min - padding, max + padding]}
            tickFormatter={formatRate}
            tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
          <ReferenceLine
            y={currentRatePct}
            stroke="rgba(255,255,255,0.35)"
            strokeDasharray="3 3"
            label={{ value: 'current', position: 'insideTopRight', fontSize: 8, fill: 'var(--text-dim)' }}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#22c55e"
            strokeWidth={1.5}
            fill="url(#rateGradPos)"
            dot={false}
            activeDot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
