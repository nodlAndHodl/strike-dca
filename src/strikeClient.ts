// src/strikeClient.ts
import axios, { AxiosInstance } from 'axios';

export class StrikeClient {
  private client: AxiosInstance;
  private baseUrl: string;

  constructor(apiKey: string, environment: 'sandbox' | 'production' = 'sandbox') {
    this.baseUrl = environment === 'production' 
      ? 'https://api.strike.me/v1' 
      : 'https://api.dev.strike.me/v1';

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  async getAccountBalances() {
    try {
      const response = await this.client.get('/balances');
      return response.data;
    } catch (error) {
      console.error('Error fetching account balances:', error);
      throw error;
    }
  }

  async createCurrencyExchangeQuote(
    sourceCurrency: string,
    targetCurrency: string,
    amount: number
  ) {
    try {
      const response = await this.client.post('/currency-exchange-quotes', {
        sourceCurrency,
        targetCurrency,
        amount: amount.toString()
      });
      return response.data;
    } catch (error) {
      console.error('Error creating currency exchange quote:', error);
      throw error;
    }
  }

  async executeCurrencyExchange(quoteId: string) {
    try {
      const response = await this.client.patch(
        `/currency-exchange-quotes/${quoteId}/execute`,
        {}
      );
      return response.data;
    } catch (error) {
      console.error('Error executing currency exchange:', error);
      throw error;
    }
  }
}