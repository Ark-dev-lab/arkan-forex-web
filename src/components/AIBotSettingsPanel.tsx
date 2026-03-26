import React, { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { handleFirestoreError } from '../utils/errorHandling';

export const AIBotSettingsPanel = () => {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    languageStyle: 'formal',
    analysisFocus: 'campuran',
    riskTolerance: 'sedang'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'aiBot');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (error) {
        console.error("Gagal memuat pengaturan AI:", error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const docRef = doc(db, 'users', auth.currentUser.uid, 'settings', 'aiBot');
      await setDoc(docRef, settings, { merge: true });
      alert('Pengaturan AI Bot berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, 'update' as any, 'users/{uid}/settings/aiBot');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Settings className="w-5 h-5 text-indigo-400" />
        </div>
        <h2 className="text-lg font-bold text-white">Pengaturan AI Bot</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Gaya Bahasa AI</label>
          <select 
            value={settings.languageStyle}
            onChange={(e) => setSettings({ ...settings, languageStyle: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="formal">Formal & Profesional</option>
            <option value="santai">Santai & Kasual</option>
            <option value="agresif">Tegas & Agresif</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Fokus Analisis</label>
          <select 
            value={settings.analysisFocus}
            onChange={(e) => setSettings({ ...settings, analysisFocus: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="teknikal">Analisis Teknikal</option>
            <option value="fundamental">Analisis Fundamental</option>
            <option value="campuran">Campuran (Keduanya)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Toleransi Risiko Saran AI</label>
          <select 
            value={settings.riskTolerance}
            onChange={(e) => setSettings({ ...settings, riskTolerance: e.target.value })}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          >
            <option value="rendah">Rendah (Konservatif)</option>
            <option value="sedang">Sedang (Moderat)</option>
            <option value="tinggi">Tinggi (Agresif)</option>
          </select>
        </div>

        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Menyimpan...' : 'Simpan Pengaturan AI'}
        </button>
      </div>
    </div>
  );
};
