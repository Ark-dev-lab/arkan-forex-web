import React from 'react';
import { LogIn } from 'lucide-react';
import { signInWithGoogle } from '../firebase';
import { motion } from 'motion/react';

export const AuthModal: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <LogIn className="w-8 h-8 text-indigo-400" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Selamat Datang di Arkan</h2>
        <p className="text-slate-400 mb-8">
          Masuk untuk mengakses analisis forex real-time, mengonfigurasi bot trading AI Anda, dan mengelola risiko.
        </p>
        
        <button 
          onClick={signInWithGoogle}
          className="w-full bg-white hover:bg-slate-100 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-colors shadow-lg"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Masuk dengan Google
        </button>
      </motion.div>
    </div>
  );
};
