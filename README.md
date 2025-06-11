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
STRIKE_API_KEY=your_stripe_api_key_here
DCA_AMOUNT=100
DCA_FREQUENCY="0 0 * * 1"  # Every Monday at midnight
CURRENCY=USD
```

3. Build the project:
```bash
npm run build
```

4. Start the server:
```bash
npm start
```

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
