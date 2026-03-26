import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  constructor(props: Props) {
    super(props);
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white p-4">
          <div className="bg-slate-900 p-8 rounded-2xl border border-rose-500/30 max-w-lg w-full shadow-2xl">
            <h1 className="text-2xl font-bold text-rose-400 mb-4">Terjadi Kesalahan</h1>
            <p className="text-slate-300 mb-6">
              Maaf, terjadi kesalahan pada aplikasi. Silakan muat ulang halaman atau hubungi dukungan jika masalah berlanjut.
            </p>
            <div className="bg-slate-950 p-4 rounded-lg overflow-auto max-h-48 text-xs font-mono text-rose-300 mb-6">
              {this.state.error?.message || 'Unknown error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Muat Ulang Aplikasi
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
