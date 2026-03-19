import React, { useState, useEffect } from 'react';
import { History, TrendingUp, TrendingDown, XCircle, X, Maximize2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { Trade, MarketAsset } from '../types';
import { format } from 'date-fns';
import { calculateProfit } from '../utils/trading';

interface TradeHistoryProps {
  accountType: 'demo' | 'real';
  marketAssets: MarketAsset[];
}

export const TradeHistory: React.FC<TradeHistoryProps> = ({ accountType, marketAssets }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getPairPrice = (symbol: string) => {
    return marketAssets.find(a => a.symbol === symbol)?.price || 0;
  };

  useEffect(() => {
    if (!auth.currentUser || !accountType) return;

    const q = query(
      collection(db, 'trades'),
      where('userId', '==', auth.currentUser.uid),
      where('accountType', '==', accountType),
      orderBy('openedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradesData: Trade[] = [];
      snapshot.forEach((doc) => {
        tradesData.push({ id: doc.id, ...doc.data() } as Trade);
      });
      setTrades(tradesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching trades:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [accountType]);

  const handleCloseTrade = async (trade: Trade) => {
    if (!auth.currentUser || trade.status === 'CLOSED') return;
    
    const currentPrice = getPairPrice(trade.pair);
    const profit = calculateProfit(trade, currentPrice);
    
    try {
      await updateDoc(doc(db, 'trades', trade.id!), {
        status: 'CLOSED',
        exitPrice: currentPrice,
        profit: profit,
        closedAt: serverTimestamp()
      });

      const userRef = doc(db, 'users', auth.currentUser.uid);
      const balanceField = trade.accountType === 'real' ? 'realBalance' : 'demoBalance';
      await updateDoc(userRef, {
        [balanceField]: increment(profit)
      });
    } catch (error) {
      console.error("Error closing trade:", error);
    }
  };

  if (loading) return <div className="p-4 text-slate-400">Memuat riwayat...</div>;

  return (
    <>
      <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col h-full">
        <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-slate-200">Riwayat Perdagangan</h3>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-indigo-400 transition-all"
            title="Lihat Lebih Lengkap"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead className="text-xs uppercase bg-slate-900 text-slate-500 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Pasangan</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Keuntungan</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {trades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    Tidak ada perdagangan.
                  </td>
                </tr>
              ) : (
                trades.map((trade) => {
                  const currentPrice = getPairPrice(trade.pair);
                  const profit = trade.status === 'CLOSED' ? trade.profit! : calculateProfit(trade, currentPrice);
                  return (
                    <tr key={trade.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-200">{trade.pair}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {trade.type}
                        </span>
                      </td>
                      <td className={`px-4 py-3 font-mono font-medium ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        ${profit.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        {trade.status === 'OPEN' && (
                          <button 
                            onClick={() => handleCloseTrade(trade)}
                            className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full History Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">Riwayat Perdagangan Lengkap</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4">
              <table className="w-full text-left text-sm text-slate-400 border-collapse">
                <thead className="text-xs uppercase bg-slate-800 text-slate-500 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4 border-b border-slate-700">Pasangan</th>
                    <th className="px-6 py-4 border-b border-slate-700">Tipe</th>
                    <th className="px-6 py-4 border-b border-slate-700">Masuk</th>
                    <th className="px-6 py-4 border-b border-slate-700">Keluar</th>
                    <th className="px-6 py-4 border-b border-slate-700">SL / TP</th>
                    <th className="px-6 py-4 border-b border-slate-700">Lot</th>
                    <th className="px-6 py-4 border-b border-slate-700">Keuntungan</th>
                    <th className="px-6 py-4 border-b border-slate-700">Status</th>
                    <th className="px-6 py-4 border-b border-slate-700">Tanggal</th>
                    <th className="px-6 py-4 border-b border-slate-700">Alasan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {trades.map((trade) => {
                    const currentPrice = getPairPrice(trade.pair);
                    const profit = trade.status === 'CLOSED' ? trade.profit! : calculateProfit(trade, currentPrice);
                    const date = trade.openedAt?.toDate?.() || new Date((trade.openedAt as any).seconds ? (trade.openedAt as any).seconds * 1000 : trade.openedAt);
                    
                    return (
                      <tr key={trade.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 font-bold text-white">{trade.pair}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            trade.type === 'BUY' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono">{trade.entryPrice.toFixed(5)}</td>
                        <td className="px-6 py-4 font-mono">{trade.exitPrice ? trade.exitPrice.toFixed(5) : '-'}</td>
                        <td className="px-6 py-4 text-[10px] font-mono">
                          <div className="text-rose-400">SL: {trade.slPrice?.toFixed(5) || '-'}</div>
                          <div className="text-emerald-400">TP: {trade.tpPrice?.toFixed(5) || '-'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono">{trade.lots}</td>
                        <td className={`px-6 py-4 font-mono font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          ${profit.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                            trade.status === 'OPEN' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-700 text-slate-400'
                          }`}>
                            {trade.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs">
                          {isNaN(date.getTime()) ? '-' : format(date, 'MMM dd, HH:mm:ss')}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500 italic">
                          {(trade as any).reason || (trade as any).closeReason || 'Manual'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
