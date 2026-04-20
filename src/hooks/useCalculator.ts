import { create } from 'zustand';
import {
  PositionData,
  ScenarioData,
  CalculationResults,
  performAllCalculations,
} from '@/utils/calculations';

interface CalculatorStore extends PositionData, ScenarioData {
  results: CalculationResults | null;
  setPositionData: (data: Partial<PositionData>) => void;
  setScenarioData: (data: Partial<ScenarioData>) => void;
  recalculate: () => void;
  reset: () => void;
}

const INITIAL_POSITION: PositionData = {
  exchange: 'binance',
  pair: 'BTCUSDT',
  entryPrice: 0,
  positionNotional: 0,
  margin: 0,
  leverage: 0,
  isLong: true,
};

const INITIAL_SCENARIO: ScenarioData = {
  additionalMargin: 0,
  fundingRate: 0,
  holdingDays: 999,
};

export const useCalculator = create<CalculatorStore>((set, get) => ({
  ...INITIAL_POSITION,
  ...INITIAL_SCENARIO,
  results: performAllCalculations(INITIAL_POSITION, INITIAL_SCENARIO),

  setPositionData: (data) => {
    set((state) => ({ ...state, ...data }));
    get().recalculate();
  },

  setScenarioData: (data) => {
    set((state) => ({ ...state, ...data }));
    get().recalculate();
  },

  recalculate: () => {
    const state = get();
    const position: PositionData = {
      exchange: state.exchange,
      pair: state.pair,
      entryPrice: state.entryPrice,
      positionNotional: state.positionNotional,
      margin: state.margin,
      leverage: state.leverage,
      isLong: state.isLong,
    };
    const scenario: ScenarioData = {
      additionalMargin: state.additionalMargin,
      fundingRate: state.fundingRate,
      holdingDays: state.holdingDays,
    };
    const results = performAllCalculations(position, scenario);
    set({ results });
  },

  reset: () =>
    set({
      ...INITIAL_POSITION,
      ...INITIAL_SCENARIO,
      results: performAllCalculations(INITIAL_POSITION, INITIAL_SCENARIO),
    }),
}));

// ── localStorage persistence ──

const LS_KEY = 'fs_position_v1';

interface StoredState {
  pair: string; entryPrice: number; positionNotional: number;
  margin: number; leverage: number; isLong: boolean;
  additionalMargin: number; fundingRate: number; holdingDays: number;
}

export function restoreFromStorage(): void {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const d: StoredState = JSON.parse(raw);
    const store = useCalculator.getState();
    store.setPositionData({
      pair: d.pair, entryPrice: d.entryPrice,
      positionNotional: d.positionNotional, margin: d.margin,
      leverage: d.leverage, isLong: d.isLong,
    });
    store.setScenarioData({
      additionalMargin: d.additionalMargin,
      fundingRate: d.fundingRate,
      holdingDays: d.holdingDays,
    });
  } catch {}
}

export function subscribeStorage(): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return useCalculator.subscribe((state) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const data: StoredState = {
          pair: state.pair, entryPrice: state.entryPrice,
          positionNotional: state.positionNotional, margin: state.margin,
          leverage: state.leverage, isLong: state.isLong,
          additionalMargin: state.additionalMargin,
          fundingRate: state.fundingRate, holdingDays: state.holdingDays,
        };
        localStorage.setItem(LS_KEY, JSON.stringify(data));
      } catch {}
    }, 800);
  });
}

// ── URL hash share ──

export function applyURLHash(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.slice(1);
  if (!hash) return false;
  const parts = hash.split('&');
  if (parts.length < 7) return false;
  try {
    const [p, ep, notional, m, isLongStr, fr, hd] = parts;
    const store = useCalculator.getState();
    store.setPositionData({
      pair: p,
      entryPrice: parseFloat(ep),
      positionNotional: parseFloat(notional),
      margin: parseFloat(m),
      isLong: isLongStr === '1',
    });
    store.setScenarioData({
      fundingRate: parseFloat(fr),
      holdingDays: parseFloat(hd),
    });
    return true;
  } catch {
    return false;
  }
}

export function getShareURL(): string {
  if (typeof window === 'undefined') return '';
  const s = useCalculator.getState();
  const hash = [
    s.pair, s.entryPrice, s.positionNotional,
    s.margin.toFixed(2), s.isLong ? '1' : '0',
    s.fundingRate, s.holdingDays,
  ].join('&');
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}
