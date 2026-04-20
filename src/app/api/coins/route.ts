import { NextResponse } from 'next/server';

const EXCHANGE_INFO_URL = 'https://fapi.binance.com/fapi/v1/exchangeInfo';
const TICKER_URL = 'https://fapi.binance.com/fapi/v1/ticker/24hr';

interface BinanceSymbol {
  symbol: string;
  contractType: string;
  quoteAsset: string;
  status: string;
}

interface BinanceTicker {
  symbol: string;
  quoteVolume: string;
}

interface ServerCache {
  data: string[];
  ts: number;
}

const cache: { coins: ServerCache | null } = { coins: null };
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

export async function GET() {
  // Serve from cache if fresh
  if (cache.coins && Date.now() - cache.coins.ts < CACHE_TTL) {
    return NextResponse.json({ coins: cache.coins.data, cached: true });
  }

  try {
    // Fetch both endpoints in parallel
    const [infoRes, tickerRes] = await Promise.all([
      fetch(EXCHANGE_INFO_URL, { next: { revalidate: 3600 } }),
      fetch(TICKER_URL,        { next: { revalidate: 3600 } }),
    ]);

    if (!infoRes.ok || !tickerRes.ok) {
      throw new Error(`Binance API error: ${infoRes.status} / ${tickerRes.status}`);
    }

    const [infoJson, tickerJson] = await Promise.all([
      infoRes.json() as Promise<{ symbols: BinanceSymbol[] }>,
      tickerRes.json() as Promise<BinanceTicker[]>,
    ]);

    // 1. Get all PERPETUAL USDT symbols from exchangeInfo
    const perpetualSet = new Set<string>(
      infoJson.symbols
        .filter((s) => s.contractType === 'PERPETUAL' && s.quoteAsset === 'USDT' && s.status === 'TRADING')
        .map((s) => s.symbol)
    );

    // 2. Build a volume map from the ticker
    const volumeMap = new Map<string, number>();
    for (const t of tickerJson) {
      volumeMap.set(t.symbol, parseFloat(t.quoteVolume) || 0);
    }

    // 3. Filter to perpetuals, sort by 24h quoteVolume desc (all of them — ~350 pairs max)
    const sorted = [...perpetualSet]
      .sort((a, b) => (volumeMap.get(b) ?? 0) - (volumeMap.get(a) ?? 0));

    cache.coins = { data: sorted, ts: Date.now() };

    return NextResponse.json({ coins: sorted, cached: false, count: sorted.length });
  } catch (err) {
    console.error('Coin list fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch coin list from Binance', coins: [] },
      { status: 502 }
    );
  }
}
