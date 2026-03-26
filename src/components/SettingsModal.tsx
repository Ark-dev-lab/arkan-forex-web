import React from 'react';
import { X, Settings as SettingsIcon, Bell, Bot } from 'lucide-react';
import { AIBotSettingsPanel } from './AIBotSettingsPanel';
import { BotSettingsPanel } from './BotSettingsPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = React.useState<'general' | 'ai' | 'notifications'>('ai');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            Pengaturan
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex flex-1 overflow-hidden">
          <div className="w-48 bg-slate-800/50 border-r border-slate-800 p-4 flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <SettingsIcon className="w-4 h-4" /> Umum
            </button>
            <button 
              onClick={() => setActiveTab('ai')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'ai' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Bot className="w-4 h-4" /> AI Bot
            </button>
            <button 
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Bell className="w-4 h-4" /> Notifikasi
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto">
            {activeTab === 'general' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Pengaturan Umum</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Tema Gelap</h4>
                      <p className="text-sm text-slate-400">Gunakan tema gelap di seluruh aplikasi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Bahasa</h4>
                      <p className="text-sm text-slate-400">Pilih bahasa antarmuka</p>
                    </div>
                    <select className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500">
                      <option value="id">Indonesia</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'ai' && (
              <div className="space-y-6">
                <AIBotSettingsPanel />
                <BotSettingsPanel />
              </div>
            )}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-white mb-4">Pengaturan Notifikasi</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Notifikasi Trading</h4>
                      <p className="text-sm text-slate-400">Dapatkan peringatan saat bot membuka/menutup posisi</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-slate-800 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Sinyal AI</h4>
                      <p className="text-sm text-slate-400">Peringatan saat AI mendeteksi peluang pasar</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
