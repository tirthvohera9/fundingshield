'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Mode = 'signin' | 'signup';

export function AuthModal({ open, onClose }: Props) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setStatus(null);

    const err = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password);

    setBusy(false);
    if (err) {
      setStatus({ type: 'error', msg: err.message });
    } else if (mode === 'signup') {
      setStatus({ type: 'success', msg: 'Check your email to confirm your account.' });
    } else {
      onClose();
    }
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div style={{
        width: '100%', maxWidth: '400px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '20px',
        padding: '32px',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '6px' }}>
              FundingShield
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.03em', margin: 0, color: 'var(--text)' }}>
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-dim)', fontSize: '1.2rem', cursor: 'pointer', padding: '4px', lineHeight: 1 }}
          >×</button>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '3px',
          marginBottom: '24px',
        }}>
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setStatus(null); }}
              style={{
                flex: 1,
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: mode === m ? 'var(--accent)' : 'transparent',
                color: mode === m ? '#000' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s var(--ease-spring)',
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Sign up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label className="input-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="input-field"
              style={{ fontFamily: 'inherit' }}
            />
          </div>
          <div>
            <label className="input-label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              style={{ fontFamily: 'inherit' }}
            />
          </div>

          {status && (
            <div style={{
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              border: `1px solid ${status.type === 'error' ? 'var(--red)' : 'var(--green)'}30`,
              background: `${status.type === 'error' ? 'var(--red)' : 'var(--green)'}08`,
              color: status.type === 'error' ? 'var(--red)' : 'var(--green)',
            }}>
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: busy ? 'var(--border)' : 'var(--accent)',
              color: '#000',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: busy ? 'default' : 'pointer',
              transition: 'all 0.25s var(--ease-spring)',
              letterSpacing: '0.02em',
            }}
          >
            {busy ? 'Loading…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
