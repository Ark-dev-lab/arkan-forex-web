import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, X } from 'lucide-react';
import { askChatbot } from '../services/gemini';
import { motion } from 'motion/react';

interface ChatbotProps {
  onClose?: () => void;
}

import ReactMarkdown from 'react-markdown';

export const Chatbot: React.FC<ChatbotProps> = ({ onClose }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'bot', text: string }[]>([
    { role: 'bot', text: 'Halo! Saya Arkan, asisten ahli kalkulasi Forex Anda. Saya bisa membantu Anda menghitung Margin, Pip Value, dan Ketahanan Dana. Silakan berikan Lot, Saldo, dan Pair yang ingin Anda hitung.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickButtons = [
    { label: 'Mikro ($100)', text: 'Saldo $100 (Belajar manajemen risiko ketat)' },
    { label: 'Standar ($1.000)', text: 'Saldo $1.000 (Rekomendasi untuk latihan 0.1 lot)' },
    { label: 'Institusi ($10.000)', text: 'Saldo $10.000 (Untuk simulasi trading profesional)' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input;
    if (!messageText.trim()) return;

    if (!textToSend) setInput('');
    setMessages(prev => [...prev, { role: 'user', text: messageText }]);
    setIsLoading(true);

    try {
      const response = await askChatbot(messageText);
      setMessages(prev => [...prev, { role: 'bot', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'bot', text: 'Maaf, saya mengalami kesalahan saat memproses permintaan Anda.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <h3 className="font-semibold text-slate-200">Kalkulator Forex AI Arkan</h3>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={idx} 
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
            )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-sm' 
                : 'bg-slate-700 text-slate-200 rounded-tl-sm'
            }`}>
              <div className="markdown-body prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{msg.text}</ReactMarkdown>
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-slate-300" />
              </div>
            )}
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="p-3 rounded-2xl bg-slate-700 text-slate-200 rounded-tl-sm flex items-center">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900 border-t border-slate-700 space-y-4">
        <div className="flex flex-wrap gap-2">
          {quickButtons.map((btn, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(btn.text)}
              disabled={isLoading}
              className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 px-2 py-1 rounded-full transition-colors whitespace-nowrap"
            >
              {btn.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ketik Lot, Saldo, dan Pair (misal: 0.1 lot, $1000, EURUSD)..."
            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button 
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
