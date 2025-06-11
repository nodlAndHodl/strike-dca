# DCA Strike Bot

A Dollar Cost Averaging bot built with Express.js and TypeScript that integrates with the Strike API.

## Features

- Automated DCA execution
- Configurable frequency and amount
- Real-time balance checking
- Currency exchange execution
- Health check endpoint
- Error handling and logging


## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with your configuration:
```
STRIKE_API_KEY=your_strike_api_key_here
DCA_AMOUNT=100
DCA_FREQUENCY="0 0 * * 1"  # Every Monday at midnight
SOURCE_CURRENCY=USD
TARGET_CURRENCY=BTC
ENVIRONMENT=production  # or 'sandbox' for testing
```

- `STRIKE_API_KEY`: Your Strike API key
- `DCA_AMOUNT`: Amount to exchange each interval (in source currency)
- `DCA_FREQUENCY`: Cron schedule for DCA (e.g. every minute: `* * * * *`)
- `SOURCE_CURRENCY`: Currency you are selling (e.g. USD)
- `TARGET_CURRENCY`: Currency you are buying (e.g. BTC)
- `ENVIRONMENT`: `production` or `sandbox`

3. Build the project (optional for dev mode):
```bash
npm run build
```

4. Start the server in production mode:
```bash
npm start
```

5. For development with hot reload:
```bash
npm run dev
```

## How it works

- The bot checks your account balance for the source currency.
- It creates a currency exchange quote using the Strike API.
- It immediately executes the quote (PATCH request as per Strike API docs).
- Logs the quote details and execution status.

Example output:
```
DCA scheduled to run with frequency: * * * * *
DCA Bot running on port 3000
Configuration: {
  sourceCurrency: 'USD',
  targetCurrency: 'BTC',
  dcaAmount: 1,
  environment: 'production'
}
Starting DCA execution...
Current USD balance: 1.00
Creating currency exchange quote for 1 USD to BTC
Currency exchange quote response: {
  id: '...'
  ...
}
Created exchange quote: { quoteId: '...', rate: '...', sourceAmount: '...', targetAmount: '...' }
Currency exchange execution accepted (202).
DCA execution successful!
```

## Notes
- Ensure your Strike account has sufficient balance and API permissions.
- All errors and API responses are logged for debugging.
- For more info, see the [Strike API docs](https://docs.strike.me/walkthrough/exchanging-currencies).

5. For development:
```bash
npm run dev
```

## API Endpoints

- `GET /health` - Health check endpoint

## Environment Variables

- `STRIKE_API_KEY`: Your Strike API key
- `DCA_AMOUNT`: Amount to invest each period
- `DCA_FREQUENCY`: Cron expression for DCA frequency
- `CURRENCY`: Base currency for DCA (default: USD)
