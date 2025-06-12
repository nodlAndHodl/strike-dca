import { calculateRSI, calculateSMA, fetchMarketChart } from './coingeckoClient';

/**
 * Evaluates if the current market is overbought using RSI and SMA 200.
 * @param prices Array of [timestamp, price] pairs (sorted oldest to newest)
 * @param rsiWindow RSI window (default 14)
 * @param smaWindow SMA window (default 200)
 * @returns true if overbought, false otherwise
 */
export function isOverbought(
  prices: [number, number][],
  rsiWindow: number = 14,
  smaWindow: number = 200
): boolean {
  if (prices.length < Math.max(rsiWindow, smaWindow)) return false;

  const smaArr = calculateSMA(prices, smaWindow);
  const rsiArr = calculateRSI(prices, rsiWindow);

  // Align indices to latest data
  const latestPrice = prices[prices.length - 1][1];
  const latestSMA = smaArr[smaArr.length - 1];
  const latestRSI = rsiArr[rsiArr.length - 1];

  // Typical overbought: RSI > 70 and price > SMA200
  return latestRSI > 70 && latestPrice > latestSMA;
}

/**
 * Evaluates if the current market is oversold using RSI and SMA 200.
 * @param prices Array of [timestamp, price] pairs (sorted oldest to newest)
 * @param rsiWindow RSI window (default 14)
 * @param smaWindow SMA window (default 200)
 * @returns true if oversold, false otherwise
 */
export function isOversold(
  prices: [number, number][],
  rsiWindow: number = 14,
  smaWindow: number = 200
): boolean {
  if (prices.length < Math.max(rsiWindow, smaWindow)) return false;

  const smaArr = calculateSMA(prices, smaWindow);
  const rsiArr = calculateRSI(prices, rsiWindow);

  const latestPrice = prices[prices.length - 1][1];
  const latestSMA = smaArr[smaArr.length - 1];
  const latestRSI = rsiArr[rsiArr.length - 1];

  // Typical oversold: RSI < 30 and price < SMA200
  return latestRSI < 30 && latestPrice < latestSMA;
}

/**
 * Example usage: fetch data and evaluate overbought
 */
export async function checkOverboughtExample() {
  const data = await fetchMarketChart('bitcoin', 'usd', 210);
  const prices = data.prices;
  const overbought = isOverbought(prices);
  console.log('Overbought:', overbought);
  return overbought;
}

/**
 * Example usage: fetch data and evaluate oversold
 */
export async function checkOversoldExample() {
  const data = await fetchMarketChart('bitcoin', 'usd', 210);
  const prices = data.prices;
  const oversold = isOversold(prices);
  console.log('Oversold:', oversold);
  return oversold;
}
