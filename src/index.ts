// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import nodeCron from 'node-cron';
import { StrikeClient } from './strikeClient';

dotenv.config();

import { getBuyLevelMultiplier, BuyLevelConfig } from './buyLevelCalculator';

interface Config {
  apiKey: string;
  dcaAmount?: number; // Optional
  dcaFrequency: string;
  sourceCurrency: string;
  targetCurrency: string;
  environment: 'sandbox' | 'production';
  dcaBuyDays?: string[]; // Optional: days allowed for DCA
  overboughtMultiplier?: number;
  oversoldMultiplier?: number;
  neutralMultiplier?: number;
}

const config: Config = {
  apiKey: process.env.STRIKE_API_KEY || '',
  dcaAmount: process.env.DCA_AMOUNT ? parseFloat(process.env.DCA_AMOUNT) : undefined,
  dcaFrequency: process.env.DCA_FREQUENCY || '0 0 * * 1', // Every Monday at midnight
  sourceCurrency: process.env.SOURCE_CURRENCY || 'USD',
  targetCurrency: process.env.TARGET_CURRENCY || 'BTC',
  environment: (process.env.STRIKE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
  dcaBuyDays: process.env.DCA_BUY_DAYS ? process.env.DCA_BUY_DAYS.split(',').map(day => day.trim().toUpperCase()) : undefined,
  overboughtMultiplier: process.env.OVERBOUGHT_MULTIPLIER ? parseFloat(process.env.OVERBOUGHT_MULTIPLIER) : undefined,
  oversoldMultiplier: process.env.OVERSOLD_MULTIPLIER ? parseFloat(process.env.OVERSOLD_MULTIPLIER) : undefined,
  neutralMultiplier: process.env.NEUTRAL_MULTIPLIER ? parseFloat(process.env.NEUTRAL_MULTIPLIER) : undefined
};

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

const strikeClient = new StrikeClient(config.apiKey, config.environment);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Get account balances
app.get('/balances', async (req, res) => {
  try {
    const balances = await strikeClient.getAccountBalances();
    res.json(balances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch balances' });
  }
});

// Execute DCA
async function executeDca(): Promise<void> {
  try {
    // Check if today is an allowed DCA day
    if (config.dcaBuyDays && config.dcaBuyDays.length > 0) {
      const today = new Date();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = dayNames[today.getDay()];
      if (!config.dcaBuyDays.includes(todayName)) {
        console.log(`Today (${todayName}) is not in DCA_BUY_DAYS (${config.dcaBuyDays.join(', ')}). Skipping DCA execution.`);
        return;
      }
    }
    console.log('Starting DCA execution...');
    
    // Check current balance
    const balances = await strikeClient.getAccountBalances();
    const sourceBalance = balances.find((b: any) => b.currency === config.sourceCurrency);
    
    const available = sourceBalance ? parseFloat(sourceBalance.available) : 0;
    if (available === 0) {
      console.log(`No available ${config.sourceCurrency} balance. Skipping DCA execution.`);
      return;
    }
    let amountToExchange: number;
    if (typeof config.dcaAmount === 'number' && !isNaN(config.dcaAmount)) {
      if (available < config.dcaAmount) {
        amountToExchange = available;
        console.log(`Available ${config.sourceCurrency} (${available}) is less than DCA_AMOUNT (${config.dcaAmount}). Exchanging entire available balance.`);
      } else {
        amountToExchange = config.dcaAmount;
        console.log(`Using fixed DCA amount: ${amountToExchange} ${config.sourceCurrency}`);
      }
    } else {
      amountToExchange = available;
      console.log(`No DCA_AMOUNT set; using entire available balance: ${amountToExchange} ${config.sourceCurrency}`);
    }

    // --- BUY LEVEL LOGIC ---
    // Fetch recent prices for buy level calculation
    let buyMultiplier = 1.0;
    try {
      const { fetchMarketChart } = await import('./coingeckoClient');
      const chart = await fetchMarketChart(config.targetCurrency.toLowerCase(), config.sourceCurrency.toLowerCase(), 210);
      const buyLevelConfig: BuyLevelConfig = {
        overboughtMultiplier: config.overboughtMultiplier,
        oversoldMultiplier: config.oversoldMultiplier,
        neutralMultiplier: config.neutralMultiplier,
      };
      buyMultiplier = getBuyLevelMultiplier(chart.prices, buyLevelConfig);
      console.log(`Buy level multiplier determined: ${buyMultiplier}`);
    } catch (err) {
      console.warn('Could not determine buy level multiplier, defaulting to 1.0:', err);
    }
    amountToExchange *= buyMultiplier;
    if (amountToExchange > available) {
      console.log(`Adjusted amount (${amountToExchange}) exceeds available balance (${available}). Using available balance.`);
      amountToExchange = available;
    }
    console.log(`Adjusted amount to exchange after buy level: ${amountToExchange}`);

    console.log(`Current ${config.sourceCurrency} balance:`, sourceBalance.available);
    
    // Create and execute currency exchange
    const quote = await strikeClient.createCurrencyExchangeQuote(
      config.sourceCurrency,
      config.targetCurrency,
      amountToExchange
    );

    console.log(`Created exchange quote:`, {
      quoteId: quote.id,
      rate: quote.conversionRate?.amount,
      sourceAmount: quote.source?.amount,
      targetAmount: quote.target?.amount
    });

    await strikeClient.executeCurrencyExchange(quote.id);
    console.log('DCA execution successful!');
    
  } catch (error) {
    console.error('Error executing DCA:', error);
  }
}

// Schedule DCA execution
if (config.apiKey) {
  nodeCron.schedule(config.dcaFrequency, executeDca);
  console.log(`DCA scheduled to run with frequency: ${config.dcaFrequency}`);
} else {
  console.warn('No STRIKE_API_KEY provided. DCA scheduling is disabled.');
}

// Start server
app.listen(PORT, () => {
  console.log(`DCA Bot running on port ${PORT}`);
  console.log(`Configuration:`, {
      ...config,
      apiKey: '***',
  });
});