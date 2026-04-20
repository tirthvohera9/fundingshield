import { NextRequest, NextResponse } from 'next/server';

const cache: Record<string, { data: unknown; ts: number }> = {};
const CACHE_TTL = 60_000; // 1 minute

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const exchange = searchParams.get('exchange') ?? 'binance';
  const pair = searchParams.get('pair') ?? 'BTCUSDT';
  const cacheKey = `${exchange}:${pair}`;

  // Return cached if fresh
  const cached = cache[cacheKey];
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    // Binance premiumIndex — free, no API key required
    const symbol = pair.toUpperCase();
    const url = `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`;
    const res = await fetch(url, { next: { revalidate: 60 } });

    if (!res.ok) throw new Error(`Binance premiumIndex error: ${res.status}`);

    const json = await res.json();
    // lastFundingRate is a string like "0.00010000"
    const fundingRate = parseFloat(json.lastFundingRate) || 0;

    const payload = {
      fundingRate,
      nextFundingTime: json.nextFundingTime ?? null,
      timestamp: Date.now(),
      source: 'binance',
    };

    cache[cacheKey] = { data: payload, ts: Date.now() };
    return NextResponse.json(payload);
  } catch (err) {
    console.error('Funding rate fetch error:', err);
    // Fallback: return 0 so the app never crashes
    return NextResponse.json({
      fundingRate: 0,
      nextFundingTime: null,
      timestamp: Date.now(),
      source: 'fallback',
      error: 'Live rate unavailable — using 0. Enter manually.',
    });
  }
}
