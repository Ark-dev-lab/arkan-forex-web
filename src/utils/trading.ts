import { Trade } from '../types';

export const getMultiplier = (symbol: string): number => {
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    return 1; // 1 unit per lot for crypto
  } else if (symbol.includes('XAU')) {
    return 100; // 100 oz per lot for gold
  }
  return 100000; // Standard lot size for forex
};

export const getPipValue = (symbol: string): number => {
  if (symbol.includes('BTC') || symbol.includes('ETH')) {
    return 100; // 100 USD per point for crypto
  } else if (symbol.includes('JPY')) {
    return 0.01; // 0.01 per pip for JPY pairs
  } else if (symbol.includes('XAU')) {
    return 0.1; // 0.1 per pip for gold
  }
  return 0.0001; // Standard 0.0001 per pip for forex
};

export const calculateProfit = (trade: Trade, currentPrice: number): number => {
  if (trade.status === 'CLOSED' && trade.profit !== undefined) {
    return trade.profit;
  }
  
  const multiplier = getMultiplier(trade.pair);
  
  let profit = 0;
  if (trade.type === 'BUY') {
    profit = (currentPrice - trade.entryPrice) * trade.lots * multiplier;
  } else {
    profit = (trade.entryPrice - currentPrice) * trade.lots * multiplier;
  }

  // Handle USD/JPY specifically if needed for conversion, 
  // but since we assume account is in USD and pairs are XXX/USD or USD/XXX,
  // we might need to divide by currentPrice if USD is the base currency.
  if (trade.pair.startsWith('USD/') && !trade.pair.includes('BTC') && !trade.pair.includes('ETH')) {
    profit = profit / currentPrice;
  }
  
  return profit;
};

export const calculateMargin = (trade: any, currentPrice: number, leverage: number = 100): number => {
  const multiplier = getMultiplier(trade.pair);
  return (trade.entryPrice * trade.lots * multiplier) / leverage;
};
