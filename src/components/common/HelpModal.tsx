import React from 'react';
import { HelpCircle, Keyboard, Cable, Binary, Cpu, X } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">DE-Lab Pro User Guide & Reference</h3>
              <p className="text-xs text-slate-400">Complete laboratory instructions and keyboard shortcuts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section 1: Circuit Builder Instructions */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <Cable className="h-4 w-4" />
            <span>How to Wire Circuits in Builder</span>
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-300">
            <li>• <strong>Adding Components:</strong> Click any component in the left panel to place it onto the workspace.</li>
            <li>• <strong>Wiring:</strong> Click on an <em>OUTPUT port</em> (on the right side of a gate/switch) and then click on a destination <em>INPUT port</em> (on the left side).</li>
            <li>• <strong>Toggling Inputs:</strong> Click directly on any switch component to toggle between 0 (LOW) and 1 (HIGH).</li>
            <li>• <strong>Moving Components:</strong> Click and drag any component body to reposition it on the grid.</li>
            <li>• <strong>Signal Colors:</strong> Active HIGH signals (1) glow green; inactive LOW signals (0) are slate gray.</li>
          </ul>
        </div>

        {/* Section 2: Boolean Syntax */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
            <Binary className="h-4 w-4" />
            <span>Boolean Algebra Syntax Guide</span>
          </h4>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-300">
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">AND Operation</span>
              <code>A * B</code> or <code>A · B</code> or <code>AB</code>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">OR Operation</span>
              <code>A + B</code> or <code>A | B</code>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">NOT (Inversion)</span>
              <code>A'</code> or <code>!A</code> or <code>~A</code>
            </div>
            <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500 block text-[10px]">XOR (Exclusive OR)</span>
              <code>A ^ B</code> or <code>A ⊕ B</code>
            </div>
          </div>
        </div>

        {/* Section 3: Keyboard Shortcuts */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            <span>Navigation Shortcuts</span>
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span>Delete Selected:</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-200">Delete / Backspace</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800">
              <span>Pan Canvas:</span>
              <kbd className="px-2 py-0.5 rounded bg-slate-800 text-[11px] font-mono font-bold text-slate-200">Middle Click Drag</kbd>
            </div>
          </div>
        </div>

        {/* Section 4: College Capstone Project Team */}
        <div className="border-t border-slate-800 pt-4 text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">DE-Lab Pro — Digital Electronics Virtual Laboratory</p>
          <p className="text-emerald-400 font-semibold">Created by Paras Aware</p>
          <p className="text-[11px] text-slate-500">100% deterministic logic simulation engine, client-side offline persistence.</p>
        </div>
      </div>
    </div>
  );
};
