// Static list of popular perpetual futures trading pairs
export const CRYPTO_PAIRS: string[] = [
  // BTC
  'BTCUSDT', 'BTCBUSD', 'BTCUSDC',
  // ETH
  'ETHUSDT', 'ETHBUSD', 'ETHUSDC', 'ETHBTC',
  // Large caps
  'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT',
  'LINKUSDT', 'MATICUSDT', 'DOTUSDT', 'LTCUSDT', 'BCHUSDT', 'UNIUSDT',
  'ATOMUSDT', 'NEARUSDT', 'OPUSDT', 'ARBUSDT', 'APTUSDT', 'SUIUSDT',
  // Mid caps
  'INJUSDT', 'TIAUSDT', 'SEIUSDT', 'WLDUSDT', 'JUPUSDT', 'PYTHUSDT',
  'ORDIUSDT', 'STXUSDT', 'RUNEUSDT', 'AAVEUSDT', 'MKRUSDT', 'SNXUSDT',
  'CRVUSDT', 'LDOUSDT', 'SUSHIUSDT', 'COMPUSDT', 'YFIUSDT', 'BALUSDT',
  'PENDLEUSDT', 'GMXUSDT', 'DYDXUSDT', 'PERPUSDT',
  // Layer 2 / infra
  'STRKUSDT', 'SCROLLUSDT', 'ZKSYNCUSDT', 'ZKUSDT', 'MANTAUSDT',
  // Gaming / metaverse
  'AXSUSDT', 'SANDUSDT', 'MANAUSDT', 'GALAUSDT', 'IMXUSDT',
  // DeFi
  'EIGENUSDT', 'ENAUSDT', 'ETHFIUSDT', 'REZUSDT', 'FETUSDT', 'AGIXUSDT',
  // Memes
  'SHIBUSDT', 'PEPEUSDT', 'FLOKIUSDT', 'BONKUSDT', 'WIFUSDT', 'BOMEUSDT',
  // Other majors
  'TRXUSDT', 'XMRUSDT', 'HBARUSDT', 'ALGOUSDT', 'XLMUSDT', 'VETUSDT',
  'FILUSDT', 'ICPUSDT', 'EOSUSDT', 'APTUSDT', 'FLOWUSDT', 'EGLDUSDT',
  'FTMUSDT', 'KAVAUSDT', 'CELOUSDT', 'ZILUSDT', 'QNTUSDT', 'NEXOUSDT',
];

export function filterPairs(query: string): string[] {
  if (query.length < 2) return [];
  const q = query.toUpperCase();
  return CRYPTO_PAIRS.filter((p) => p.includes(q)).slice(0, 8);
}
