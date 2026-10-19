import React, { useState } from 'react';
import { 
  convertRadix, 
  computeComplements, 
  addBinary 
} from '../../engine/numbers/conversions';
import { 
  Calculator, 
  Binary, 
  Plus, 
  RotateCcw, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';

export const NumberSystemsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RADIX' | 'COMPLEMENTS' | 'ARITHMETIC' | 'BITWISE'>('RADIX');

  // Radix Converter State
  const [radixInput, setRadixInput] = useState<string>('42');
  const [fromBase, setFromBase] = useState<2 | 8 | 10 | 16>(10);
  const conversionRes = convertRadix(radixInput, fromBase);

  // Complements State
  const [complementDecimal, setComplementDecimal] = useState<number>(-5);
  const [bitWidth, setBitWidth] = useState<4 | 8 | 16>(8);
  const complementRes = computeComplements(complementDecimal, bitWidth);

  // Binary Arithmetic State
  const [binA, setBinA] = useState<string>('1011');
  const [binB, setBinB] = useState<string>('0101');
  const addRes = addBinary(binA, binB);

  // Bitwise State
  const [bitValA, setBitValA] = useState<number>(12); // 1100
  const [bitValB, setBitValB] = useState<number>(10); // 1010
  const [shiftAmount, setShiftAmount] = useState<number>(1);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Number Systems & Digital Arithmetic Engine
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Radix conversion matrices, 1's & 2's complements with overflow detection, binary arithmetic, and bitwise calculators
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'RADIX', label: 'Radix Conversions (Bin/Oct/Dec/Hex)' },
          { id: 'COMPLEMENTS', label: "1's & 2's Complements" },
          { id: 'ARITHMETIC', label: 'Binary Addition with Carries' },
          { id: 'BITWISE', label: 'Bitwise Logic Operations' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeTab === t.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Radix Conversions */}
      {activeTab === 'RADIX' && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enter Input Value
                </label>
                <input
                  type="text"
                  value={radixInput}
                  onChange={e => setRadixInput(e.target.value)}
                  placeholder="e.g. 101010 or 42 or 2A"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-4 space-y-2">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Select Source Radix (Base)
                </label>
                <select
                  value={fromBase}
                  onChange={e => setFromBase(parseInt(e.target.value, 10) as any)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-xs font-bold text-emerald-400 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value={2}>Base-2 (Binary: 0, 1)</option>
                  <option value={8}>Base-8 (Octal: 0-7)</option>
                  <option value={10}>Base-10 (Decimal: 0-9)</option>
                  <option value={16}>Base-16 (Hexadecimal: 0-9, A-F)</option>
                </select>
              </div>
            </div>

            {conversionRes.isValid ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Binary (Base-2)</span>
                  <div className="text-lg font-mono font-extrabold text-cyan-400 mt-1 break-all">
                    {conversionRes.binary}₂
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Octal (Base-8)</span>
                  <div className="text-lg font-mono font-extrabold text-amber-400 mt-1">
                    {conversionRes.octal}₈
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Decimal (Base-10)</span>
                  <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1">
                    {conversionRes.decimal}₁₀
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Hexadecimal (Base-16)</span>
                  <div className="text-lg font-mono font-extrabold text-purple-400 mt-1">
                    0x{conversionRes.hex}₁₆
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {conversionRes.errorMessage || 'Invalid number format for selected base.'}
              </div>
            )}
          </div>

          {/* Mathematical Working Steps */}
          {conversionRes.isValid && conversionRes.steps.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                <span>Step-by-Step Mathematical Working</span>
              </h3>
              <div className="space-y-3">
                {conversionRes.steps.map((st, i) => (
                  <div key={i} className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 space-y-1">
                    <span className="text-xs font-bold text-emerald-400">{st.title}</span>
                    <p className="text-[11px] text-slate-400">{st.explanation}</p>
                    <div className="text-xs font-mono font-bold text-white pt-1">{st.math}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: 1's & 2's Complements */}
      {activeTab === 'COMPLEMENTS' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-8 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Enter Signed Decimal Integer (Positive or Negative)
              </label>
              <input
                type="number"
                value={complementDecimal}
                onChange={e => setComplementDecimal(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-4 space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Bit Width Precision
              </label>
              <div className="flex gap-2">
                {([4, 8, 16] as const).map(w => (
                  <button
                    key={w}
                    onClick={() => setBitWidth(w)}
                    className={`flex-1 py-2.5 rounded-lg text-xs font-mono font-bold transition-colors ${
                      bitWidth === w
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {w}-Bit
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Magnitude Form</span>
              <div className="text-xl font-mono font-extrabold text-white mt-1">
                {complementRes.magnitudeBinary}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">1's Complement (Invert Bits)</span>
              <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">
                {complementRes.onesComplement}
              </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-400">2's Complement (+ 1)</span>
              <div className="text-xl font-mono font-extrabold text-emerald-300 mt-1">
                {complementRes.twosComplement}
              </div>
            </div>
          </div>

          {/* Polarity and Overflow Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">Sign Bit (MSB):</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                complementRes.signBit === 1 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400'
              }`}>
                {complementRes.signBit} ({complementRes.signBit === 1 ? 'Negative' : 'Positive / Zero'})
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">Overflow Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                complementRes.hasOverflow ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'text-emerald-400'
              }`}>
                {complementRes.hasOverflow ? 'Overflow: Exceeds bit-width range' : 'Valid Range'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300 whitespace-pre-line font-mono">
            {complementRes.explanation}
          </div>
        </div>
      )}

      {/* Tab 3: Binary Addition */}
      {activeTab === 'ARITHMETIC' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Binary Operand A</label>
              <input
                type="text"
                value={binA}
                onChange={e => setBinA(e.target.value.replace(/[^01]/g, ''))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-lg text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Binary Operand B</label>
              <input
                type="text"
                value={binB}
                onChange={e => setBinB(e.target.value.replace(/[^01]/g, ''))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-lg text-white"
              />
            </div>
          </div>

          {/* Visual Long Addition Board */}
          <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 max-w-md mx-auto space-y-2 font-mono text-lg text-right">
            <div className="text-xs text-amber-400 tracking-widest">
              Carries: {addRes.carries}
            </div>
            <div className="tracking-widest text-slate-300">{binA}₂ ({parseInt(binA, 2) || 0}₁₀)</div>
            <div className="tracking-widest text-slate-300 flex items-center justify-between">
              <span className="text-emerald-400 font-bold">+</span>
              <span>{binB}₂ ({parseInt(binB, 2) || 0}₁₀)</span>
            </div>
            <div className="border-t-2 border-slate-700 pt-2 tracking-widest text-2xl font-extrabold text-emerald-400">
              {addRes.sumBinary}₂
            </div>
            <div className="text-xs text-slate-400 pt-1">
              Decimal Sum: {addRes.sumDecimal}₁₀
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Bitwise Operations */}
      {activeTab === 'BITWISE' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Operand A (Decimal)</label>
              <input
                type="number"
                value={bitValA}
                onChange={e => setBitValA(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-white"
              />
              <span className="text-xs font-mono text-slate-400">Binary: {bitValA.toString(2).padStart(8, '0')}</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Operand B (Decimal)</label>
              <input
                type="number"
                value={bitValB}
                onChange={e => setBitValB(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-white"
              />
              <span className="text-xs font-mono text-slate-400">Binary: {bitValB.toString(2).padStart(8, '0')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { name: 'Bitwise AND (&)', val: bitValA & bitValB },
              { name: 'Bitwise OR (|)', val: bitValA | bitValB },
              { name: 'Bitwise XOR (^)', val: bitValA ^ bitValB },
              { name: 'NOT A (~A)', val: ~bitValA },
              { name: 'A << 1 (Shift Left)', val: bitValA << 1 },
              { name: 'A >> 1 (Shift Right)', val: bitValA >> 1 },
            ].map(op => (
              <div key={op.name} className="p-3.5 rounded-lg border border-slate-800 bg-slate-950 text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{op.name}</span>
                <div className="text-xl font-mono font-bold text-emerald-400 mt-1">{op.val}</div>
                <span className="text-[10px] font-mono text-slate-500">{(op.val >>> 0).toString(2)}₂</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
