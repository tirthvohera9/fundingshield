import { NextRequest, NextResponse } from 'next/server';

const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 3600_000; // 1 hour

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get('symbol') ?? 'BTCUSDT').toUpperCase();

  const cached = cache[symbol];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const url = `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${encodeURIComponent(symbol)}&limit=200`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    cache[symbol] = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err) {
    console.error('Funding history error:', err);
    return NextResponse.json([], { status: 200 });
  }
}
