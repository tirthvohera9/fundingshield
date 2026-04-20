'use client';

import { useState, useEffect, useRef } from 'react';

export function useLiqAlert(
  liqPrice: number,
  markPrice: number | null,
  isLong: boolean,
  pair: string
) {
  const [enabled, setEnabled] = useState(false);
  const [threshold, setThreshold] = useState(5);
  const permissionRef = useRef(false);
  const firedRef = useRef(false);

  async function enable() {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
      permissionRef.current = true;
      setEnabled(true);
      firedRef.current = false;
    }
  }

  function disable() {
    setEnabled(false);
    firedRef.current = false;
  }

  useEffect(() => {
    if (!enabled || !markPrice || !liqPrice || !permissionRef.current) return;
    if (liqPrice <= 0) return;

    const dist = Math.abs(markPrice - liqPrice) / Math.abs(liqPrice);

    if (dist <= threshold / 100 && !firedRef.current) {
      firedRef.current = true;
      new Notification(`⚠️ ${pair} — Liquidation Alert`, {
        body: `Mark $${markPrice.toFixed(2)} is within ${threshold}% of your liquidation price $${liqPrice.toFixed(2)}`,
        icon: '/favicon.ico',
      });
    }

    if (dist > threshold / 100) {
      firedRef.current = false;
    }
  }, [enabled, markPrice, liqPrice, threshold, pair]);

  return { enabled, threshold, setThreshold, enable, disable };
}
