'use client';

import { TierCrossing } from '@/utils/calculations';

interface Props {
  tierCrossing: TierCrossing | null;
}

export function MMRTierAlert({ tierCrossing }: Props) {
  if (!tierCrossing) return null;

  if (tierCrossing.crossed) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '10px',
        border: '1px solid rgba(234,179,8,0.2)',
        background: 'rgba(234,179,8,0.05)',
        marginBottom: '12px',
        transition: 'all 0.3s var(--ease-spring)',
      }}>
        <span style={{ fontSize: '1rem', marginTop: '1px' }}>⚠</span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--yellow)', fontSize: '0.82rem', marginBottom: '4px' }}>
            MMR Tier Crossing
          </div>
          <div style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
            MMR moving from{' '}
            <code style={{ color: 'var(--yellow)', fontFamily: 'monospace' }}>{tierCrossing.oldPercent}</code>
            {' → '}
            <code style={{ color: 'var(--red)', fontFamily: 'monospace' }}>{tierCrossing.newPercent}</code>
          </div>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.74rem', marginTop: '4px' }}>
            Higher maintenance requirement will move liquidation price closer to entry.
          </div>
        </div>
      </div>
    );
  }

  // Informational: show current tier
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.06)',
      background: 'rgba(255,255,255,0.02)',
      marginBottom: '12px',
    }}>
      <span style={{ fontSize: '0.9rem', marginTop: '1px', opacity: 0.5 }}>ℹ</span>
      <div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Current MMR tier:{' '}
          <code style={{ color: 'var(--text)', fontFamily: 'monospace' }}>{tierCrossing.oldPercent}</code>
          {' '}maintenance margin
        </div>
      </div>
    </div>
  );
}
