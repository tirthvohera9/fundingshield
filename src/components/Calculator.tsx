'use client';

import { useEffect, useRef, useState } from 'react';
import { PositionInput } from './PositionInput';
import { AddMarginScenario } from './AddMarginScenario';
import { FundingFeeInput } from './FundingFeeInput';
import { CurrentPositionPanel, AddMarginPanel, FundingImpactPanel } from './ResultsPanel';
import { FundingRateChart } from './FundingRateChart';
import { AuthModal } from './AuthModal';
import { SavedPositions } from './SavedPositions';
import { ErrorBoundary } from './ErrorBoundary';
import { BreakEvenRate } from './tools/BreakEvenRate';
import { LeverageOptimizer } from './tools/LeverageOptimizer';
import { PositionSizer } from './tools/PositionSizer';
import { useCalculator, restoreFromStorage, subscribeStorage, applyURLHash, getShareURL } from '@/hooks/useCalculator';
import { useAuth } from '@/hooks/useAuth';
import { PositionSnapshot } from '@/hooks/usePositions';
import { useEvents } from '@/hooks/useEvents';

type Tab = 'calculator' | 'saved' | 'tools';

/* ── Tab button ── */
function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        borderRadius: '10px',
        border: active ? '1px solid var(--accent)' : '1px solid transparent',
        background: active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.3)',
        color: active ? '#ffffff' : 'var(--text)',
        fontSize: '0.95rem',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        transition: 'all 0.25s var(--ease-out)',
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        backdropFilter: active ? 'none' : 'blur(10px)',
        WebkitBackdropFilter: active ? 'none' : 'blur(10px)',
      }}
      onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'; e.currentTarget.style.color = 'var(--text)'; } }}
    >
      {children}
    </button>
  );
}

/* ── Share button ── */
function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = getShareURL();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      title="Copy share link"
      style={{
        padding: '8px 16px',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        background: copied ? 'var(--accent-dim)' : 'transparent',
        color: copied ? 'var(--accent)' : 'var(--text-muted)',
        fontSize: '0.9rem',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.2s var(--ease-spring)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
      onMouseEnter={(e) => { if (!copied) { e.currentTarget.style.borderColor = '#d4cdc5'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={(e) => { if (!copied) { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; } }}
    >
      {copied ? '✓ Copied' : '↗ Share'}
    </button>
  );
}

export function Calculator() {
  const { reset, results, setPositionData, setScenarioData, pair, leverage, positionNotional, isLong } = useCalculator();
  const { user, loading: authLoading, signOut } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  const { logEvent, logEventDebounced } = useEvents(user?.id ?? null);
  const scrollRef = useRef<HTMLDivElement>(null);

  /* Init: URL hash → localStorage restore → subscribe for future saves */
  useEffect(() => {
    const hadHash = applyURLHash();
    if (!hadHash) restoreFromStorage();
    const unsub = subscribeStorage();
    return unsub;
  }, []);

  useEffect(() => {
    logEvent('page_viewed', {
      referrer: typeof document !== 'undefined' ? document.referrer || 'direct' : 'unknown',
    });
  }, []);

  useEffect(() => {
    if (!results) return;
    logEventDebounced('position_calculated', {
      pair, leverage, notional: positionNotional, direction: isLong ? 'long' : 'short',
    }, 1500);
  }, [results, pair, leverage, positionNotional, isLong, logEventDebounced]);

  // Removed horizontal scroll logic - using vertical layout now

  const handleLoadSnapshot = (snap: PositionSnapshot) => {
    if (snap?.position) setPositionData(snap.position);
    if (snap?.scenario) setScenarioData(snap.scenario);
    setActiveTab('calculator');
  };

  return (
    <div
      style={{
        height: '100dvh',
        overflow: 'hidden',
        background: 'var(--bg)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {/* ── Header - Apple Liquid Glass ── */}
      <header style={{
        flexShrink: 0,
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div
          style={{
            maxWidth: '1600px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 800,
                color: '#ffffff',
                flexShrink: 0,
              }}
            >
              FS
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                FundingShield
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Crypto Futures Calculator
              </div>
            </div>
          </div>

          {/* Center: Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '4px',
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <TabBtn active={activeTab === 'calculator'} onClick={() => { setActiveTab('calculator'); logEvent('tab_switched', { to: 'calculator' }); }}>
              Calculator
            </TabBtn>
            <TabBtn active={activeTab === 'tools'} onClick={() => { setActiveTab('tools'); logEvent('tab_switched', { to: 'tools' }); }}>
              Tools
            </TabBtn>
            <TabBtn active={activeTab === 'saved'} onClick={() => { setActiveTab('saved'); logEvent('tab_switched', { to: 'saved' }); }}>
              Saved
            </TabBtn>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'calculator' && <ShareButton />}

            {activeTab === 'calculator' && (
              <button
                onClick={reset}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s var(--ease-spring)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#d4cdc5'; e.currentTarget.style.color = 'var(--text)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              >
                Reset
              </button>
            )}

            {!authLoading && (
              user && user.email ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {user.email.split('@')[0]}
                  </span>
                  <button
                    onClick={signOut}
                    style={{
                      padding: '8px 16px',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s var(--ease-spring)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAuthOpen(true)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Sign in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* ══════════════ CALCULATOR TAB ══════════════ */}
      {activeTab === 'calculator' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px 80px' }}>
            {/* Input panels grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-2xl)',
              }}
            >
              <div className="panel-col">
                <ErrorBoundary><PositionInput /></ErrorBoundary>
              </div>
              <div className="panel-col">
                <ErrorBoundary><FundingFeeInput /></ErrorBoundary>
              </div>
              <div className="panel-col">
                <ErrorBoundary><AddMarginScenario /></ErrorBoundary>
              </div>
            </div>

            {/* Results section */}
            {results && (
              <div>
                <h3 style={{ margin: '0 0 var(--spacing-lg) 0', fontSize: '1.1rem', fontWeight: 600 }}>
                  Analysis Results
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-2xl)',
                  }}
                >
                  <div className="panel-col">
                    <ErrorBoundary><CurrentPositionPanel /></ErrorBoundary>
                  </div>
                  <div className="panel-col">
                    <ErrorBoundary><AddMarginPanel /></ErrorBoundary>
                  </div>
                  <div className="panel-col">
                    <ErrorBoundary><FundingImpactPanel /></ErrorBoundary>
                  </div>
                </div>

                {/* Funding History Chart - full width */}
                <div className="panel-col">
                  <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
                    <div style={{ padding: '28px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 'var(--spacing-lg)' }}>
                        Funding Rate History
                      </div>
                      <ErrorBoundary><FundingRateChart /></ErrorBoundary>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {!results && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: 'var(--spacing-lg)',
                }}
              >
                {['Position Setup', 'Funding & Duration', 'Margin Scenario', 'Analysis Pending'].map((hint) => (
                  <div key={hint} className="panel-col">
                    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                      <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                        <div style={{ fontSize: '2.4rem', opacity: 0.1, marginBottom: 'var(--spacing-md)' }}>◎</div>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                          {hint}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ TOOLS TAB ══════════════ */}
      {activeTab === 'tools' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
            <div style={{ marginBottom: '40px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: '0 0 8px 0' }}>
                Advanced Tools
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0 }}>
                Calculate position sizing, leverage optimization, and break-even rates
              </p>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                gap: '20px',
                alignItems: 'start',
              }}
            >
              <ErrorBoundary><BreakEvenRate /></ErrorBoundary>
              <ErrorBoundary><LeverageOptimizer /></ErrorBoundary>
              <ErrorBoundary><PositionSizer /></ErrorBoundary>
            </div>
            <div
              style={{
                marginTop: '40px',
                padding: '16px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
              }}
            >
              <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.6 }}>
                ℹ️ All tools use your current Calculator state as defaults · Results are estimates only · Always verify with your exchange before trading
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SAVED POSITIONS TAB ══════════════ */}
      {activeTab === 'saved' && (
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px 80px' }}>
            {user ? (
              <SavedPositions onLoad={handleLoadSnapshot} />
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '60vh',
                  gap: '20px',
                }}
              >
                <div style={{ fontSize: '3rem', opacity: 0.1 }}>⊙</div>
                <p style={{ color: 'var(--text-dim)', fontSize: '1.05rem', margin: 0, letterSpacing: '0.01em' }}>
                  Sign in to save and manage your positions
                </p>
                <button
                  onClick={() => setAuthOpen(true)}
                  style={{
                    padding: '10px 28px',
                    border: '1px solid var(--accent)',
                    borderRadius: '8px',
                    background: 'var(--accent)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s var(--ease-spring)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
                >
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 768px) {
          header { padding: 12px 16px; }
          .panel-col { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
