import { isOverbought, isOversold } from './obOsSignal';

export interface BuyLevelConfig {
  overboughtMultiplier?: number; // e.g. 0.8
  oversoldMultiplier?: number;   // e.g. 1.2
  neutralMultiplier?: number;    // e.g. 1.0
}

/**
 * Calculate buy level multiplier based on market state (overbought/oversold/neutral)
 * @param prices Array of [timestamp, price] pairs
 * @param config Optional config for multipliers
 * @returns Multiplier for buy amount
 */
export function getBuyLevelMultiplier(
  prices: [number, number][],
  config?: BuyLevelConfig
): number {
  const overbought = isOverbought(prices);
  const oversold = isOversold(prices);
  const {
    overboughtMultiplier = 0.8,
    oversoldMultiplier = 1.2,
    neutralMultiplier = 1.0,
  } = config || {};

  if (overbought) return overboughtMultiplier;
  if (oversold) return oversoldMultiplier;
  return neutralMultiplier;
}
