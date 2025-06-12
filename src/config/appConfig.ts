import dotenv from 'dotenv';
dotenv.config();

export interface AppConfig {
  apiKey: string;
  dcaAmount?: number;
  dcaFrequency: string;
  sourceCurrency: string;
  targetCurrency: string;
  environment: 'sandbox' | 'production';
  dcaBuyDays?: string[];
  overboughtMultiplier?: number;
  oversoldMultiplier?: number;
  neutralMultiplier?: number;
  port: number;
}

const appConfig: AppConfig = {
  apiKey: process.env.STRIKE_API_KEY || '',
  dcaAmount: process.env.DCA_AMOUNT ? parseFloat(process.env.DCA_AMOUNT) : undefined,
  dcaFrequency: process.env.DCA_FREQUENCY || '0 0 * * 1',
  sourceCurrency: process.env.SOURCE_CURRENCY || 'USD',
  targetCurrency: process.env.TARGET_CURRENCY || 'BTC',
  environment: (process.env.STRIKE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  dcaBuyDays: process.env.DCA_BUY_DAYS ? process.env.DCA_BUY_DAYS.split(',').map(day => day.trim().toUpperCase()) : undefined,
  overboughtMultiplier: process.env.OVERBOUGHT_MULTIPLIER ? parseFloat(process.env.OVERBOUGHT_MULTIPLIER) : undefined,
  oversoldMultiplier: process.env.OVERSOLD_MULTIPLIER ? parseFloat(process.env.OVERSOLD_MULTIPLIER) : undefined,
  neutralMultiplier: process.env.NEUTRAL_MULTIPLIER ? parseFloat(process.env.NEUTRAL_MULTIPLIER) : undefined,
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
};

export default appConfig;
