import React from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface ChartProps {
  symbol: string;
}

export const Chart: React.FC<ChartProps> = ({ symbol }) => {
  // Map our internal symbol to TradingView symbol
  const getTvSymbol = (sym: string) => {
    const cleanSym = sym.replace('/', '');
    if (sym.includes('BTC') || sym.includes('ETH')) {
      return `BINANCE:${cleanSym}`;
    }
    if (sym.includes('XAU')) {
      return `OANDA:XAUUSD`;
    }
    return `FX:${cleanSym}`;
  };

  const tvSymbol = getTvSymbol(symbol);

  return (
    <div className="w-full h-full min-h-[500px]">
      <AdvancedRealTimeChart 
        theme="dark"
        symbol={tvSymbol}
        interval="1"
        timezone="Etc/UTC"
        style="1"
        locale="id"
        enable_publishing={false}
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={false}
        container_id={`tradingview_${symbol.replace('/', '_')}`}
        autosize
        studies={[
          "RSI@tv-basicstudies",
          "MACD@tv-basicstudies",
          "MASimple@tv-basicstudies",
          "BollingerBandsR@tv-basicstudies"
        ]}
      />
    </div>
  );
};
