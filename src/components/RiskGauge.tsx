'use client';

interface RiskGaugeProps {
  riskLevel: 'green' | 'yellow' | 'red';
  bufferPercent: number;
  label?: string;
}

const RISK_CONFIG = {
  green:  { color: 'var(--green)',  text: 'SAFE',      icon: '●' },
  yellow: { color: 'var(--yellow)', text: 'CAUTION',   icon: '◐' },
  red:    { color: 'var(--red)',    text: 'HIGH RISK',  icon: '○' },
};

export function RiskGauge({ riskLevel, bufferPercent, label }: RiskGaugeProps) {
  const config = RISK_CONFIG[riskLevel];

  const radius = 38;
  const cx = 58;
  const cy = 52;
  const clampedPercent = Math.min(Math.max(bufferPercent, 0), 20);
  const fillAngle = (clampedPercent / 20) * 180;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPoint = (angle: number) => {
    const rad = toRad(180 - angle);
    return `${cx + radius * Math.cos(rad)},${cy - radius * Math.sin(rad)}`;
  };

  const needleRad = toRad(180 - fillAngle);
  const needleX = cx + (radius - 4) * Math.cos(needleRad);
  const needleY = cy - (radius - 4) * Math.sin(needleRad);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      borderRadius: '10px',
      border: `1px solid ${config.color}30`,
      background: `${config.color}08`,
      transition: 'all 0.4s var(--ease-spring)',
    }}>
      <svg width="116" height="62" viewBox="0 0 116 62" style={{ flexShrink: 0 }}>
        {/* Track */}
        <path
          d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Zone tints */}
        <path d={`M ${cx - radius},${cy} A ${radius},${radius} 0 0,1 ${arcPoint(60)}`}
          fill="none" stroke="var(--red)" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d={`M ${arcPoint(60)} A ${radius},${radius} 0 0,1 ${arcPoint(108)}`}
          fill="none" stroke="var(--yellow)" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        <path d={`M ${arcPoint(108)} A ${radius},${radius} 0 0,1 ${cx + radius},${cy}`}
          fill="none" stroke="var(--green)" strokeWidth="6" strokeLinecap="round" opacity="0.3" />
        {/* Fill */}
        {fillAngle > 0 && (
          <path
            d={`M ${cx - radius},${cy} A ${radius},${radius} 0 ${fillAngle > 180 ? 1 : 0},1 ${arcPoint(fillAngle)}`}
            fill="none"
            stroke={config.color}
            strokeWidth="6"
            strokeLinecap="round"
          />
        )}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={needleX} y2={needleY}
          stroke={config.color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="3.5" fill={config.color} />
      </svg>

      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label ?? 'Risk Level'}
        </div>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: config.color, letterSpacing: '0.06em' }}>
          {config.icon} {config.text}
        </div>
        <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: config.color, marginTop: '2px', opacity: 0.8 }}>
          {bufferPercent.toFixed(2)}% buffer
        </div>
      </div>
    </div>
  );
}
