// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import nodeCron from 'node-cron';
import { StrikeClient } from './strikeClient';

dotenv.config();

interface Config {
  apiKey: string;
  dcaAmount?: number; // Optional
  dcaFrequency: string;
  sourceCurrency: string;
  targetCurrency: string;
  environment: 'sandbox' | 'production';
}

const config: Config = {
  apiKey: process.env.STRIKE_API_KEY || '',
  dcaAmount: process.env.DCA_AMOUNT ? parseFloat(process.env.DCA_AMOUNT) : undefined,
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
    sourceCurrency: config.sourceCurrency,
    targetCurrency: config.targetCurrency,
    dcaAmount: config.dcaAmount,
    environment: config.environment
  });
});