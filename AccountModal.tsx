import React, { useState } from 'react';
import { X, User as UserIcon, Lock, Camera, Save, Wallet, LogOut, Trash2, AlertTriangle } from 'lucide-react';
import { auth, logOut, db } from '../firebase';
import { updateProfile, updatePassword, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenWallet?: () => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onOpenWallet }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || '');
  const [photoURL, setPhotoURL] = useState(auth.currentUser?.photoURL || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'immediate' | 'delayed' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleUpdateProfile = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await updateProfile(auth.currentUser, { displayName, photoURL });
      setMessage('Profil berhasil diperbarui!');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui profil.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!auth.currentUser) return;
    if (!newPassword) {
      setError('Kata sandi baru tidak boleh kosong.');
      return;
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await updatePassword(auth.currentUser, newPassword);
      setMessage('Kata sandi berhasil diperbarui!');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui kata sandi. Anda mungkin perlu login ulang.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      onClose();
    } catch (err: any) {
      setError('Gagal keluar.');
    }
  };

  const handleDeleteAccount = async (type: 'immediate' | 'delayed') => {
    if (!auth.currentUser) return;
    
    setIsDeleting(true);
    setError('');
    setMessage('');

    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      
      if (type === 'immediate') {
        // Immediate deletion
        // 1. Delete Firestore data
        await deleteDoc(userRef);
        // 2. Delete Auth user
        await deleteUser(auth.currentUser);
        onClose();
      } else {
        // Delayed deletion (30 days)
        const deletionDate = new Date();
        deletionDate.setDate(deletionDate.getDate() + 30);
        
        await updateDoc(userRef, {
          deletionScheduledAt: deletionDate.toISOString(),
          deletionType: 'delayed'
        });
        
        setMessage('Akun Anda dijadwalkan untuk dihapus dalam 30 hari.');
        setShowDeleteConfirm(false);
        setDeleteType(null);
      }
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        setError('Keamanan: Silakan keluar dan masuk kembali sebelum menghapus akun Anda.');
      } else {
        setError(err.message || 'Gagal menghapus akun.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-indigo-400" />
            Akun Saya
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-800">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'profile' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Profil
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'security' ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Keamanan
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {message && <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm">{message}</div>}
          {error && <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-sm">{error}</div>}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-slate-800 rounded-full border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden mb-3 relative group">
                  {photoURL ? (
                    <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-10 h-10 text-slate-500" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-xs text-slate-500">URL Foto Profil</p>
                <input 
                  type="text" 
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  placeholder="https://..."
                  className="mt-1 w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nama Tampilan</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Email</label>
                <input 
                  type="email" 
                  value={auth.currentUser?.email || ''}
                  disabled
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-slate-500 cursor-not-allowed"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                disabled={loading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Menyimpan...' : 'Simpan Profil'}
              </button>

              {onOpenWallet && (
                <button 
                  onClick={() => { onClose(); onOpenWallet(); }}
                  className="w-full mt-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Wallet className="w-4 h-4" />
                  Buka Dompet & Transaksi
                </button>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Kata Sandi Baru</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-500" />
                  </div>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Anda mungkin perlu login ulang setelah mengubah kata sandi.</p>
              </div>

              <button 
                onClick={handleUpdatePassword}
                disabled={loading || !newPassword}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {loading ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
              </button>

              <div className="pt-6 border-t border-slate-800">
                <h3 className="text-sm font-medium text-rose-400 flex items-center gap-2 mb-4">
                  <Trash2 className="w-4 h-4" />
                  Zona Bahaya
                </h3>
                
                {!showDeleteConfirm ? (
                  <button 
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus Akun
                  </button>
                ) : (
                  <div className="space-y-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                    <p className="text-xs text-rose-300 font-medium mb-2">Pilih metode penghapusan:</p>
                    
                    <button 
                      onClick={() => setDeleteType('immediate')}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all ${deleteType === 'immediate' ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      HAPUS SEKARANG
                    </button>
                    
                    <button 
                      onClick={() => setDeleteType('delayed')}
                      className={`w-full py-2 px-4 rounded-lg text-sm font-bold transition-all ${deleteType === 'delayed' ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
                    >
                      HAPUS SETELAH 30 HARI TIDAK DIGUNAKAN
                    </button>

                    {deleteType === 'immediate' && (
                      <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-start gap-2 p-3 bg-rose-900/40 border border-rose-500/50 rounded-lg mb-4">
                          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                          <p className="text-[10px] leading-relaxed text-rose-200 uppercase font-black tracking-wider">
                            PERINGATAN!!!...... DENGAN MENEKAN TOMBOL INI DATA ANDA AKAN LANGSUNG DIHAPUS DARI SISTEM
                          </p>
                        </div>
                        
                        <div className="flex gap-2">
                          <button 
                            onClick={() => { setShowDeleteConfirm(false); setDeleteType(null); }}
                            className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                          >
                            BATAL
                          </button>
                          <button 
                            onClick={() => handleDeleteAccount('immediate')}
                            disabled={isDeleting}
                            className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isDeleting ? 'MENGHAPUS...' : 'HAPUS AKUN'}
                          </button>
                        </div>
                      </div>
                    )}

                    {deleteType === 'delayed' && (
                      <div className="mt-4 flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <button 
                          onClick={() => { setShowDeleteConfirm(false); setDeleteType(null); }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-colors"
                        >
                          BATAL
                        </button>
                        <button 
                          onClick={() => handleDeleteAccount('delayed')}
                          disabled={isDeleting}
                          className="flex-1 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? 'MENJADWALKAN...' : 'KONFIRMASI'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            Keluar dari Akun
          </button>
        </div>
      </div>
    </div>
  );
};
