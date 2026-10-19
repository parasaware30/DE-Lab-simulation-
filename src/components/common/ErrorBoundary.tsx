import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('DE-Lab Pro caught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-rose-500/40 bg-slate-900 p-8 text-center space-y-4 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 mx-auto">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-white">Simulation Engine Exception</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              An unexpected error occurred during circuit execution. Don't worry—your local data is safely stored in browser persistence.
            </p>
            {this.state.error && (
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-rose-400 text-left overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reload Virtual Laboratory</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
