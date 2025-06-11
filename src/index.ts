// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import nodeCron from 'node-cron';
import { StrikeClient } from './strikeClient';

dotenv.config();

interface Config {
  apiKey: string;
  dcaAmount: number;
  dcaFrequency: string;
  sourceCurrency: string;
  targetCurrency: string;
  environment: 'sandbox' | 'production';
}

const config: Config = {
  apiKey: process.env.STRIKE_API_KEY || '',
  dcaAmount: parseFloat(process.env.DCA_AMOUNT || '100'),
  dcaFrequency: process.env.DCA_FREQUENCY || '0 0 * * 1', // Every Monday at midnight
  sourceCurrency: process.env.SOURCE_CURRENCY || 'USD',
  targetCurrency: process.env.TARGET_CURRENCY || 'BTC',
  environment: (process.env.STRIKE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox'
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
    console.log('Starting DCA execution...');
    
    // Check current balance
    const balances = await strikeClient.getAccountBalances();
    const sourceBalance = balances.find((b: any) => b.currency === config.sourceCurrency);
    
    if (!sourceBalance || parseFloat(sourceBalance.available) < config.dcaAmount) {
      throw new Error(`Insufficient ${config.sourceCurrency} balance for DCA`);
    }

    console.log(`Current ${config.sourceCurrency} balance:`, sourceBalance.available);
    
    // Create and execute currency exchange
    const quote = await strikeClient.createCurrencyExchangeQuote(
      config.sourceCurrency,
      config.targetCurrency,
      config.dcaAmount
    );

    console.log(`Created exchange quote:`, {
      quoteId: quote.id,
      rate: quote.rate,
      sourceAmount: quote.sourceAmount.amount,
      targetAmount: quote.targetAmount.amount
    });

    const result = await strikeClient.executeCurrencyExchange(quote.id);
    console.log('DCA execution successful:', result);
    
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
    sourceCurrency: config.sourceCurrency,
    targetCurrency: config.targetCurrency,
    dcaAmount: config.dcaAmount,
    environment: config.environment
  });
});