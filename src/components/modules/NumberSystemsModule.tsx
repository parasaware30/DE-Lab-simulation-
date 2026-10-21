import React, { useState } from 'react';
import { 
  convertRadix, 
  computeComplements, 
  addBinary,
  subtractBinary,
  multiplyBinary,
  divideBinary
} from '../../engine/numbers/conversions';
import { 
  Calculator, 
  Binary, 
  Plus, 
  Minus,
  X as MultiplyIcon,
  Divide,
  RotateCcw, 
  Layers, 
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const NumberSystemsModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'RADIX' | 'COMPLEMENTS' | 'ARITHMETIC' | 'BITWISE'>('RADIX');

  // Radix Converter State
  const [radixInput, setRadixInput] = useState<string>('42');
  const [fromBase, setFromBase] = useState<2 | 8 | 10 | 16>(10);
  
  const cleanInput = radixInput.trim();
  let effectiveBase: 2 | 8 | 10 | 16 = fromBase;
  let effectiveInput = cleanInput;
  if (cleanInput.startsWith('0b') || cleanInput.startsWith('0B')) {
    effectiveBase = 2;
    effectiveInput = cleanInput.slice(2);
  } else if (cleanInput.startsWith('0x') || cleanInput.startsWith('0X')) {
    effectiveBase = 16;
    effectiveInput = cleanInput.slice(2);
  } else if (cleanInput.startsWith('0o') || cleanInput.startsWith('0O')) {
    effectiveBase = 8;
    effectiveInput = cleanInput.slice(2);
  }
  const conversionRes = convertRadix(effectiveInput, effectiveBase);

  // Complements State
  const [complementDecimal, setComplementDecimal] = useState<number>(-5);
  const [bitWidth, setBitWidth] = useState<4 | 8 | 16>(8);
  const complementRes = computeComplements(complementDecimal, bitWidth);

  // Binary Arithmetic State
  const [arithmeticOp, setArithmeticOp] = useState<'ADD' | 'SUB' | 'MUL' | 'DIV'>('ADD');
  const [binA, setBinA] = useState<string>('1011');
  const [binB, setBinB] = useState<string>('0101');
  const addRes = addBinary(binA, binB);
  const subRes = subtractBinary(binA, binB, 8);
  const mulRes = multiplyBinary(binA, binB);
  const divRes = divideBinary(binA, binB);

  // Bitwise State
  const [bitValA, setBitValA] = useState<number>(12); // 1100
  const [bitValB, setBitValB] = useState<number>(10); // 1010

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Calculator className="h-6 w-6 text-emerald-400" />
          <span>Number Systems &amp; Digital Arithmetic Engine</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Base conversions (Binary, Octal, Decimal, Hexadecimal, Fractional), 1's &amp; 2's complements with bitwise inversion, and complete Digital Arithmetic (Addition, 2's Complement Subtraction, Multiplication, Division)
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'RADIX', label: 'Radix Conversions (Bin/Oct/Dec/Hex)' },
          { id: 'COMPLEMENTS', label: "1's & 2's Complements" },
          { id: 'ARITHMETIC', label: 'Digital Arithmetic Engine' },
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
            {/* Source Base Selection Buttons */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Source Base (From):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { base: 2 as const, label: 'Binary (Base-2)', hint: '0, 1' },
                  { base: 8 as const, label: 'Octal (Base-8)', hint: '0-7' },
                  { base: 10 as const, label: 'Decimal (Base-10)', hint: '0-9' },
                  { base: 16 as const, label: 'Hexadecimal (Base-16)', hint: '0-9, A-F' },
                ].map(b => (
                  <button
                    key={b.base}
                    onClick={() => {
                      setFromBase(b.base);
                      if (b.base === 2 && !/^[01.]+$/.test(radixInput)) setRadixInput('101010');
                      else if (b.base === 8 && !/^[0-7.]+$/.test(radixInput)) setRadixInput('52');
                      else if (b.base === 16 && !/^[0-9a-fA-F.]+$/.test(radixInput)) setRadixInput('2A');
                    }}
                    className={`p-3 rounded-lg text-left border transition-all ${
                      effectiveBase === b.base
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-xs">{b.label}</div>
                    <div className="text-[10px] text-slate-400">Digits: {b.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Field */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Enter Value in Base-{effectiveBase} (Integers &amp; Decimals Supported)
                </label>
                <span className="text-[11px] font-mono text-emerald-400">
                  Example: {effectiveBase === 2 ? '1010.11' : effectiveBase === 8 ? '52.4' : effectiveBase === 10 ? '42.75' : '2A.8'}
                </span>
              </div>
              <input
                type="text"
                value={radixInput}
                onChange={e => setRadixInput(e.target.value)}
                placeholder={`Type a Base-${effectiveBase} number...`}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-base font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            {conversionRes.isValid ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-800">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Binary (Base-2)</span>
                  <div className="text-lg font-mono font-extrabold text-cyan-400 mt-1 break-all">
                    {conversionRes.binary}₂
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Octal (Base-8)</span>
                  <div className="text-lg font-mono font-extrabold text-amber-400 mt-1 break-all">
                    {conversionRes.octal}₈
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Decimal (Base-10)</span>
                  <div className="text-lg font-mono font-extrabold text-emerald-400 mt-1 break-all">
                    {conversionRes.decimal}₁₀
                  </div>
                </div>
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Hexadecimal (Base-16)</span>
                  <div className="text-lg font-mono font-extrabold text-purple-400 mt-1 break-all">
                    0x{conversionRes.hex}₁₆
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{conversionRes.errorMessage || `Invalid characters for Base-${effectiveBase} representation.`}</span>
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
                    <div className="text-xs font-mono font-bold text-white pt-1 break-all">{st.math}</div>
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
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
              <span className="text-[10px] font-bold uppercase text-slate-400">Binary Magnitude</span>
              <div className="text-xl font-mono font-extrabold text-white mt-1">
                {complementRes.magnitudeBinary}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">|{complementDecimal}| in {bitWidth}-bit</span>
            </div>

            <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 text-center">
              <span className="text-[10px] font-bold uppercase text-amber-400">Bitwise Inversion (~X)</span>
              <div className="text-xl font-mono font-extrabold text-amber-300 mt-1">
                {complementRes.bitwiseInversion}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">1's complement of bits</span>
            </div>

            <div className="p-4 rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-center">
              <span className="text-[10px] font-bold uppercase text-cyan-400">Bitwise 2's Comp (~X + 1)</span>
              <div className="text-xl font-mono font-extrabold text-cyan-300 mt-1">
                {complementRes.bitwiseTwos}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Negation in 2's comp</span>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-400">Signed 2's Comp Form</span>
              <div className="text-xl font-mono font-extrabold text-emerald-300 mt-1">
                {complementRes.twosComplement}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Stored value of {complementDecimal}</span>
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
              <span className="font-bold text-slate-400">Valid Range ({bitWidth}-bit):</span>
              <span className="font-mono text-slate-300">
                {-(1 << (bitWidth - 1))} to {((1 << (bitWidth - 1)) - 1)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-400">Overflow Status:</span>
              <span className={`font-bold px-2 py-0.5 rounded ${
                complementRes.hasOverflow ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'text-emerald-400'
              }`}>
                {complementRes.hasOverflow ? 'Overflow: Out of range' : 'In Range'}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 text-xs text-slate-300 whitespace-pre-line font-mono leading-relaxed">
            {complementRes.explanation}
          </div>
        </div>
      )}

      {/* Tab 3: Digital Arithmetic Engine */}
      {activeTab === 'ARITHMETIC' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          {/* Operation Sub-Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">
              Operation:
            </span>
            {[
              { id: 'ADD' as const, label: 'Binary Addition (+)', icon: Plus },
              { id: 'SUB' as const, label: "2's Complement Subtraction (-)", icon: Minus },
              { id: 'MUL' as const, label: 'Binary Multiplication (×)', icon: MultiplyIcon },
              { id: 'DIV' as const, label: 'Binary Division (÷)', icon: Divide },
            ].map(op => {
              const Icon = op.icon;
              return (
                <button
                  key={op.id}
                  onClick={() => setArithmeticOp(op.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    arithmeticOp === op.id
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{op.label}</span>
                </button>
              );
            })}
          </div>

          {/* Operand Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Binary Operand A</label>
              <input
                type="text"
                value={binA}
                onChange={e => setBinA(e.target.value.replace(/[^01]/g, ''))}
                placeholder="e.g. 1011"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-lg text-white"
              />
              <span className="text-xs font-mono text-slate-400">Decimal: {parseInt(binA || '0', 2)}₁₀</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Binary Operand B</label>
              <input
                type="text"
                value={binB}
                onChange={e => setBinB(e.target.value.replace(/[^01]/g, ''))}
                placeholder="e.g. 0101"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-lg text-white"
              />
              <span className="text-xs font-mono text-slate-400">Decimal: {parseInt(binB || '0', 2)}₁₀</span>
            </div>
          </div>

          {/* Operation Specific Board */}
          {arithmeticOp === 'ADD' && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 max-w-md mx-auto space-y-2 font-mono text-lg text-right shadow-xl">
              <div className="text-xs text-amber-400 tracking-widest font-bold">
                Carries: {addRes.carries}
              </div>
              <div className="tracking-widest text-slate-300">{binA}₂ ({parseInt(binA || '0', 2)}₁₀)</div>
              <div className="tracking-widest text-slate-300 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">+</span>
                <span>{binB}₂ ({parseInt(binB || '0', 2)}₁₀)</span>
              </div>
              <div className="border-t-2 border-slate-700 pt-2 tracking-widest text-2xl font-extrabold text-emerald-400">
                {addRes.sumBinary}₂
              </div>
              <div className="text-xs text-slate-400 pt-1">
                Decimal Sum: {addRes.sumDecimal}₁₀ {addRes.hasCarryOut && '(Carry Out Generated)'}
              </div>
            </div>
          )}

          {arithmeticOp === 'SUB' && (
            <div className="space-y-4">
              <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 max-w-md mx-auto space-y-2 font-mono text-lg text-right shadow-xl">
                <div className="tracking-widest text-slate-300">{binA}₂ ({parseInt(binA || '0', 2)}₁₀)</div>
                <div className="tracking-widest text-slate-300 flex items-center justify-between">
                  <span className="text-rose-400 font-bold">-</span>
                  <span>{binB}₂ ({parseInt(binB || '0', 2)}₁₀)</span>
                </div>
                <div className="border-t-2 border-slate-700 pt-2 tracking-widest text-2xl font-extrabold text-cyan-400">
                  {subRes.diffBinary}₂
                </div>
                <div className="text-xs text-slate-400 pt-1">
                  Decimal Difference: {subRes.diffDecimal}₁₀
                </div>
              </div>

              {/* 2's Complement Subtraction Steps */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2 max-w-2xl mx-auto">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  2's Complement Subtraction Steps (A - B = A + (-B))
                </h4>
                <div className="space-y-1.5 font-mono text-xs text-slate-300">
                  {subRes.steps.map((st, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-900 border border-slate-800/80">
                      {st}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {arithmeticOp === 'MUL' && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 max-w-md mx-auto space-y-2 font-mono text-lg text-right shadow-xl">
              <div className="tracking-widest text-slate-300">{binA}₂ ({parseInt(binA || '0', 2)}₁₀)</div>
              <div className="tracking-widest text-slate-300 flex items-center justify-between">
                <span className="text-purple-400 font-bold">×</span>
                <span>{binB}₂ ({parseInt(binB || '0', 2)}₁₀)</span>
              </div>
              <div className="border-t border-slate-700 pt-1 space-y-0.5 text-xs text-slate-400">
                {mulRes.partialProducts.map((p, i) => (
                  <div key={i} className="tracking-widest">
                    {p.value}
                  </div>
                ))}
              </div>
              <div className="border-t-2 border-slate-700 pt-2 tracking-widest text-2xl font-extrabold text-purple-400">
                {mulRes.productBinary}₂
              </div>
              <div className="text-xs text-slate-400 pt-1">
                Decimal Product: {mulRes.productDecimal}₁₀
              </div>
            </div>
          )}

          {arithmeticOp === 'DIV' && (
            <div className="p-6 rounded-xl border border-slate-800 bg-slate-950/80 max-w-md mx-auto space-y-3 font-mono text-center shadow-xl">
              {divRes.isDivideByZero ? (
                <div className="text-rose-400 font-bold text-sm">
                  Division by Zero Error: Divisor B cannot be 0.
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-around text-slate-300 text-sm">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Dividend (A)</span>
                      <strong className="text-white">{binA}₂</strong> ({parseInt(binA || '0', 2)}₁₀)
                    </div>
                    <span className="text-amber-400 font-bold text-lg">÷</span>
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Divisor (B)</span>
                      <strong className="text-white">{binB}₂</strong> ({parseInt(binB || '0', 2)}₁₀)
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-emerald-400 block">Quotient (Q)</span>
                      <div className="text-xl font-bold text-white mt-1">{divRes.quotientBinary}₂</div>
                      <span className="text-[10px] text-slate-400">Decimal: {divRes.quotientDecimal}</span>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] uppercase font-bold text-amber-400 block">Remainder (R)</span>
                      <div className="text-xl font-bold text-white mt-1">{divRes.remainderBinary}₂</div>
                      <span className="text-[10px] text-slate-400">Decimal: {divRes.remainderDecimal}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Verification: {parseInt(binB || '0', 2)} × {divRes.quotientDecimal} + {divRes.remainderDecimal} = {parseInt(binA || '0', 2)}
                  </div>
                </>
              )}
            </div>
          )}
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
              <span className="text-xs font-mono text-slate-400">Binary: {bitValA.toString(2).padStart(8, '0')}₂</span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase">Operand B (Decimal)</label>
              <input
                type="number"
                value={bitValB}
                onChange={e => setBitValB(parseInt(e.target.value, 10) || 0)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 font-mono text-white"
              />
              <span className="text-xs font-mono text-slate-400">Binary: {bitValB.toString(2).padStart(8, '0')}₂</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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
                <span className="text-[10px] font-mono text-slate-500">{(op.val >>> 0).toString(2).padStart(8, '0').slice(-8)}₂</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
