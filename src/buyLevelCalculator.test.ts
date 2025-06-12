import { getBuyLevelMultiplier, BuyLevelConfig } from './buyLevelCalculator';

// Mock isOverbought and isOversold for deterministic tests
jest.mock('./obOsSignal', () => ({
  isOverbought: jest.fn(),
  isOversold: jest.fn(),
}));

const { isOverbought, isOversold } = require('./obOsSignal');

describe('getBuyLevelMultiplier', () => {
  const prices: [number, number][] = [
    [0, 100], [1, 101], [2, 102],
  ];
  const config: BuyLevelConfig = {
    overboughtMultiplier: 0.5,
    oversoldMultiplier: 2,
    neutralMultiplier: 1,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns overboughtMultiplier if overbought', () => {
    isOverbought.mockReturnValue(true);
    isOversold.mockReturnValue(false);
    expect(getBuyLevelMultiplier(prices, config)).toBe(0.5);
  });

  it('returns oversoldMultiplier if oversold', () => {
    isOverbought.mockReturnValue(false);
    isOversold.mockReturnValue(true);
    expect(getBuyLevelMultiplier(prices, config)).toBe(2);
  });

  it('returns neutralMultiplier if neither overbought nor oversold', () => {
    isOverbought.mockReturnValue(false);
    isOversold.mockReturnValue(false);
    expect(getBuyLevelMultiplier(prices, config)).toBe(1);
  });

  it('uses default multipliers if config not provided', () => {
    isOverbought.mockReturnValue(false);
    isOversold.mockReturnValue(false);
    expect(getBuyLevelMultiplier(prices)).toBe(1.0);
  });

  it('prefers overbought over oversold if both true', () => {
    isOverbought.mockReturnValue(true);
    isOversold.mockReturnValue(true);
    expect(getBuyLevelMultiplier(prices, config)).toBe(0.5);
  });
});
