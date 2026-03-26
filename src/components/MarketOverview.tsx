import React from 'react';
import { TrendingUp, TrendingDown, Search, Globe } from 'lucide-react';
import { MarketAsset } from '../types';

interface MarketOverviewProps {
  assets: MarketAsset[];
  onSelect: (symbol: string) => void;
  selectedSymbol: string;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ assets, onSelect, selectedSymbol }) => {
  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col h-full">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200">Tinjauan Pasar</h3>
        </div>
        <button className="text-slate-400 hover:text-white transition-colors">
          <Search className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-slate-800 text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
            <tr>
              <th className="px-4 py-3 font-medium">Simbol</th>
              <th className="px-4 py-3 font-medium text-right">Harga</th>
              <th className="px-4 py-3 font-medium text-right">Perubahan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {assets.map((asset) => (
              <tr 
                key={asset.symbol}
                onClick={() => onSelect(asset.symbol)}
                className={`cursor-pointer transition-colors hover:bg-slate-700/30 ${selectedSymbol === asset.symbol ? 'bg-indigo-500/10' : ''}`}
              >
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm">{asset.symbol}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{asset.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-sm text-slate-200">
                  {asset.price.toFixed(asset.type === 'crypto' ? 2 : 5)}
                </td>
                <td className={`px-4 py-3 text-right text-xs font-medium ${asset.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {asset.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {asset.changePercent.toFixed(2)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
