import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShoppingCart } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/errorHandling';

import { getMultiplier, getPipValue } from '../utils/trading';

interface TradePanelProps {
  currentPrice: number;
  accountType: 'demo' | 'real';
  currentBalance: number;
  selectedPair: string;
}

export const TradePanel: React.FC<TradePanelProps> = ({ currentPrice, accountType, currentBalance, selectedPair }) => {
  const [lots, setLots] = useState<string>('0.1');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{text: string, type: 'error' | 'success'} | null>(null);
  const [botSettings, setBotSettings] = useState<any>(null);

  useEffect(() => {
    setLimitPrice(currentPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5));
  }, [currentPrice, selectedPair]);

  useEffect(() => {
    if (!auth.currentUser) return;
    
    const unsubscribe = onSnapshot(doc(db, 'bot_settings', auth.currentUser.uid), (docSnap) => {
      if (docSnap.exists()) {
        setBotSettings(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching bot settings:", error);
    });

    return () => unsubscribe();
  }, []);

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!auth.currentUser) return;
    const tradeLots = Number(lots);
    if (isNaN(tradeLots) || tradeLots <= 0) {
      setMessage({ text: "Ukuran lot harus lebih besar dari 0", type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    const executionPrice = orderType === 'MARKET' ? currentPrice : Number(limitPrice);
    
    const multiplier = getMultiplier(selectedPair);
    const marginRequired = (executionPrice * tradeLots * multiplier) / 100; // Assuming 1:100 leverage
    if (marginRequired > currentBalance) {
      setMessage({ text: `Saldo tidak cukup. Margin yang dibutuhkan (Leverage 1:100): $${marginRequired.toFixed(2)}`, type: 'error' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }

    setLoading(true);
    try {
      let slPrice = 0;
      let tpPrice = 0;
      
      const pipValue = getPipValue(selectedPair);

      if (botSettings) {
        const slPips = botSettings.defaultSLPips || 20;
        const tpPips = botSettings.defaultTPPips || 40;
        if (type === 'BUY') {
          slPrice = executionPrice - (slPips * pipValue);
          tpPrice = executionPrice + (tpPips * pipValue);
        } else {
          slPrice = executionPrice + (slPips * pipValue);
          tpPrice = executionPrice - (tpPips * pipValue);
        }
      } else {
        if (type === 'BUY') {
          slPrice = executionPrice - (20 * pipValue);
          tpPrice = executionPrice + (40 * pipValue);
        } else {
          slPrice = executionPrice + (20 * pipValue);
          tpPrice = executionPrice - (40 * pipValue);
        }
      }

      await addDoc(collection(db, 'trades'), {
        userId: auth.currentUser.uid,
        pair: selectedPair,
        type,
        orderType,
        limitPrice: orderType === 'LIMIT' ? executionPrice : null,
        entryPrice: executionPrice,
        lots: tradeLots,
        status: orderType === 'MARKET' ? 'OPEN' : 'PENDING',
        openedAt: serverTimestamp(),
        accountType: accountType,
        slPrice: slPrice,
        tpPrice: tpPrice,
        highestPrice: executionPrice,
        lowestPrice: executionPrice
      });
      setMessage({ 
        text: orderType === 'MARKET' 
          ? `Berhasil membuka posisi ${type} ${selectedPair} di ${executionPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5)}` 
          : `Berhasil memasang Limit Order ${type} ${selectedPair} di ${executionPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5)}`, 
        type: 'success' 
      });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      handleFirestoreError(error, 'create' as any, 'trades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-white">Panel Perdagangan</h2>
        </div>
        <div className="flex bg-slate-900 rounded-lg p-1">
          <button 
            onClick={() => setOrderType('MARKET')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${orderType === 'MARKET' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Market
          </button>
          <button 
            onClick={() => setOrderType('LIMIT')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${orderType === 'LIMIT' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Limit
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {orderType === 'LIMIT' && (
          <div>
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Harga Limit</label>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              step="0.00001"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">Ukuran Lot</label>
          <input
            type="number"
            value={lots}
            onChange={(e) => setLots(e.target.value)}
            min="0.01"
            step="0.01"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          <button
            onClick={() => handleTrade('SELL')}
            disabled={loading}
            className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 active:scale-95"
          >
            <span className="flex items-center gap-2"><TrendingDown className="w-4 h-4" /> JUAL</span>
            <span className="text-xs opacity-70 font-mono">{currentPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5)}</span>
          </button>
          <button
            onClick={() => handleTrade('BUY')}
            disabled={loading}
            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-50 active:scale-95"
          >
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> BELI</span>
            <span className="text-xs opacity-70 font-mono">{currentPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5)}</span>
          </button>
        </div>
        
        {message && (
          <div className={`mt-2 p-3 rounded-lg text-sm text-center ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};
