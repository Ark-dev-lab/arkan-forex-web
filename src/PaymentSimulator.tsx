import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { CheckCircle2, QrCode, Loader2 } from 'lucide-react';

export const PaymentSimulator = ({ paymentId }: { paymentId: string }) => {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayment = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'transactions', paymentId));
        if (docSnap.exists()) {
          setPayment(docSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPayment();
  }, [paymentId]);

  const handlePay = async () => {
    setPaying(true);
    setError('');
    try {
      await updateDoc(doc(db, 'transactions', paymentId), {
        status: 'success',
        updatedAt: new Date()
      });
      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError("Gagal memproses pembayaran. Pastikan koneksi internet stabil.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-sm w-full">
          <h1 className="text-xl font-bold mb-2 text-rose-400">Pembayaran Tidak Valid</h1>
          <p className="text-slate-400">Sesi pembayaran tidak ditemukan atau sudah kedaluwarsa.</p>
        </div>
      </div>
    );
  }

  if (success || payment.status === 'success') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4 text-center">
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-sm w-full">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Pembayaran Berhasil!</h1>
          <p className="text-slate-400">Saldo telah ditambahkan ke akun Real. Anda dapat menutup halaman ini dan kembali ke aplikasi utama.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 max-w-sm w-full text-center shadow-2xl">
        <QrCode className="w-12 h-12 text-indigo-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Konfirmasi Pembayaran QRIS</h1>
        <p className="text-slate-400 mb-6">Arkan Forex Indonesia</p>
        
        <div className="text-4xl font-bold text-emerald-400 mb-8">
          ${payment.amount.toFixed(2)}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <button 
          onClick={handlePay}
          disabled={paying}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          {paying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Bayar Sekarang'}
        </button>
      </div>
    </div>
  );
};
