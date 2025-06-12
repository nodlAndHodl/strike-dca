import { isOverbought, isOversold, checkOverboughtExample, checkOversoldExample } from './obOsSignal';
import * as coingeckoClient from './coingeckoClient';

describe('OB/OS Signal', () => {
  const mockPricesOverbought: [number, number][] = Array.from({ length: 210 }, (_, i) => [i, 100 + i]); // steadily increasing
  const mockPricesOversold: [number, number][] = Array.from({ length: 210 }, (_, i) => [i, 200 - i]); // steadily decreasing
  const mockPricesNeutral: [number, number][] = Array.from({ length: 210 }, (_, i) => [i, 100]); // flat

  it('detects overbought', () => {
    // artificially pump last price and RSI
    const prices: [number, number][] = mockPricesOverbought.map(([t, p], idx, arr) =>
      idx === arr.length - 1 ? [t, p * 1.2] as [number, number] : [t, p] as [number, number]
    );
    expect(isOverbought(prices)).toBe(true);
  });

  it('detects oversold', () => {
    // artificially dump last price and RSI
    const prices: [number, number][] = mockPricesOversold.map(([t, p], idx, arr) =>
      idx === arr.length - 1 ? [t, p * 0.8] as [number, number] : [t, p] as [number, number]
    );
    expect(isOversold(prices)).toBe(true);
  });

  it('does not trigger on neutral', () => {
    expect(isOverbought(mockPricesNeutral)).toBe(false);
    expect(isOversold(mockPricesNeutral)).toBe(false);
  });

  describe('example functions', () => {
    beforeAll(() => {
      jest.spyOn(coingeckoClient, 'fetchMarketChart').mockImplementation(async () => ({
        prices: mockPricesOverbought,
        market_caps: [],
        total_volumes: [],
      }));
    });
    afterAll(() => {
      jest.restoreAllMocks();
    });
    it('checkOverboughtExample returns true for mocked data', async () => {
      const result = await checkOverboughtExample();
      expect(result).toBe(true);
    });
    it('checkOversoldExample returns false for mocked data', async () => {
      // mock fetchMarketChart to return oversold prices
      jest.spyOn(coingeckoClient, 'fetchMarketChart').mockImplementation(async () => ({
        prices: mockPricesOversold,
        market_caps: [],
        total_volumes: [],
      }));
      const result = await checkOversoldExample();
      expect(result).toBe(true);
    });
  });
});
