import { calculateSMA, calculateRSI } from './coingeckoClient';

describe('calculateSMA', () => {
  it('calculates correct SMA for simple data', () => {
    // Prices: 1, 2, 3, 4, 5
    const prices: [number, number][] = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5]
    ];
    // SMA(3): [(1+2+3)/3=2, (2+3+4)/3=3, (3+4+5)/3=4]
    expect(calculateSMA(prices, 3)).toEqual([2, 3, 4]);
  });

  it('returns empty array if not enough data', () => {
    const prices: [number, number][] = [[0, 1], [1, 2]];
    expect(calculateSMA(prices, 3)).toEqual([]);
  });
  it('calculates correct SMA for constant prices', () => {
    const prices: [number, number][] = Array.from({ length: 10 }, (_, i) => [i, 5]);
    const result = calculateSMA(prices, 5);
    expect(result).toEqual(Array(6).fill(5));
  });
  
});

describe('calculateRSI', () => {
  it('calculates correct RSI for known example', () => {
    // Example with 15 days, increasing price
    const prices: [number, number][] = Array.from({ length: 16 }, (_, i) => [i, i + 1]);
    // All gains, no losses, RSI should be 100 after first window
    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBe(2); // (16 - 14)
    expect(rsi[0]).toBe(100);
    expect(rsi[1]).toBe(100);
  });

  it('returns empty array if not enough data', () => {
    const prices: [number, number][] = Array.from({ length: 10 }, (_, i) => [i, i + 1]);
    expect(calculateRSI(prices, 14)).toEqual([]);
  });

  it('calculates RSI with both gains and losses', () => {
    // Prices: [1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1]
    const prices: [number, number][] = Array.from({ length: 15 }, (_, i) => [i, 1 + (i % 2)]);
    // There are gains and losses, RSI should be around 50
    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBe(1);
    expect(rsi[0]).toBeGreaterThanOrEqual(45);
    expect(rsi[0]).toBeLessThanOrEqual(55);
  });

  it('calculates RSI with known gain/loss pattern', () => {
    const prices: [number, number][] = [
      [0, 1], [1, 2], [2, 1], [3, 2], [4, 1], [5, 2],
      [6, 1], [7, 2], [8, 1], [9, 2], [10, 1], [11, 2],
      [12, 1], [13, 2], [14, 1], [15, 2]
    ];
    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBe(2);
    expect(rsi[1]).toBeGreaterThan(40);
    expect(rsi[1]).toBeLessThan(60);
  });
  
  it('RSI should be 0 when all prices are falling', () => {
    const prices: [number, number][] = Array.from({ length: 16 }, (_, i) => [i, 100 - i]);
    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBe(2);
    expect(rsi[0]).toBe(0);
    expect(rsi[1]).toBe(0);
  });
  
  it('RSI should be 50 when prices don’t change', () => {
    const prices: [number, number][] = Array.from({ length: 16 }, (_, i) => [i, 5]);
    const rsi = calculateRSI(prices, 14);
    expect(rsi.length).toBe(2);
    expect(rsi[0]).toBe(50);
    expect(rsi[1]).toBe(50);
  });
  
});
