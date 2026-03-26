import React, { useState, useEffect, useRef } from 'react';
import { auth, logOut, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, where, updateDoc, increment } from 'firebase/firestore';
import { Chart } from './components/Chart';
import { Chatbot } from './components/Chatbot';
import { BotSettingsPanel } from './components/BotSettingsPanel';
import { TradeHistory } from './components/TradeHistory';
import { MarketNews } from './components/MarketNews';
import { AIAnalysis } from './components/AIAnalysis';
import { LoginPage } from './components/LoginPage';
import { TradePanel } from './components/TradePanel';
import { SettingsModal } from './components/SettingsModal';
import { AccountModal } from './components/AccountModal';
import { WalletModal } from './components/WalletModal';
import { PaymentSimulator } from './components/PaymentSimulator';
import { Activity, LogOut, User as UserIcon, TrendingUp, DollarSign, Settings, Bot, Wallet, ChevronDown, X, MessageSquareText } from 'lucide-react';
import { handleFirestoreError } from './utils/errorHandling';
import { evaluateAutoTrade } from './services/gemini';
import { calculateProfit, getMultiplier, getPipValue } from './utils/trading';

import { MarketOverview } from './components/MarketOverview';
import { MarketAsset } from './services/types';

interface AINotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const INITIAL_ASSETS: MarketAsset[] = [
  { symbol: 'EUR/USD', name: 'Euro / US Dollar', price: 1.0850, change: 0.0012, changePercent: 0.11, type: 'forex' },
  { symbol: 'GBP/USD', name: 'British Pound / US Dollar', price: 1.2640, change: -0.0005, changePercent: -0.04, type: 'forex' },
  { symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', price: 151.20, change: 0.45, changePercent: 0.30, type: 'forex' },
  { symbol: 'BTC/USD', name: 'Bitcoin / US Dollar', price: 68450.00, change: 1250.00, changePercent: 1.86, type: 'crypto' },
  { symbol: 'ETH/USD', name: 'Ethereum / US Dollar', price: 3450.00, change: 45.00, changePercent: 1.32, type: 'crypto' },
  { symbol: 'XAU/USD', name: 'Gold / US Dollar', price: 2165.40, change: 12.30, changePercent: 0.57, type: 'commodity' },
];

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const payId = urlParams.get('pay');

  // Example usage of import.meta.env
  const isDev = import.meta.env.MODE === 'development';
  if (isDev) {
    console.log('Running in development mode');
  }

  // If we have a payId, we render the simulator immediately
  // This allows unauthenticated access from any device (like a phone scanning a QR code)
  if (payId) {
    return <PaymentSimulator paymentId={payId} />;
  }

  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);
  const [selectedPair, setSelectedPair] = useState('EUR/USD');
  const [marketAssets, setMarketAssets] = useState<MarketAsset[]>(INITIAL_ASSETS);
  const [currentPrice, setCurrentPrice] = useState(1.0850);
  const currentPriceRef = useRef(1.0850);
  const selectedPairRef = useRef('EUR/USD');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isAILogOpen, setIsAILogOpen] = useState(false);
  const [isAutoTradingActive, setIsAutoTradingActive] = useState(false);
  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [aiLogs, setAiLogs] = useState<{id: string, message: string, type: string, time: Date}[]>([]);
  const [accountType, setAccountType] = useState<'demo' | 'real'>('demo');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [openTrades, setOpenTrades] = useState<any[]>([]);
  const [botSettings, setBotSettings] = useState<any>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  
  const userDataRef = useRef<any>(null);
  const aiSettingsRef = useRef<any>(null);
  const accountTypeRef = useRef<'demo' | 'real'>('demo');
  const lastEvalTime = useRef<number>(0);
  const openTradesRef = useRef<any[]>([]);
  const botSettingsRef = useRef<any>(null);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    aiSettingsRef.current = aiSettings;
  }, [aiSettings]);

  useEffect(() => {
    accountTypeRef.current = accountType;
  }, [accountType]);

  useEffect(() => {
    openTradesRef.current = openTrades;
  }, [openTrades]);

  useEffect(() => {
    botSettingsRef.current = botSettings;
  }, [botSettings]);

  useEffect(() => {
    currentPriceRef.current = currentPrice;
  }, [currentPrice]);

  useEffect(() => {
    selectedPairRef.current = selectedPair;
    const asset = marketAssets.find(a => a.symbol === selectedPair);
    if (asset) {
      setCurrentPrice(asset.price);
      currentPriceRef.current = asset.price;
    }
  }, [selectedPair]);

  const isAutoTradingActiveRef = useRef<boolean>(false);

  useEffect(() => {
    isAutoTradingActiveRef.current = isAutoTradingActive;
  }, [isAutoTradingActive]);

  const addNotification = (message: string, type: AINotification['type'] = 'info', showToast: boolean = true) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAiLogs(prev => [{ id, message, type, time: new Date() }, ...prev].slice(0, 50)); // Keep last 50 logs
    
    if (showToast) {
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Simulate Market Data
  useEffect(() => {
    if (!user) return;

    const dataInterval = setInterval(() => {
      setMarketAssets(prev => prev.map(asset => {
        const volatility = asset.type === 'crypto' ? 0.001 : 0.0001;
        const change = (Math.random() - 0.5) * asset.price * volatility;
        const newPrice = asset.price + change;
        
        if (asset.symbol === selectedPairRef.current) {
          setCurrentPrice(newPrice);
          currentPriceRef.current = newPrice;
        }

        const initialAsset = INITIAL_ASSETS.find(a => a.symbol === asset.symbol)!;
        return {
          ...asset,
          price: newPrice,
          change: asset.change + change,
          changePercent: ((newPrice - initialAsset.price) / initialAsset.price) * 100
        };
      }));
    }, 500);

    return () => clearInterval(dataInterval);
  }, [user]);

  // Update chart data
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      setChartData(prev => {
        const last = prev[prev.length - 1] || { time: Date.now() / 1000, open: currentPriceRef.current, high: currentPriceRef.current, low: currentPriceRef.current, close: currentPriceRef.current };
        const newPoint = {
          time: last.time + 60,
          open: last.close,
          high: Math.max(last.close, currentPriceRef.current),
          low: Math.min(last.close, currentPriceRef.current),
          close: currentPriceRef.current
        };
        return [...prev.slice(-100), newPoint];
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [user, selectedPair]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Ensure user profile exists
        const userRef = doc(db, 'users', currentUser.uid);
        try {
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            const userDataToSave: any = {
              uid: currentUser.uid,
              demoBalance: 10000,
              realBalance: 0,
              role: 'user',
              createdAt: serverTimestamp()
            };
            if (currentUser.email) {
              userDataToSave.email = currentUser.email;
            }
            if (currentUser.displayName) {
              userDataToSave.displayName = currentUser.displayName;
            }
            await setDoc(userRef, userDataToSave);
          } else {
            const data = userSnap.data();
            if (data.demoBalance === undefined) {
              await updateDoc(userRef, {
                demoBalance: data.balance || 10000
              });
            }
          }
        } catch (error) {
          console.error("Error setting up user profile:", error);
          // Don't throw handleFirestoreError here to avoid breaking the app loop
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching user data:", error);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribeBot = onSnapshot(doc(db, 'bot_settings', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setBotSettings(docSnap.data());
        setIsAutoTradingActive(docSnap.data().isActive || false);
      }
    }, (error) => {
      console.error("Error fetching bot settings:", error);
    });

    const unsubscribeAi = onSnapshot(doc(db, 'users', user.uid, 'settings', 'aiBot'), (docSnap) => {
      if (docSnap.exists()) {
        setAiSettings(docSnap.data());
      }
    }, (error) => {
      console.error("Error fetching AI settings:", error);
    });

    return () => {
      unsubscribeBot();
      unsubscribeAi();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'trades'),
      where('userId', '==', user.uid),
      where('accountType', '==', accountType),
      where('status', '==', 'OPEN')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const trades: any[] = [];
      snapshot.forEach((doc) => trades.push({ id: doc.id, ...doc.data() }));
      setOpenTrades(trades);
    }, (error) => {
      console.error("Error fetching open trades:", error);
    });
    return () => unsubscribe();
  }, [user, accountType]);

  const toggleAutoTrading = async () => {
    if (!user) return;
    const newState = !isAutoTradingActive;
    setIsAutoTradingActive(newState);
    try {
      const docRef = doc(db, 'bot_settings', user.uid);
      await setDoc(docRef, { isActive: newState, updatedAt: new Date() }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, 'update' as any, 'bot_settings');
      setIsAutoTradingActive(!newState); // revert on error
    }
  };

  const chartDataRef = useRef<any[]>([]);

  useEffect(() => {
    chartDataRef.current = chartData;
  }, [chartData]);

  useEffect(() => {
    accountTypeRef.current = accountType;
  }, [accountType]);

  useEffect(() => {
    userDataRef.current = userData;
  }, [userData]);

  useEffect(() => {
    aiSettingsRef.current = aiSettings;
  }, [aiSettings]);

  // Headless AI Auto Trading Logic
  useEffect(() => {
    if (!isAutoTradingActive || !user) return;

    const interval = setInterval(async () => {
      const currentChartData = chartDataRef.current;
      const currentPriceVal = currentPriceRef.current;
      const currentOpenTrades = openTradesRef.current;
      const currentAccountType = accountTypeRef.current;
      const currentUserData = userDataRef.current;
      const currentAiSettings = aiSettingsRef.current;
      const currentSelectedPair = selectedPairRef.current;

      if (currentChartData.length === 0) return;

      const now = Date.now();
      // Evaluate every 15 seconds to avoid spamming
      if (now - lastEvalTime.current < 15000) return;
      lastEvalTime.current = now;

      const marketDataString = `Harga Saat Ini ${currentSelectedPair}: ${currentPriceVal.toFixed(currentSelectedPair.includes('BTC') ? 2 : 5)}. 5 hari terakhir: ${currentChartData.slice(-5).map(d => d.close.toFixed(5)).join(', ')}`;
      
      const openTradesWithProfit = currentOpenTrades.map(trade => {
        const multiplier = trade.pair.includes('BTC') ? 1 : 100000;
        const profit = trade.type === 'BUY' 
          ? (currentPriceVal - trade.entryPrice) * trade.lots * multiplier 
          : (trade.entryPrice - currentPriceVal) * trade.lots * multiplier;
        return { ...trade, profit };
      });

      let decision;
      try {
        decision = await evaluateAutoTrade(marketDataString, openTradesWithProfit, currentAiSettings);
      } catch (error: any) {
        addNotification(`Kendala AI Auto Trading: Gagal mengevaluasi pasar. ${error.message}`, 'error', false);
        console.error("Auto trade evaluation failed", error);
        return;
      }
      
      if (decision.action === 'HOLD' && (!decision.closeTradeIds || decision.closeTradeIds.length === 0)) {
        addNotification(`AI Auto Trading HOLD: ${decision.reason}`, 'info', false);
      }

      // Handle closing trades
      if (decision.closeTradeIds && decision.closeTradeIds.length > 0) {
        addNotification(`AI Auto Trading CUT LOSS / CLOSE: Menutup ${decision.closeTradeIds.length} posisi. Alasan: ${decision.reason}`, 'warning');
        for (const tradeId of decision.closeTradeIds) {
          const tradeToClose = currentOpenTrades.find(t => t.id === tradeId);
          if (tradeToClose) {
            const profit = calculateProfit(tradeToClose, currentPriceVal);
            
            try {
              await updateDoc(doc(db, 'trades', tradeToClose.id!), {
                status: 'CLOSED',
                exitPrice: currentPriceVal,
                profit: profit,
                closedAt: serverTimestamp(),
                closeReason: 'AI_DECISION'
              });
              const userRef = doc(db, 'users', tradeToClose.userId);
              const balanceField = tradeToClose.accountType === 'real' ? 'realBalance' : 'demoBalance';
              await updateDoc(userRef, {
                [balanceField]: increment(profit)
              });
              console.log(`AI Closed Trade ${tradeToClose.id} with profit ${profit}`);
            } catch (error) {
              console.error("AI close trade failed", error);
            }
          }
        }
      }

      // Handle opening trades
      if (decision.action === 'BUY' || decision.action === 'SELL') {
        try {
          const docRef = doc(db, 'bot_settings', user.uid);
          const docSnap = await getDoc(docRef);
          let lots = 0.1;
          let slPrice = 0;
          let tpPrice = 0;
          
          const pipValue = getPipValue(currentSelectedPair);

          if (docSnap.exists()) {
             const settings = docSnap.data();
             const maxRiskPercent = settings.maxRiskPerTrade || 1;
             const currentBalance = currentAccountType === 'demo' ? (currentUserData?.demoBalance || 10000) : (currentUserData?.realBalance || 0);
             const riskAmount = currentBalance * (maxRiskPercent / 100);
             
             // Calculate lots based on risk amount and default SL
             const slPips = settings.defaultSLPips || 20;
             const tpPips = settings.defaultTPPips || 40;
             
             const isCrypto = currentSelectedPair.includes('BTC') || currentSelectedPair.includes('ETH');
             const isJPY = currentSelectedPair.includes('JPY');
             const riskMultiplier = isCrypto ? 100 : isJPY ? 1000 : 10;
             let calculatedLots = riskAmount / (slPips * riskMultiplier);
             
             // Min lot 0.01, Max lot 100
             calculatedLots = Math.max(0.01, Math.min(100, calculatedLots));
             // Round to 2 decimal places
             lots = Math.round(calculatedLots * 100) / 100;

             if (decision.action === 'BUY') {
               slPrice = currentPriceVal - (slPips * pipValue);
               tpPrice = currentPriceVal + (tpPips * pipValue);
             } else {
               slPrice = currentPriceVal + (slPips * pipValue);
               tpPrice = currentPriceVal - (tpPips * pipValue);
             }
          } else {
             if (decision.action === 'BUY') {
               slPrice = currentPriceVal - (20 * pipValue);
               tpPrice = currentPriceVal + (40 * pipValue);
             } else {
               slPrice = currentPriceVal + (20 * pipValue);
               tpPrice = currentPriceVal - (40 * pipValue);
             }
          }

          await addDoc(collection(db, 'trades'), {
            userId: user.uid,
            pair: currentSelectedPair,
            type: decision.action,
            entryPrice: currentPriceVal,
            lots: lots,
            status: 'OPEN',
            openedAt: serverTimestamp(),
            isAutoTrade: true,
            accountType: currentAccountType,
            reason: decision.reason,
            slPrice: slPrice,
            tpPrice: tpPrice,
            highestPrice: currentPriceVal,
            lowestPrice: currentPriceVal
          });
          addNotification(`AI Auto Trading ENTRY: Membuka posisi ${decision.action} ${lots} lot. Alasan: ${decision.reason}`, 'success');
          console.log(`Auto Trade Executed: ${decision.action} at ${currentPriceVal} with ${lots} lots on ${currentAccountType} account. Reason: ${decision.reason}`);
        } catch (error: any) {
          addNotification(`Kendala AI Auto Trading: Gagal membuka posisi. ${error.message}`, 'error');
          console.error("Auto trade execution failed", error);
        }
      }
    }, 5000); // Check every 5s if we should evaluate

    return () => clearInterval(interval);
  }, [isAutoTradingActive, user]);

  if (loading) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">Memuat...</div>;
  }

  if (!user) {
    return <LoginPage />;
  }

  const marketDataString = `Harga Saat Ini EUR/USD: ${currentPrice.toFixed(5)}. 5 hari terakhir: ${chartData.slice(-5).map(d => d.close.toFixed(5)).join(', ')}`;
  const currentBalance = accountType === 'demo' ? (userData?.demoBalance || 0) : (userData?.realBalance || 0);
  const floatingPnL = openTrades.reduce((acc, trade) => acc + calculateProfit(trade, currentPrice), 0);
  const usedMargin = openTrades.reduce((acc, trade) => acc + (trade.entryPrice * trade.lots * getMultiplier(trade.pair)) / 100, 0);
  const equity = currentBalance + floatingPnL;
  const freeMargin = equity - usedMargin;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 relative pb-20">
      {/* Notifications Overlay */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {notifications.map(notif => (
          <div 
            key={notif.id} 
            className={`pointer-events-auto flex items-start justify-between p-4 rounded-xl shadow-lg border backdrop-blur-md ${
              notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              notif.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
              notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <div className="flex-1 mr-2 text-sm font-medium leading-relaxed">
              {notif.message}
            </div>
            <button 
              onClick={() => removeNotification(notif.id)}
              className="p-1 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Topbar */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">Arkan Forex Analizer</h1>
              <h1 className="text-xl font-bold text-white tracking-tight sm:hidden">AFA</h1>
              <p className="text-xs text-indigo-400 font-medium tracking-wide uppercase hidden sm:block">Sistem Trading Otomatis AI</p>
            </div>
          </div>

          {user && (
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="hidden md:flex items-center gap-6 px-4 py-1.5 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Saldo</span>
                  <span className="text-sm font-mono text-white">${currentBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Equity</span>
                  <span className="text-sm font-mono text-white">${equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">P/L</span>
                  <span className={`text-sm font-mono ${floatingPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {floatingPnL >= 0 ? '+' : ''}${floatingPnL.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Wallet Button */}
              <button 
                onClick={() => setIsWalletOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-slate-300 transition-colors hover:text-emerald-400"
              >
                <Wallet className="w-4 h-4" />
                <span>Dompet</span>
              </button>

              {/* Account Type Selector */}
              <div className="relative">
                <button 
                  onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                    accountType === 'real' 
                      ? 'bg-emerald-900/30 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${accountType === 'real' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}`}></div>
                  {accountType === 'real' ? 'Akun Real' : 'Akun Demo'}
                  <ChevronDown className={`w-4 h-4 transition-transform ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isAccountDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden py-1 z-50">
                    <button 
                      onClick={() => { setAccountType('demo'); setIsAccountDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>Akun Demo</span>
                      {accountType === 'demo' && <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>}
                    </button>
                    <button 
                      onClick={() => { setAccountType('real'); setIsAccountDropdownOpen(false); }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>Akun Real</span>
                      {accountType === 'real' && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>}
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={() => setIsAccountOpen(true)}
                className="flex items-center gap-2 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center border border-slate-700">
                  <UserIcon className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto p-4 flex flex-col gap-6">
        {/* 1. Chart */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-white">{selectedPair}</span>
                <span className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold rounded uppercase">
                  {marketAssets.find(a => a.symbol === selectedPair)?.type}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-500">Harga:</span>
                <span className="font-mono text-white">{currentPrice.toFixed(selectedPair.includes('BTC') ? 2 : 5)}</span>
                <span className={`font-mono ${marketAssets.find(a => a.symbol === selectedPair)!.change >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {marketAssets.find(a => a.symbol === selectedPair)!.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
          <div className="flex-1">
            <Chart key={selectedPair} symbol={selectedPair} />
          </div>
        </div>

        {/* Bottom Section: Trade Panel, Market Overview, News, Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
          {/* 2. Panel Perdagangan */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <TradePanel 
              currentPrice={currentPrice} 
              accountType={accountType} 
              currentBalance={currentBalance}
              selectedPair={selectedPair}
            />

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white">AI Auto Trading</h2>
                </div>
                <button 
                  onClick={toggleAutoTrading}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isAutoTradingActive ? 'bg-indigo-600' : 'bg-slate-700'}`}
                >
                  <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAutoTradingActive ? 'translate-x-5' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                  <p className="text-[10px] text-slate-500 uppercase font-bold">Status</p>
                  <p className={`text-xs font-bold ${isAutoTradingActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {isAutoTradingActive ? 'AKTIF' : 'OFF'}
                  </p>
                </div>
                <button 
                  onClick={() => setIsAILogOpen(true)}
                  className="bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold py-2 rounded-lg transition-colors uppercase"
                >
                  Log AI
                </button>
              </div>
            </div>
          </div>

          {/* 3. Tinjauan Pasar */}
          <div className="lg:col-span-3">
            <MarketOverview 
              assets={marketAssets} 
              onSelect={setSelectedPair} 
              selectedSymbol={selectedPair} 
            />
          </div>

          {/* 4. Berita & Analisis Pasar */}
          <div className="lg:col-span-3">
            <MarketNews />
          </div>

          {/* 5. Analisis */}
          <div className="lg:col-span-3">
            <AIAnalysis 
              marketData={marketDataString} 
              balance={currentBalance}
              freeMargin={freeMargin}
            />
          </div>
        </div>

        {/* 6. Riwayat Perdagangan (Bottom) */}
        <div className="w-full">
          <TradeHistory marketAssets={marketAssets} accountType={accountType} />
        </div>
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        <button
          onClick={() => setIsAILogOpen(!isAILogOpen)}
          className="w-14 h-14 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full shadow-xl shadow-emerald-500/20 flex items-center justify-center transition-all hover:scale-110 relative"
          title="Log AI Auto Trading"
        >
          <MessageSquareText className="w-6 h-6" />
          {aiLogs.length > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full border-2 border-slate-950"></span>
          )}
        </button>
        <button
          onClick={() => setIsChatbotOpen(!isChatbotOpen)}
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-xl shadow-indigo-500/20 flex items-center justify-center transition-all hover:scale-110"
          title="Asisten AI"
        >
          <Bot className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsWalletOpen(true)}
          className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shadow-xl border border-slate-700 flex items-center justify-center transition-all hover:scale-110 hover:text-emerald-400 md:hidden"
          title="Dompet"
        >
          <Wallet className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shadow-xl border border-slate-700 flex items-center justify-center transition-all hover:scale-110 hover:text-indigo-400"
          title="Pengaturan"
        >
          <Settings className="w-6 h-6" />
        </button>
        <button
          onClick={() => setIsAccountOpen(true)}
          className="w-12 h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-full shadow-xl border border-slate-700 flex items-center justify-center transition-all hover:scale-110 hover:text-indigo-400"
          title="Akun Saya"
        >
          <UserIcon className="w-6 h-6" />
        </button>
      </div>

      {isAILogOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-slate-200 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-emerald-400" />
                Log AI Auto Trading
              </h3>
              <button 
                onClick={toggleAutoTrading}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isAutoTradingActive ? 'bg-indigo-600' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isAutoTradingActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
            <button onClick={() => setIsAILogOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {aiLogs.length === 0 ? (
              <div className="text-center text-slate-500 mt-10">Belum ada log aktivitas AI.</div>
            ) : (
              aiLogs.map(log => (
                <div key={log.id} className={`p-3 rounded-lg text-sm border ${
                  log.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                  log.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                  log.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                  'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                }`}>
                  <div className="text-xs opacity-70 mb-1">{log.time.toLocaleTimeString()}</div>
                  <div>{log.message}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {isChatbotOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-50 shadow-2xl">
          <Chatbot onClose={() => setIsChatbotOpen(false)} />
        </div>
      )}

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <AccountModal isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} onOpenWallet={() => setIsWalletOpen(true)} />
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} userData={userData} accountType={accountType} />
    </div>
  );
}
