import axios from 'axios';

const COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';

export interface MarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

/**
 * Fetches historical market chart data for a given coin and currency.
 * @param coinId CoinGecko coin id (e.g., 'bitcoin')
 * @param vsCurrency Quote currency (e.g., 'usd')
 * @param days Number of days to fetch (e.g., 200)
 */
export async function fetchMarketChart(
  coinId: string,
  vsCurrency: string,
  days: number
): Promise<MarketChartResponse> {
  const url = `${COINGECKO_API_BASE}/coins/${coinId}/market_chart`;
  const response = await axios.get(url, {
    params: {
      vs_currency: vsCurrency,
      days,
      interval: 'daily',
    },
  });
  console.debug('Market chart response successfully fetched.');
  return response.data;
}

/**
 * Calculates the simple moving average (SMA) for the given price data.
 * @param prices Array of [timestamp, price] pairs
 * @param window Number of days for the moving average
 */
export function calculateSMA(prices: [number, number][], window: number): number[] {
  const sma: number[] = [];
  for (let i = window - 1; i < prices.length; i++) {
    const windowSlice = prices.slice(i - window + 1, i + 1);
    const sum = windowSlice.reduce((acc, [, price]) => acc + price, 0);
    sma.push(sum / window);
  }
  
  return sma;
}

/**
 * Calculates the Relative Strength Index (RSI) for the given price data.
 * @param prices Array of [timestamp, price] pairs
 * @param window Number of days for RSI (default 14)
 * @returns Array of RSI values (aligned with the end of each window)
 */
export function calculateRSI(prices: [number, number][], window: number = 14): number[] {
  if (prices.length < window + 1) return [];
  const values = prices.map(([, price]) => price);
  const rsi: number[] = [];
  
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= window; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / window;
  let avgLoss = losses / window;

  if (avgGain === 0 && avgLoss === 0) {
    rsi.push(50);
  } else if (avgLoss === 0) {
    rsi.push(100);
  } else {
    rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
  }

  for (let i = window + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) {
      avgGain = ((avgGain * (window - 1)) + diff) / window;
      avgLoss = (avgLoss * (window - 1)) / window;
    } else {
      avgGain = (avgGain * (window - 1)) / window;
      avgLoss = ((avgLoss * (window - 1)) + Math.abs(diff)) / window;
    }
    if (avgGain === 0 && avgLoss === 0) {
      rsi.push(50);
    } else if (avgLoss === 0) {
      rsi.push(100);
    } else {
      rsi.push(100 - (100 / (1 + avgGain / avgLoss)));
    }
  }

  return rsi;
}
