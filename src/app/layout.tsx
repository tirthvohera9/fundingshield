import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FundingShield — Crypto Futures Calculator',
  description:
    'Calculate liquidation prices, funding fee impact, and time-to-liquidation for crypto futures positions on Binance, Bybit, OKX, and CoinDCX.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" style={{ backgroundColor: '#f8f7f4' }}>
      <body style={{ margin: 0, minHeight: '100vh', backgroundColor: '#f8f7f4' }}>
        {children}
      </body>
    </html>
  );
}
