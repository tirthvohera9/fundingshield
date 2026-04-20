'use client';

import { useState, useCallback } from 'react';
import { getSupabase, SavedPosition } from '@/lib/supabase';
import { PositionData, ScenarioData } from '@/utils/calculations';

export interface PositionSnapshot {
  position: PositionData;
  scenario: ScenarioData;
  currentPrice?: number;
  savedAt: string;
}

export function usePositions(userId: string | null) {
  const [positions, setPositions] = useState<SavedPosition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositions = useCallback(async () => {
    if (!userId) { setPositions([]); return; }
    const sb = getSupabase();
    if (!sb) return;
    setLoading(true);
    setError(null);
    const { data, error: err } = await sb
      .from('positions')
      .select('*')
      .order('updated_at', { ascending: false });
    if (err) setError(err.message);
    else setPositions(data ?? []);
    setLoading(false);
  }, [userId]);

  const savePosition = useCallback(async (name: string, snapshot: PositionSnapshot) => {
    if (!userId) return null;
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error: err } = await sb
      .from('positions')
      .insert({ user_id: userId, name, position_data: snapshot as unknown })
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setPositions((prev) => [data, ...prev]);
    return data as SavedPosition;
  }, [userId]);

  const updatePosition = useCallback(async (id: string, name: string, snapshot: PositionSnapshot) => {
    const sb = getSupabase();
    if (!sb) return null;
    const { data, error: err } = await sb
      .from('positions')
      .update({ name, position_data: snapshot as unknown })
      .eq('id', id)
      .select()
      .single();
    if (err) { setError(err.message); return null; }
    setPositions((prev) => prev.map((p) => p.id === id ? data : p));
    return data as SavedPosition;
  }, []);

  const deletePosition = useCallback(async (id: string) => {
    const sb = getSupabase();
    if (!sb) return false;
    const { error: err } = await sb.from('positions').delete().eq('id', id);
    if (err) { setError(err.message); return false; }
    setPositions((prev) => prev.filter((p) => p.id !== id));
    return true;
  }, []);

  return { positions, loading, error, fetchPositions, savePosition, updatePosition, deletePosition };
}
