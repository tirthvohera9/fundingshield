'use client';

import { useState } from 'react';
import { useCalculator } from '@/hooks/useCalculator';
import { useMarkPrice } from '@/hooks/useMarkPrice';
import { useLiqAlert } from '@/hooks/useLiqAlert';
import { RiskGauge } from './RiskGauge';
import { MMRTierAlert } from './MMRTierAlert';
import { MarginDrainChart } from './MarginDrainChart';
import { formatUSD, formatPrice, formatDays } from '@/utils/calculations';

/* ─────────────────── shared helpers ─────────────────── */

function MetricRow({
  label,
  value,
  highlight,
  mono = true,
  delta,
  deltaPositiveIsGood = true,
  color,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  delta?: number;
  deltaPositiveIsGood?: boolean;
  color?: string;
}) {
  const showDelta = delta !== undefined && Math.abs(delta) > 0.001;
  const deltaColor =
    delta === undefined
      ? ''
      : (delta > 0) === deltaPositiveIsGood
      ? 'var(--green)'
      : 'var(--red)';
  const deltaSign = delta !== undefined && delta > 0 ? '+' : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span
          style={{
            fontSize: highlight ? '1.15rem' : '1rem',
            fontFamily: mono ? 'monospace' : 'inherit',
            color: color ?? 'var(--text)',
            fontWeight: highlight ? 700 : 600,
            letterSpacing: mono ? '-0.01em' : undefined,
          }}
        >
          {value}
        </span>
        {showDelta && (
          <span style={{ fontSize: '0.85rem', fontFamily: 'monospace', color: deltaColor, fontWeight: 600 }}>
            {deltaSign}{delta!.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
    </div>
  );
}

/* ─────────────────── Panel 1: Current Position ─────────────────── */

export function CurrentPositionPanel() {
  const { pair, entryPrice, positionNotional, margin, leverage, isLong, results } = useCalculator();
  const [showMMR, setShowMMR] = useState(false);

  const { price: markPrice, connected } = useMarkPrice(pair || null);

  const liqPrice = results?.currentLiquidationPrice ?? 0;
  const { enabled: alertEnabled, threshold, setThreshold, enable, disable } = useLiqAlert(
    liqPrice,
    markPrice,
    isLong,
    pair
  );

  if (!results) return null;

  const dirLabel = isLong ? 'Long ↑' : 'Short ↓';
  const dirColor = isLong ? 'var(--green)' : 'var(--red)';

  const liveDistance =
    markPrice !== null
      ? isLong
        ? markPrice - liqPrice
        : liqPrice - markPrice
      : null;

  const liveDistancePct =
    liveDistance !== null && entryPrice > 0
      ? (Math.abs(liveDistance) / entryPrice) * 100
      : null;

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <SectionLabel label="Current Position" />

        {/* Summary pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: pair, mono: true },
            { label: dirLabel, color: dirColor },
            { label: `${leverage.toFixed(1)}×`, mono: true },
          ].map(({ label, mono, color }) => (
            <span
              key={label}
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                border: '1px solid var(--border)',
                fontSize: '0.73rem',
                fontFamily: mono ? 'monospace' : 'inherit',
                color: color ?? 'var(--text)',
                background: 'var(--surface)',
              }}
            >
              {label}
            </span>
          ))}
        </div>

        <MetricRow label="Entry Price" value={`$${formatPrice(entryPrice)}`} />
        <MetricRow label="Position Size" value={formatUSD(positionNotional)} />
        <MetricRow label="Margin Posted" value={formatUSD(margin)} />

        {/* Live mark price */}
        <div className="metric-row">
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            Mark Price
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: connected ? 'var(--green)' : 'var(--text-dim)',
                animation: connected ? 'pulse 2s infinite' : 'none',
                flexShrink: 0,
              }}
            />
          </span>
          <span
            style={{
              fontSize: '0.83rem',
              fontFamily: "'GeistMono','Geist Mono',ui-monospace,monospace",
              color: connected ? 'var(--text)' : 'var(--text-dim)',
              letterSpacing: '-0.02em',
            }}
          >
            {markPrice !== null ? `$${formatPrice(markPrice)}` : '—'}
          </span>
        </div>

        {liveDistance !== null && liveDistancePct !== null && (
          <div className="metric-row">
            <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Distance to Liq</span>
            <span
              style={{
                fontSize: '0.83rem',
                fontFamily: 'monospace',
                color: liveDistancePct < 2 ? 'var(--red)' : liveDistancePct < 5 ? 'var(--yellow)' : 'var(--green)',
                letterSpacing: '-0.02em',
              }}
            >
              ${formatPrice(Math.abs(liveDistance))} ({liveDistancePct.toFixed(2)}%)
            </span>
          </div>
        )}

        {/* MMR toggle */}
        <div style={{ margin: '10px 0 4px' }}>
          <button
            onClick={() => setShowMMR((v) => !v)}
            style={{
              padding: '3px 10px', borderRadius: '6px',
              border: '1px solid var(--border-subtle)', background: 'transparent',
              color: 'var(--text-dim)', fontSize: '0.7rem', cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
          >
            {showMMR ? '▾ Hide MMR' : '▸ Show MMR tier'}
          </button>
          {showMMR && (
            <div style={{ marginTop: '6px' }}>
              <MetricRow label="MMR Tier" value={results.currentMMRPercent} />
            </div>
          )}
        </div>

        <div style={{ margin: '4px 0 8px', height: '1px', background: 'var(--border-subtle)' }} />
        <MetricRow label="Liquidation Price" value={`$${formatPrice(results.currentLiquidationPrice)}`} highlight />
        <MetricRow
          label="Buffer to Liquidation"
          value={`$${formatPrice(results.currentBuffer.dollars)} (${results.currentBuffer.percentage.toFixed(2)}%)`}
        />

        <div style={{ marginTop: '14px' }}>
          <RiskGauge riskLevel={results.riskLevel} bufferPercent={results.currentBuffer.percentage} label="Current Risk" />
        </div>

        {/* Liquidation alert toggle */}
        <div
          style={{
            marginTop: '12px',
            padding: '10px 12px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
            background: alertEnabled ? 'rgba(234,179,8,0.04)' : 'transparent',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.73rem', color: alertEnabled ? 'var(--yellow)' : 'var(--text-dim)' }}>
              🔔 Alert at {threshold}% from liq
            </span>
            <button
              onClick={alertEnabled ? disable : enable}
              style={{
                padding: '3px 10px',
                borderRadius: '999px',
                border: `1px solid ${alertEnabled ? 'rgba(234,179,8,0.3)' : 'var(--border)'}`,
                background: alertEnabled ? 'rgba(234,179,8,0.08)' : 'transparent',
                color: alertEnabled ? 'var(--yellow)' : 'var(--text-dim)',
                fontSize: '0.68rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {alertEnabled ? 'On' : 'Off'}
            </button>
          </div>
          {alertEnabled && (
            <div style={{ marginTop: '8px', display: 'flex', gap: '4px' }}>
              {[5, 10, 15, 20].map((t) => (
                <button
                  key={t}
                  onClick={() => setThreshold(t)}
                  style={{
                    flex: 1,
                    padding: '3px 0',
                    borderRadius: '5px',
                    border: `1px solid ${threshold === t ? 'rgba(234,179,8,0.4)' : 'var(--border-subtle)'}`,
                    background: threshold === t ? 'rgba(234,179,8,0.1)' : 'transparent',
                    color: threshold === t ? 'var(--yellow)' : 'var(--text-dim)',
                    fontSize: '0.66rem',
                    cursor: 'pointer',
                  }}
                >
                  {t}%
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Panel 2: Add Margin Scenario ─────────────────── */

export function AddMarginPanel() {
  const { additionalMargin, results } = useCalculator();

  if (!results) return null;

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <SectionLabel
          label={`Add Margin${additionalMargin > 0 ? ` · +${formatUSD(additionalMargin)}` : ''}`}
        />

        {additionalMargin === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '32px 0',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1.4rem', opacity: 0.25 }}>+</span>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
              Adjust the slider to see<br />what adding margin does.
            </p>
          </div>
        ) : (
          <>
            <MMRTierAlert tierCrossing={results.tierCrossing} />
            <MetricRow label="Additional Margin" value={formatUSD(additionalMargin)} />
            <MetricRow label="New Total Margin" value={formatUSD(results.newMargin)} highlight />
            <MetricRow label="New MMR Tier" value={results.newMMRPercent} />
            <div style={{ margin: '8px 0', height: '1px', background: 'var(--border-subtle)' }} />
            <MetricRow
              label="New Liquidation Price"
              value={`$${formatPrice(results.newLiquidationPrice)}`}
              highlight
            />
            <MetricRow
              label="Buffer Improvement"
              value={`$${formatPrice(Math.abs(results.marginImprovement))}`}
              delta={results.marginImprovement > 0 ? results.marginImprovement : -results.marginImprovement}
              deltaPositiveIsGood
            />
            <div style={{ marginTop: '14px' }}>
              <RiskGauge
                riskLevel={results.newRiskLevel}
                bufferPercent={results.newBuffer.percentage}
                label="After Adding Margin"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────── Panel 3: Funding Impact ─────────────────── */

export function FundingImpactPanel() {
  const { fundingRate, holdingDays, results } = useCalculator();
  const [showDrainChart, setShowDrainChart] = useState(false);

  if (!results) return null;

  const noFunding = fundingRate === 0;

  return (
    <div className="card">
      <div style={{ padding: '28px 32px' }}>
        <SectionLabel
          label={
            noFunding
              ? 'Funding Fee Impact'
              : `Funding · ${holdingDays.toFixed(1)}d @ ${(fundingRate * 100).toFixed(4)}%`
          }
        />

        {noFunding ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '1px solid rgba(34,197,94,0.2)',
              background: 'rgba(34,197,94,0.04)',
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>✓</span>
            <div>
              <div style={{ color: 'var(--green)', fontWeight: 600, fontSize: '0.85rem' }}>
                Zero Funding Impact
              </div>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '2px' }}>
                Rate is 0% — no margin erosion.
              </div>
            </div>
          </div>
        ) : (
          <>
            <MetricRow
              label="Total Settlements"
              value={`${results.totalSettlements} (${holdingDays.toFixed(1)}d × 3/day)`}
            />
            <MetricRow label="Total Funding Cost" value={formatUSD(results.fundingCost)} />
            <MetricRow label="Daily Funding Cost" value={formatUSD(results.dailyFundingCost)} />
            <div style={{ margin: '8px 0', height: '1px', background: 'var(--border-subtle)' }} />
            <MetricRow label="Margin After Funding" value={formatUSD(results.marginAfterFunding)} highlight />
            <MetricRow label="Liq. After Funding" value={`$${formatPrice(results.liquidationAfterFunding)}`} highlight />
            <MetricRow
              label="Buffer After Funding"
              value={`$${formatPrice(results.bufferAfterFunding.dollars)} (${results.bufferAfterFunding.percentage.toFixed(2)}%)`}
            />
            <MetricRow label="Funding Impact on Buffer" value={`−${formatUSD(results.fundingImpact)}`} />
            <div style={{ margin: '8px 0', height: '1px', background: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Days to Liquidation</span>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  fontSize: '0.93rem',
                  color:
                    results.daysToLiquidationByFunding >= 90
                      ? 'var(--green)'
                      : results.daysToLiquidationByFunding >= 30
                      ? 'var(--yellow)'
                      : 'var(--red)',
                }}
              >
                {formatDays(results.daysToLiquidationByFunding)}{' '}
                {results.daysToLiquidationByFunding >= 30 ? '✓' : '⚠'}
              </span>
            </div>

            <div style={{ marginTop: '14px' }}>
              <RiskGauge
                riskLevel={
                  results.bufferAfterFunding.percentage >= 5
                    ? 'green'
                    : results.bufferAfterFunding.percentage >= 2
                    ? 'yellow'
                    : 'red'
                }
                bufferPercent={results.bufferAfterFunding.percentage}
                label="Final Risk (after funding)"
              />
            </div>

            {/* Margin drain chart toggle */}
            <div style={{ marginTop: '12px' }}>
              <button
                onClick={() => setShowDrainChart((v) => !v)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-subtle)',
                  background: showDrainChart ? 'rgba(255,255,255,0.04)' : 'transparent',
                  color: 'var(--text-dim)',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  width: '100%',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
              >
                {showDrainChart ? '▾ Hide margin timeline' : '▸ Show margin timeline'}
              </button>
              {showDrainChart && <MarginDrainChart />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
