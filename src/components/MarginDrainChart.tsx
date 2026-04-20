'use client';

import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  CartesianGrid,
} from 'recharts';
import { useCalculator } from '@/hooks/useCalculator';
import { formatUSD } from '@/utils/calculations';

interface DataPoint {
  day: number;
  margin: number;
}

interface TooltipPayload {
  value: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayload[]; label?: number }) {
  if (!active || !payload?.length) return null;
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
      <div style={{ color: 'var(--text-dim)', marginBottom: '2px' }}>Day {label}</div>
      <div style={{ color: 'var(--text)', fontWeight: 600 }}>{formatUSD(payload[0].value)}</div>
    </div>
  );
}

export function MarginDrainChart() {
  const { fundingRate, holdingDays, results } = useCalculator();

  if (!results || fundingRate === 0) return null;

  const { newMargin, maintenanceMarginRequired } = results;
  const dailyCost = results.dailyFundingCost;
  const maxDays = Math.min(holdingDays * 2, 60);

  const data: DataPoint[] = [];
  for (let day = 0; day <= maxDays; day++) {
    const margin = newMargin - dailyCost * day;
    data.push({ day, margin });
    if (margin <= maintenanceMarginRequired) break;
  }

  const minY = Math.min(maintenanceMarginRequired * 0.8, Math.min(...data.map((d) => d.margin)));
  const maxY = newMargin * 1.05;

  return (
    <div style={{ marginTop: '12px' }}>
      <div style={{ fontSize: '0.63rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>
        Margin Drain Timeline
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="marginGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'days', position: 'insideBottomRight', offset: -4, fontSize: 8, fill: 'var(--text-dim)' }}
          />
          <YAxis
            domain={[minY, maxY]}
            tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
            tick={{ fontSize: 9, fill: 'var(--text-dim)' }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceArea
            y1={minY}
            y2={maintenanceMarginRequired}
            fill="rgba(239,68,68,0.07)"
          />
          <ReferenceLine
            y={maintenanceMarginRequired}
            stroke="rgba(239,68,68,0.5)"
            strokeDasharray="5 4"
            label={{ value: 'liq', position: 'insideTopRight', fontSize: 8, fill: 'rgba(239,68,68,0.7)' }}
          />
          <Area
            type="monotone"
            dataKey="margin"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={1.5}
            fill="url(#marginGrad)"
            dot={false}
            activeDot={{ r: 3, fill: '#fff', strokeWidth: 0 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
