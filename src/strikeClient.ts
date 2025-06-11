// src/strikeClient.ts
import axios, { AxiosError, AxiosInstance } from 'axios';

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
    console.log(`Creating currency exchange quote for ${amount} ${sourceCurrency} to ${targetCurrency}`);
    const requestBody = {
      sell: sourceCurrency,
      buy: targetCurrency,
      amount: {
        amount: amount.toFixed(2),
        currency: sourceCurrency
      }
    };
    try {
      const response = await this.client.post('/currency-exchange-quotes', requestBody);
      console.log('Currency exchange quote response:', response.data);
      return response.data;
    } catch (error) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as AxiosError;
        console.error('Error creating currency exchange quote:', axiosError.response?.data || error);
      } else {
        console.error('Error creating currency exchange quote:', error);
      }
      throw error;
    }
  }

  /**
   * Executes a currency exchange quote by ID. Per Strike API, returns 202 Accepted and no body.
   */
  async executeCurrencyExchange(quoteId: string): Promise<void> {
    try {
      const response = await this.client.patch(
        `/currency-exchange-quotes/${quoteId}/execute`,
        {}
      );
      if (response.status === 202) {
        console.log('Currency exchange execution accepted (202).');
      } else {
        console.warn(`Unexpected status executing currency exchange: ${response.status}`);
      }
      // No body returned per API docs
    } catch (error) {
      console.error('Error executing currency exchange:', error);
      throw error;
    }
  }
}