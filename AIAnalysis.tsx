import React, { useState, useEffect } from 'react';
import { Brain, Zap, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { getFastAnalysis, getDeepAnalysis } from '../services/gemini';
import { motion, AnimatePresence } from 'motion/react';

interface AIAnalysisProps {
  marketData: string;
  balance: number;
  freeMargin: number;
}

import ReactMarkdown from 'react-markdown';

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ marketData, balance, freeMargin }) => {
  const [fastSummary, setFastSummary] = useState<string | null>(null);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [loadingFast, setLoadingFast] = useState(false);
  const [loadingDeep, setLoadingDeep] = useState(false);
  const [isDeepExpanded, setIsDeepExpanded] = useState(false);

  const marketDataRef = React.useRef(marketData);

  useEffect(() => {
    marketDataRef.current = marketData;
  }, [marketData]);

  useEffect(() => {
    let isMounted = true;
    const fetchFastSummary = async () => {
      if (!marketDataRef.current) return;
      setLoadingFast(true);
      try {
        const summary = await getFastAnalysis(marketDataRef.current);
        if (isMounted) setFastSummary(summary);
      } catch (error) {
        console.error(error);
      } finally {
        if (isMounted) setLoadingFast(false);
      }
    };

    fetchFastSummary();
    
    // Auto refresh fast summary every 30 seconds to avoid API spam
    const interval = setInterval(fetchFastSummary, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []); // Empty dependency array to run only once on mount and set up interval

  const handleDeepAnalysisToggle = async () => {
    if (!isDeepExpanded && !deepAnalysis) {
      setLoadingDeep(true);
      try {
        const analysis = await getDeepAnalysis(marketData, balance, freeMargin);
        setDeepAnalysis(analysis);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingDeep(false);
      }
    }
    setIsDeepExpanded(!isDeepExpanded);
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div 
        className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
        onClick={handleDeepAnalysisToggle}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
            {loadingFast ? <Loader2 className="w-4 h-4 text-amber-400 animate-spin" /> : <Zap className="w-4 h-4 text-amber-400" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              Ringkasan Cepat AI
            </h3>
            <p className="text-slate-400 text-xs line-clamp-1 mt-0.5">
              {fastSummary || 'Menganalisis pasar...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-700">
          <div className="flex items-center gap-2 text-fuchsia-400 text-xs font-medium">
            {loadingDeep ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            <span className="hidden sm:inline">Analisis Mendalam</span>
          </div>
          {isDeepExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      <AnimatePresence>
        {isDeepExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 space-y-6 bg-slate-800/50">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <h4 className="text-amber-400 font-medium text-sm mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Wawasan Cepat
                </h4>
                <p className="text-slate-300 text-sm leading-relaxed">{fastSummary}</p>
              </div>

              {deepAnalysis && (
                <div className="bg-fuchsia-500/10 border border-fuchsia-500/20 rounded-lg p-4">
                  <h4 className="text-fuchsia-400 font-medium text-sm mb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> Analisis Teknikal Mendalam
                  </h4>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-300">
                    <ReactMarkdown>{deepAnalysis}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
