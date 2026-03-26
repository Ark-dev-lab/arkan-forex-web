import React, { useState, useEffect } from 'react';
import { Settings, Save, AlertTriangle, Activity } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { BotSettings } from '../types';
import { handleFirestoreError } from '../utils/errorHandling';

export const BotSettingsPanel: React.FC = () => {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'bot_settings', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as BotSettings);
        } else {
          // Default settings
          setSettings({
            userId: auth.currentUser.uid,
            isActive: false,
            maxRiskPerTrade: 1,
            defaultSLPips: 20,
            defaultTPPips: 40,
            useTrailingStop: true,
            trailingStopPips: 10,
            updatedAt: new Date()
          });
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser || !settings) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'bot_settings', auth.currentUser.uid), {
        ...settings,
        updatedAt: new Date()
      });
      alert('Pengaturan berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, 'update' as any, 'bot_settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-4 text-slate-400">Memuat pengaturan...</div>;
  if (!settings) return <div className="p-4 text-slate-400">Silakan masuk untuk mengonfigurasi bot.</div>;

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
      <div className="p-4 bg-slate-900 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-slate-200">Pengaturan Risiko & Bot Otomatis</h3>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              Maks Risiko Per Trade (%)
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </label>
            <input 
              type="number" 
              value={settings.maxRiskPerTrade}
              onChange={(e) => setSettings({ ...settings, maxRiskPerTrade: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
              min="0.1" max="100" step="0.1"
            />
            <p className="text-xs text-slate-500">Bot akan otomatis menghitung ukuran lot berdasarkan risiko ini.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Default Stop Loss (Pips)</label>
            <input 
              type="number" 
              value={settings.defaultSLPips}
              onChange={(e) => setSettings({ ...settings, defaultSLPips: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Default Take Profit (Pips)</label>
            <input 
              type="number" 
              value={settings.defaultTPPips}
              onChange={(e) => setSettings({ ...settings, defaultTPPips: Number(e.target.value) })}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none"
              min="1"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Trailing Stop (Pips)</label>
            <div className="flex gap-2">
              <button 
                onClick={() => setSettings({ ...settings, useTrailingStop: !settings.useTrailingStop })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  settings.useTrailingStop ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'
                }`}
              >
                {settings.useTrailingStop ? 'Aktif' : 'Nonaktif'}
              </button>
              <input 
                type="number" 
                disabled={!settings.useTrailingStop}
                value={settings.trailingStopPips || 0}
                onChange={(e) => setSettings({ ...settings, trailingStopPips: Number(e.target.value) })}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                min="1"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {saving ? 'Menyimpan...' : <><Save className="w-5 h-5" /> Simpan Konfigurasi</>}
        </button>
      </div>
    </div>
  );
};
