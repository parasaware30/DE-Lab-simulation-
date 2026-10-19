import React from 'react';
import { Settings, Sun, Moon, Trash2, X, RefreshCw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onResetStorage: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  setIsDarkMode,
  onResetStorage,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Laboratory Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Theme setting */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
            <div>
              <span className="font-bold text-white block">Theme Mode</span>
              <span className="text-[11px] text-slate-400">Toggle dark engineering mode or light theme</span>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5" />}
              <span>{isDarkMode ? 'Dark' : 'Light'}</span>
            </button>
          </div>

          {/* Reset Storage */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-rose-500/30 bg-rose-500/10">
            <div>
              <span className="font-bold text-rose-300 block">Clear Saved Projects</span>
              <span className="text-[11px] text-rose-400/80">Purge local browser storage cache</span>
            </div>
            <button
              onClick={() => {
                if (confirm('Clear all saved local projects and restore defaults?')) {
                  onResetStorage();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
          DE-Lab Pro v2.5 · All data remains strictly local in your browser.
        </div>
      </div>
    </div>
  );
};
