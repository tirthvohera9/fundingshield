'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePositions, PositionSnapshot } from '@/hooks/usePositions';
import { useCalculator } from '@/hooks/useCalculator';
import { useLivePrice, computePnl } from '@/hooks/useLivePrice';
import { SavedPosition } from '@/lib/supabase';
import { formatUSD, formatPrice } from '@/utils/calculations';
import { PositionData, ScenarioData } from '@/utils/calculations';
import { useEvents } from '@/hooks/useEvents';

/* ── Live PnL badge ── */
function PnlBadge({
  symbol,
  entryPrice,
  notional,
  isLong,
}: {
  symbol: string;
  entryPrice: number;
  notional: number;
  isLong: boolean;
}) {
  const { price, error } = useLivePrice(symbol);
  if (error || !price)
    return <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>—</span>;
  const pnl = computePnl(entryPrice, price, notional, isLong);
  const isPos = pnl >= 0;
  return (
    <span
      style={{
        fontSize: '0.82rem',
        fontFamily: 'monospace',
        fontWeight: 600,
        color: isPos ? 'var(--green)' : 'var(--red)',
      }}
    >
      {isPos ? '+' : ''}{formatUSD(pnl)}
    </span>
  );
}

/* ── Direction badge ── */
function DirBadge({ isLong }: { isLong: boolean }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontWeight: 600,
        background: isLong ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: isLong ? 'var(--green)' : 'var(--red)',
        border: `1px solid ${isLong ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
      }}
    >
      {isLong ? '↑ Long' : '↓ Short'}
    </span>
  );
}

/* ── Pill badge ── */
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        padding: '2px 8px',
        borderRadius: '4px',
        fontSize: '0.7rem',
        fontFamily: 'monospace',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'var(--text-muted)',
      }}
    >
      {children}
    </span>
  );
}

interface Props {
  onLoad: (snap: PositionSnapshot) => void;
}

export function SavedPositions({ onLoad }: Props) {
  const { user } = useAuth();
  const { logEvent } = useEvents(user?.id ?? null);
  const { positions, loading, fetchPositions, savePosition, updatePosition, deletePosition } =
    usePositions(user?.id ?? null);
  const {
    exchange, pair, entryPrice, positionNotional, margin, leverage, isLong,
    additionalMargin, fundingRate, holdingDays,
  } = useCalculator();

  /* Save form */
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);

  /* Inline rename */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  /* Delete confirmation */
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchPositions(); }, [fetchPositions]);

  /* ── Save current position ── */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;
    setSaving(true);
    const snap: PositionSnapshot = {
      position: { exchange, pair, entryPrice, positionNotional, margin, leverage, isLong },
      scenario: { additionalMargin, fundingRate, holdingDays },
      savedAt: new Date().toISOString(),
    };
    await savePosition(saveName.trim(), snap);
    logEvent('position_saved', { pair, leverage, notional: positionNotional });
    setSaveName('');
    setShowSaveForm(false);
    setSaving(false);
  };

  /* ── Load ── */
  const handleLoad = (pos: SavedPosition) => {
    const snap = pos.position_data as unknown as PositionSnapshot;
    const p = snap?.position as PositionData;
    if (p) logEvent('position_loaded', { pair: p.pair, leverage: p.leverage, notional: p.positionNotional });
    onLoad(snap);
  };

  /* ── Rename ── */
  const startEdit = (pos: SavedPosition) => {
    setEditingId(pos.id);
    setEditName(pos.name);
    setDeletingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleRename = async (e: React.FormEvent, pos: SavedPosition) => {
    e.preventDefault();
    if (!editName.trim() || editName.trim() === pos.name) { cancelEdit(); return; }
    const snap = pos.position_data as unknown as PositionSnapshot;
    await updatePosition(pos.id, editName.trim(), snap);
    cancelEdit();
  };

  /* ── Delete ── */
  const handleDelete = async (id: string) => {
    if (deletingId !== id) { setDeletingId(id); setEditingId(null); return; }
    await deletePosition(id);
    logEvent('position_deleted', {});
    setDeletingId(null);
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          paddingBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              margin: '0 0 4px',
              color: 'var(--text)',
            }}
          >
            Saved Positions
          </h1>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>
            {positions.length} position{positions.length !== 1 ? 's' : ''} saved
          </p>
        </div>
        <button
          onClick={() => { setShowSaveForm((v) => !v); setEditingId(null); setDeletingId(null); }}
          style={{
            padding: '7px 16px',
            borderRadius: '999px',
            border: `1px solid ${showSaveForm ? 'rgba(255,255,255,0.2)' : 'var(--border)'}`,
            background: showSaveForm ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: showSaveForm ? 'var(--text)' : 'var(--text-muted)',
            fontSize: '0.76rem',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s var(--ease-spring)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            e.currentTarget.style.color = 'var(--text)';
          }}
          onMouseLeave={(e) => {
            if (!showSaveForm) {
              e.currentTarget.style.borderColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }
          }}
        >
          {showSaveForm ? '✕ Cancel' : '+ Save current position'}
        </button>
      </div>

      {/* ── Save form ── */}
      {showSaveForm && (
        <div
          style={{
            marginBottom: '24px',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 12px' }}>
            Saving:{' '}
            <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>
              {pair} · {isLong ? '↑ Long' : '↓ Short'} · {leverage.toFixed(1)}× · {formatUSD(positionNotional)}
            </span>
          </p>
          <form onSubmit={handleSave} style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              placeholder="Give this position a name…"
              className="input-field"
              style={{ flex: 1, fontFamily: 'inherit', fontSize: '0.88rem' }}
              autoFocus
              required
            />
            <button
              type="submit"
              disabled={saving || !saveName.trim()}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--accent)',
                color: '#000',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: saving ? 'default' : 'pointer',
                whiteSpace: 'nowrap',
                opacity: saving ? 0.6 : 1,
                flexShrink: 0,
                transition: 'opacity 0.15s',
              }}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </form>
        </div>
      )}

      {/* ── Position list ── */}
      {loading ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
          Loading…
        </div>
      ) : positions.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div style={{ fontSize: '2rem', opacity: 0.12 }}>◎</div>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', margin: 0, lineHeight: 1.6 }}>
            No saved positions yet.
            <br />
            <span style={{ opacity: 0.7 }}>Click "Save current position" to get started.</span>
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '10px',
          }}
        >
          {positions.map((pos) => {
            const snap = pos.position_data as unknown as PositionSnapshot;
            const p = snap?.position as PositionData;
            const s = snap?.scenario as ScenarioData;
            if (!p) return null;

            const isEditing = editingId === pos.id;
            const isConfirmDelete = deletingId === pos.id;

            return (
              <div
                key={pos.id}
                style={{
                  borderRadius: '12px',
                  border: `1px solid ${isConfirmDelete ? 'rgba(239,68,68,0.35)' : 'var(--border)'}`,
                  background: isConfirmDelete ? 'rgba(239,68,68,0.04)' : 'var(--card)',
                  padding: '16px 18px',
                  transition: 'border-color 0.2s, background 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {/* ── Name row ── */}
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleRename(e, pos)}
                    style={{ display: 'flex', gap: '6px' }}
                  >
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                      style={{ flex: 1, fontSize: '0.88rem', padding: '7px 12px', fontFamily: 'inherit' }}
                      autoFocus
                    />
                    <button
                      type="submit"
                      style={{
                        padding: '7px 12px',
                        borderRadius: '6px',
                        border: 'none',
                        background: 'var(--accent)',
                        color: '#000',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        fontSize: '0.76rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      ✕
                    </button>
                  </form>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: 'var(--text)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      {pos.name}
                    </div>
                    <PnlBadge
                      symbol={p.pair}
                      entryPrice={p.entryPrice}
                      notional={p.positionNotional}
                      isLong={p.isLong}
                    />
                  </div>
                )}

                {/* ── Detail badges ── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                  <Pill>{p.pair}</Pill>
                  <DirBadge isLong={p.isLong} />
                  <Pill>{p.leverage.toFixed(1)}×</Pill>
                </div>

                {/* ── Stats row ── */}
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-dim)',
                    fontFamily: 'monospace',
                    display: 'flex',
                    gap: '12px',
                    flexWrap: 'wrap',
                  }}
                >
                  <span>Size: {formatUSD(p.positionNotional)}</span>
                  <span>Entry: ${formatPrice(p.entryPrice)}</span>
                  {s?.fundingRate != null && s.fundingRate > 0 && (
                    <span>Rate: {(s.fundingRate * 100).toFixed(4)}%</span>
                  )}
                </div>

                {/* ── Action row ── */}
                <div
                  style={{
                    display: 'flex',
                    gap: '6px',
                    paddingTop: '6px',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  {/* Load */}
                  <button
                    onClick={() => handleLoad(pos)}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-muted)',
                      fontSize: '0.74rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)';
                      e.currentTarget.style.color = 'var(--text)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    Load
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => startEdit(pos)}
                    style={{
                      padding: '7px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      background: 'transparent',
                      color: 'var(--text-dim)',
                      fontSize: '0.74rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-dim)';
                    }}
                    title="Rename"
                  >
                    ✎
                  </button>

                  {/* Delete (with confirm) */}
                  {isConfirmDelete ? (
                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleDelete(pos.id)}
                        style={{
                          padding: '7px 10px',
                          borderRadius: '6px',
                          border: '1px solid rgba(239,68,68,0.5)',
                          background: 'rgba(239,68,68,0.12)',
                          color: 'var(--red)',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        style={{
                          padding: '7px 8px',
                          borderRadius: '6px',
                          border: '1px solid var(--border)',
                          background: 'transparent',
                          color: 'var(--text-dim)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDelete(pos.id)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '6px',
                        border: '1px solid transparent',
                        background: 'transparent',
                        color: 'var(--text-dim)',
                        fontSize: '0.74rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                        e.currentTarget.style.color = 'var(--red)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-dim)';
                      }}
                      title="Delete"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Saved date */}
                {snap?.savedAt && (
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '-4px' }}>
                    {new Date(snap.savedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
