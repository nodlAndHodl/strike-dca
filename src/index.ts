// src/index.ts
import express from 'express';
import dotenv from 'dotenv';
import nodeCron from 'node-cron';
import { StrikeClient } from './strikeClient';

dotenv.config();

import { getBuyLevelMultiplier, BuyLevelConfig } from './buyLevelCalculator';

import appConfig from './config/appConfig';
import { fetchMarketChart } from './coingeckoClient';

const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  USD: 'usd',
};

const app = express();
app.use(express.json());
const PORT = appConfig.port;

const strikeClient = new StrikeClient(appConfig.apiKey, appConfig.environment);

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
    if (appConfig.dcaBuyDays && appConfig.dcaBuyDays.length > 0) {
      const today = new Date();
      const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
      const todayName = dayNames[today.getDay()];
      if (!appConfig.dcaBuyDays.includes(todayName)) {
        console.log(`Today (${todayName}) is not in DCA_BUY_DAYS (${appConfig.dcaBuyDays.join(', ')}). Skipping DCA execution.`);
        return;
      }
    }
    console.log('Starting DCA execution...');
    
    // --- BUY LEVEL LOGIC ---
    // Fetch recent prices for buy level calculation
    let buyMultiplier = 1.0;
    // Map appConfig currency symbols to CoinGecko IDs
    const targetId = COINGECKO_IDS[appConfig.targetCurrency.toUpperCase()] || appConfig.targetCurrency.toLowerCase(); //BTC
    const sourceId = COINGECKO_IDS[appConfig.sourceCurrency.toUpperCase()] || appConfig.sourceCurrency.toLowerCase(); //USD
    try {
      const chart = await fetchMarketChart(targetId, sourceId, 210);
      const buyLevelConfig: BuyLevelConfig = {
        overboughtMultiplier: appConfig.overboughtMultiplier,
        oversoldMultiplier: appConfig.oversoldMultiplier,
        neutralMultiplier: appConfig.neutralMultiplier,
      };

      buyMultiplier = getBuyLevelMultiplier(chart.prices, buyLevelConfig);
      console.log(`Buy level multiplier determined: ${buyMultiplier}`);
    } catch (cgErr) {
      // Type guard for AxiosError (fixes TS lint for primitives)
      const isObject = typeof cgErr === 'object' && cgErr !== null;
      const errorData = (isObject && 'response' in (cgErr as object) && (cgErr as any).response && 'data' in (cgErr as any).response)
        ? (cgErr as any).response.data
        : cgErr;
      console.error(`CoinGecko error for pair [${appConfig.targetCurrency}->${targetId}/${appConfig.sourceCurrency}->${sourceId}]:`, errorData);
      console.warn('Could not determine buy level multiplier, defaulting to 1.0.');
    }

    // Check current balance
    const balances = await strikeClient.getAccountBalances();
    const sourceBalance = balances.find((b: any) => b.currency === appConfig.sourceCurrency);
    
    const available = sourceBalance ? parseFloat(sourceBalance.available) : 0;
    if (available === 0) {
      console.log(`No available ${appConfig.sourceCurrency} balance. Skipping DCA execution.`);
      return;
    }
    let amountToExchange: number;
    if (typeof appConfig.dcaAmount === 'number' && !isNaN(appConfig.dcaAmount)) {
      if (available < appConfig.dcaAmount) {
        amountToExchange = available;
        console.log(`Available ${appConfig.sourceCurrency} (${available}) is less than DCA_AMOUNT (${appConfig.dcaAmount}). Exchanging entire available balance.`);
      } else {
        amountToExchange = appConfig.dcaAmount;
        console.log(`Using fixed DCA amount: ${amountToExchange} ${appConfig.sourceCurrency}`);
      }
    } else {
      amountToExchange = available;
      console.log(`No DCA_AMOUNT set; using entire available balance: ${amountToExchange} ${appConfig.sourceCurrency}`);
    }


    amountToExchange *= buyMultiplier;
    if (amountToExchange > available) {
      console.log(`Adjusted amount (${amountToExchange}) exceeds available balance (${available}). Using available balance.`);
      amountToExchange = available;
    }
    console.log(`Adjusted amount to exchange after buy level: ${amountToExchange}`);

    console.log(`Current ${appConfig.sourceCurrency} balance:`, sourceBalance.available);
    
    // Create and execute currency exchange
    const quote = await strikeClient.createCurrencyExchangeQuote(
      appConfig.sourceCurrency,
      appConfig.targetCurrency,
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
if (appConfig.apiKey) {
  nodeCron.schedule(appConfig.dcaFrequency, executeDca);
  console.log(`DCA scheduled to run with frequency: ${appConfig.dcaFrequency}`);
} else {
  console.warn('No STRIKE_API_KEY provided. DCA scheduling is disabled.');
}

// Start server
app.listen(PORT, () => {
  console.log(`DCA Bot running on port ${PORT}`);
  console.log(`Configuration:`, {
      ...appConfig,
      apiKey: '***',
  });
});