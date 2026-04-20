// All financial calculation functions for FundingShield

export interface MMRTier {
  max: number;
  mmr: number;
}

export interface ExchangeMMRTiers {
  [key: string]: MMRTier[];
}

export interface PositionData {
  exchange: 'binance' | 'bybit' | 'okx' | 'coindcx';
  pair: string;
  entryPrice: number;
  positionNotional: number;
  margin: number;
  leverage: number;
  isLong: boolean;
  currentPrice?: number;
}

export interface ScenarioData {
  additionalMargin: number;
  fundingRate: number;
  holdingDays: number;
}

export interface BufferInfo {
  dollars: number;
  percentage: number;
}

export interface TierCrossing {
  crossed: boolean;
  oldMMR: number;
  newMMR: number;
  oldPercent: string;
  newPercent: string;
  impact: string;
}

export interface CalculationResults {
  currentMMR: number;
  currentMMRPercent: string;
  currentLiquidationPrice: number;
  currentBuffer: BufferInfo;
  riskLevel: 'green' | 'yellow' | 'red';

  newMargin: number;
  newMMR: number;
  newMMRPercent: string;
  newLiquidationPrice: number;
  newBuffer: BufferInfo;
  marginImprovement: number;
  tierCrossing: TierCrossing | null;
  newRiskLevel: 'green' | 'yellow' | 'red';

  fundingCost: number;
  dailyFundingCost: number;
  totalSettlements: number;
  marginAfterFunding: number;
  liquidationAfterFunding: number;
  bufferAfterFunding: BufferInfo;
  fundingImpact: number;

  daysToLiquidationByFunding: number;
  hoursToLiquidationByFunding: number;
  maintenanceMarginRequired: number;
  marginAvailableForFunding: number;
}

// Real-world exchange maintenance margin tiers (USDT-margined perpetuals, BTC/ETH)
// Binance BTCUSDT: first bracket 0-50K USDT at 0.5% maintenance
export const MMR_TIERS: ExchangeMMRTiers = {
  binance: [
    { max: 50000, mmr: 0.005 },       // 0.5% for positions < $50K
    { max: 250000, mmr: 0.01 },       // 1%
    { max: 1000000, mmr: 0.02 },      // 2%
    { max: 10000000, mmr: 0.05 },     // 5%
    { max: Infinity, mmr: 0.1 },      // 10%
  ],
  bybit: [
    { max: 100000, mmr: 0.005 },      // 0.5%
    { max: 500000, mmr: 0.01 },       // 1%
    { max: 2000000, mmr: 0.02 },      // 2%
    { max: Infinity, mmr: 0.05 },     // 5%
  ],
  okx: [
    { max: 50000, mmr: 0.005 },       // 0.5%
    { max: 250000, mmr: 0.01 },       // 1%
    { max: 1000000, mmr: 0.02 },      // 2%
    { max: Infinity, mmr: 0.05 },     // 5%
  ],
  coindcx: [{ max: Infinity, mmr: 0.015 }],
};

export function getTierLabel(positionNotional: number, exchange: string): string {
  const tiers = MMR_TIERS[exchange];
  if (!tiers) return 'Unknown';
  const tierIndex = tiers.findIndex((t) => positionNotional < t.max);
  const tier = tiers[tierIndex];
  // Single-tier exchange (e.g. CoinDCX) or top tier
  if (!tier || tier.max === Infinity) {
    const prev = tiers.length >= 2 ? tiers[tiers.length - 2] : null;
    return prev ? `> $${new Intl.NumberFormat('en-US').format(prev.max)}` : 'Any size';
  }
  return `< $${new Intl.NumberFormat('en-US').format(tier.max)}`;
}

export function getCurrentMMR(positionNotional: number, exchange: string): number {
  const tiers = MMR_TIERS[exchange];
  if (!tiers) return 0.01;
  const tier = tiers.find((t) => positionNotional < t.max);
  return tier ? tier.mmr : 0.1;
}

export function mmrToPercent(mmr: number): string {
  return (mmr * 100).toFixed(2) + '%';
}

export function calculateLiquidationPrice(
  entryPrice: number,
  positionNotional: number,
  margin: number,
  mmr: number,
  isLong: boolean
): number {
  if (positionNotional === 0 || mmr === 0) return 0;
  const buffer = margin / (positionNotional * mmr);
  return isLong ? entryPrice - buffer : entryPrice + buffer;
}

export function checkTierCrossing(
  currentSize: number,
  newSize: number,
  exchange: string
): TierCrossing {
  const currentMMR = getCurrentMMR(currentSize, exchange);
  const newMMR = getCurrentMMR(newSize, exchange);
  const crossed = currentMMR !== newMMR;
  return {
    crossed,
    oldMMR: currentMMR,
    newMMR,
    oldPercent: mmrToPercent(currentMMR),
    newPercent: mmrToPercent(newMMR),
    impact: crossed ? `MMR changed from ${mmrToPercent(currentMMR)} to ${mmrToPercent(newMMR)}` : '',
  };
}

export function calculateFundingFees(
  positionNotional: number,
  fundingRate: number,
  days: number
): { totalCost: number; dailyCost: number; costPerSettlement: number; totalSettlements: number } {
  const settlementsPerDay = 3;
  const totalSettlements = Math.ceil(days * settlementsPerDay);
  const costPerSettlement = positionNotional * fundingRate;
  const totalCost = costPerSettlement * totalSettlements;
  const dailyCost = days > 0 ? totalCost / days : 0;
  return {
    totalCost: Math.max(0, totalCost),
    dailyCost: Math.max(0, dailyCost),
    costPerSettlement: Math.max(0, costPerSettlement),
    totalSettlements,
  };
}

export function calculateBuffer(
  currentPrice: number,
  liquidationPrice: number,
  entryPrice: number,
  isLong: boolean
): BufferInfo {
  const bufferAmount = Math.max(
    0,
    isLong ? currentPrice - liquidationPrice : liquidationPrice - currentPrice
  );
  const percentage = entryPrice === 0 ? 0 : (bufferAmount / entryPrice) * 100;
  return { dollars: bufferAmount, percentage };
}

export function getRiskLevel(bufferPercentage: number): 'green' | 'yellow' | 'red' {
  if (bufferPercentage >= 5) return 'green';
  if (bufferPercentage >= 2) return 'yellow';
  return 'red';
}

export function calculateDaysToLiquidation(
  positionNotional: number,
  margin: number,
  mmr: number,
  fundingRate: number
): {
  daysToLiquidation: number;
  hoursToLiquidation: number;
  maintenanceMarginRequired: number;
  marginAvailable: number;
  dailyFundingCost: number;
} {
  const maintenanceMarginRequired = positionNotional * mmr;
  const marginAvailable = Math.max(0, margin - maintenanceMarginRequired);
  const dailyFundingCost = positionNotional * fundingRate * 3;
  const daysToLiquidation =
    dailyFundingCost === 0 ? 9999 : marginAvailable / dailyFundingCost;
  return {
    daysToLiquidation: Math.min(daysToLiquidation, 9999),
    hoursToLiquidation: Math.min(daysToLiquidation * 24, 9999 * 24),
    maintenanceMarginRequired,
    marginAvailable,
    dailyFundingCost,
  };
}

export function performAllCalculations(
  position: PositionData,
  scenario: ScenarioData
): CalculationResults {
  const currentMMR = getCurrentMMR(position.positionNotional, position.exchange);
  const currentLiquidationPrice = calculateLiquidationPrice(
    position.entryPrice,
    position.positionNotional,
    position.margin,
    currentMMR,
    position.isLong
  );

  const currentPrice = position.currentPrice ?? position.entryPrice;
  const currentBuffer = calculateBuffer(
    currentPrice,
    currentLiquidationPrice,
    position.entryPrice,
    position.isLong
  );

  const newMargin = position.margin + scenario.additionalMargin;
  const newMMR = getCurrentMMR(position.positionNotional, position.exchange);
  const newLiquidationPrice = calculateLiquidationPrice(
    position.entryPrice,
    position.positionNotional,
    newMargin,
    newMMR,
    position.isLong
  );
  const newBuffer = calculateBuffer(
    currentPrice,
    newLiquidationPrice,
    position.entryPrice,
    position.isLong
  );
  const marginImprovement = position.isLong
    ? currentLiquidationPrice - newLiquidationPrice
    : newLiquidationPrice - currentLiquidationPrice;

  const tierCrossing = checkTierCrossing(
    position.positionNotional,
    position.positionNotional,
    position.exchange
  );
  // tierCrossing.crossed will always be false (same notional); we expose it
  // as informational tier data when additionalMargin > 0

  const fundingCalc = calculateFundingFees(
    position.positionNotional,
    scenario.fundingRate,
    scenario.holdingDays
  );

  const marginAfterFunding = newMargin - fundingCalc.totalCost;
  const liquidationAfterFunding = calculateLiquidationPrice(
    position.entryPrice,
    position.positionNotional,
    marginAfterFunding,
    newMMR,
    position.isLong
  );
  const bufferAfterFunding = calculateBuffer(
    currentPrice,
    liquidationAfterFunding,
    position.entryPrice,
    position.isLong
  );
  const fundingImpact = Math.abs(liquidationAfterFunding - newLiquidationPrice);

  const timeCalc = calculateDaysToLiquidation(
    position.positionNotional,
    newMargin,
    newMMR,
    scenario.fundingRate
  );

  return {
    currentMMR,
    currentMMRPercent: mmrToPercent(currentMMR),
    currentLiquidationPrice,
    currentBuffer,
    riskLevel: getRiskLevel(currentBuffer.percentage),
    newMargin,
    newMMR,
    newMMRPercent: mmrToPercent(newMMR),
    newLiquidationPrice,
    newBuffer,
    marginImprovement,
    tierCrossing: scenario.additionalMargin > 0 ? tierCrossing : null,
    newRiskLevel: getRiskLevel(newBuffer.percentage),
    fundingCost: fundingCalc.totalCost,
    dailyFundingCost: fundingCalc.dailyCost,
    totalSettlements: fundingCalc.totalSettlements,
    marginAfterFunding,
    liquidationAfterFunding,
    bufferAfterFunding,
    fundingImpact,
    daysToLiquidationByFunding: timeCalc.daysToLiquidation,
    hoursToLiquidationByFunding: timeCalc.hoursToLiquidation,
    maintenanceMarginRequired: timeCalc.maintenanceMarginRequired,
    marginAvailableForFunding: timeCalc.marginAvailable,
  };
}

export function formatUSD(value: number, decimals = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPrice(value: number, decimals = 2): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 4): string {
  return (value * 100).toFixed(decimals) + '%';
}

export function formatDays(days: number): string {
  if (days >= 9999) return '∞ days';
  if (days >= 1) return `${days.toFixed(1)} days`;
  const hours = days * 24;
  if (hours >= 1) return `${hours.toFixed(1)} hours`;
  const minutes = hours * 60;
  return `${minutes.toFixed(0)} minutes`;
}

export function validatePositionData(position: PositionData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (position.entryPrice <= 0) errors.push('Entry price must be positive');
  if (position.positionNotional <= 0) errors.push('Position size must be positive');
  if (position.margin <= 0) errors.push('Margin must be positive');
  if (position.leverage <= 0 || position.leverage > 200) errors.push('Leverage must be 0.1–200');
  return { valid: errors.length === 0, errors };
}

// ── Tool Calculators ──

export function breakEvenFundingRate(
  positionNotional: number,
  margin: number,
  mmr: number,
  holdingDays: number
): number {
  if (positionNotional <= 0 || holdingDays <= 0) return 0;
  const maintenanceMargin = positionNotional * mmr;
  const availableForFunding = Math.max(0, margin - maintenanceMargin);
  const totalSettlements = holdingDays * 3;
  return totalSettlements === 0 ? 0 : availableForFunding / (positionNotional * totalSettlements);
}

export function maxSafeLeverage(
  positionNotional: number,
  fundingRate: number,
  holdingDays: number,
  exchange: string,
  minBufferPct = 0.05
): { leverage: number; requiredMargin: number } {
  const mmr = getCurrentMMR(positionNotional, exchange);
  const totalFundingCost = positionNotional * fundingRate * 3 * holdingDays;
  const maintenanceMargin = positionNotional * mmr;
  const minBuffer = positionNotional * minBufferPct;
  const requiredMargin = maintenanceMargin + totalFundingCost + minBuffer;
  const leverage = requiredMargin > 0 ? Math.floor((positionNotional / requiredMargin) * 10) / 10 : 0;
  return { leverage: Math.max(0.1, leverage), requiredMargin };
}

export function positionSizeFromRisk(
  accountSize: number,
  maxLossPercent: number,
  entryPrice: number,
  stopLossPrice: number,
  leverage: number
): { positionSize: number; margin: number; riskAmount: number } {
  const riskAmount = accountSize * (maxLossPercent / 100);
  const priceRisk = Math.abs(entryPrice - stopLossPrice) / entryPrice;
  const positionSize = priceRisk > 0 ? riskAmount / priceRisk : 0;
  const margin = leverage > 0 ? positionSize / leverage : positionSize;
  return { positionSize, margin, riskAmount };
}

export function validateScenarioData(scenario: ScenarioData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (scenario.additionalMargin < 0) errors.push('Additional margin cannot be negative');
  if (scenario.fundingRate < -0.001) errors.push('Funding rate too low (min -0.1%)');
  if (scenario.fundingRate > 0.1) errors.push('Funding rate too high (max 10%)');
  if (scenario.holdingDays <= 0) errors.push('Holding days must be positive');
  if (scenario.holdingDays > 365) errors.push('Holding days should be ≤ 1 year');
  return { valid: errors.length === 0, errors };
}
