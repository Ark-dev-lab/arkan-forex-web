import React, { useState, useEffect } from 'react';
import { Newspaper, Loader2, Search } from 'lucide-react';
import { getMarketNews } from '../services/gemini';
import { motion } from 'motion/react';

import ReactMarkdown from 'react-markdown';

export const MarketNews: React.FC = () => {
  const [news, setNews] = useState<{ text: string, chunks: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('Analisis fundamental EUR/USD hari ini');

  const fetchNews = async () => {
    setLoading(true);
    try {
      const result = await getMarketNews(query);
      setNews({ text: result.text, chunks: result.groundingChunks });
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-slate-200">Berita & Analisis Pasar</h3>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchNews()}
            placeholder="Cari berita..."
            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm text-slate-200 focus:outline-none focus:border-amber-500 w-48"
          />
          <button 
            onClick={fetchNews}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm">Mengumpulkan data pasar terbaru...</p>
          </div>
        ) : news ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="markdown-body prose prose-invert prose-sm max-w-none text-slate-300">
              <ReactMarkdown>{news.text}</ReactMarkdown>
            </div>
            
            {news.chunks && news.chunks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Sumber</h4>
                <div className="flex flex-wrap gap-2">
                  {news.chunks.map((chunk, idx) => (
                    chunk.web?.uri && (
                      <a 
                        key={idx} 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs bg-slate-700 hover:bg-slate-600 text-amber-400 px-2 py-1 rounded transition-colors truncate max-w-[200px]"
                      >
                        {chunk.web.title || new URL(chunk.web.uri).hostname}
                      </a>
                    )
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="text-slate-500 text-center mt-10">Tidak ada berita tersedia.</div>
        )}
      </div>
    </div>
  );
};
