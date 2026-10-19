import React, { useState } from 'react';
import { 
  GATE_DEFINITIONS, 
  evalGate 
} from '../../engine/logicGates';
import { GateType, LogicValue } from '../../engine/types';
import { Info, Cpu, CheckCircle2, Sliders } from 'lucide-react';

export const GateSimulatorModule: React.FC = () => {
  const [selectedGate, setSelectedGate] = useState<GateType>('AND');
  const [inputs, setInputs] = useState<LogicValue[]>([0, 0]);
  const [numInputs, setNumInputs] = useState<number>(2);

  const gateInfo = GATE_DEFINITIONS[selectedGate];

  const handleGateChange = (type: GateType) => {
    setSelectedGate(type);
    if (type === 'NOT' || type === 'BUFFER') {
      setNumInputs(1);
      setInputs([0]);
    } else {
      setNumInputs(2);
      setInputs([0, 0]);
    }
  };

  const handleNumInputsChange = (count: number) => {
    setNumInputs(count);
    const newInputs = Array.from({ length: count }, (_, i) => inputs[i] ?? 0);
    setInputs(newInputs);
  };

  const toggleInput = (idx: number) => {
    const next = [...inputs];
    next[idx] = next[idx] === 1 ? 0 : 1;
    setInputs(next);
  };

  const outputValue = evalGate(selectedGate, inputs);

  // Generate dynamic truth table based on numInputs
  const totalRows = 1 << numInputs;
  const truthTableRows = [];
  for (let i = 0; i < totalRows; i++) {
    const rowInputs: LogicValue[] = [];
    for (let j = 0; j < numInputs; j++) {
      const bit = ((i >> (numInputs - 1 - j)) & 1) as 0 | 1;
      rowInputs.push(bit);
    }
    const rowOut = evalGate(selectedGate, rowInputs);
    const isCurrentActive = rowInputs.every((val, idx) => val === inputs[idx]);
    truthTableRows.push({ rowInputs, rowOut, isCurrentActive });
  }

  // Render ANSI/IEEE standard gate SVG
  const renderGateSVG = () => {
    const isHigh = outputValue === 1;
    const outColor = isHigh ? '#10b981' : '#64748b';

    return (
      <svg className="w-full max-w-[340px] h-48 mx-auto" viewBox="0 0 340 160">
        <defs>
          <filter id="glow-high" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Inputs wires */}
        {inputs.map((val, idx) => {
          const y = inputs.length === 1 
            ? 80 
            : 80 + (idx - (inputs.length - 1) / 2) * (100 / Math.max(inputs.length - 1, 1));
          const wireColor = val === 1 ? '#10b981' : '#475569';

          return (
            <g key={idx}>
              <line 
                x1="20" 
                y1={y} 
                x2="110" 
                y2={y} 
                stroke={wireColor} 
                strokeWidth="4" 
                filter={val === 1 ? 'url(#glow-high)' : undefined}
              />
              <circle cx="20" cy={y} r="6" fill={wireColor} />
              <text x="35" y={y - 8} fill="#94a3b8" fontSize="12" fontWeight="bold">
                {String.fromCharCode(65 + idx)} = {val}
              </text>
            </g>
          );
        })}

        {/* Output wire */}
        <line 
          x1="230" 
          y1="80" 
          x2="310" 
          y2="80" 
          stroke={outColor} 
          strokeWidth="4" 
          filter={isHigh ? 'url(#glow-high)' : undefined}
        />
        <circle cx="310" cy="80" r="7" fill={outColor} />
        <text x="270" y="70" fill={outColor} fontSize="14" fontWeight="bold">
          Y = {outputValue}
        </text>

        {/* Gate Graphic Shape */}
        <g transform="translate(110, 30)">
          {selectedGate === 'AND' && (
            <path d="M 0 0 L 50 0 A 50 50 0 0 1 50 100 L 0 100 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          )}
          {selectedGate === 'NAND' && (
            <>
              <path d="M 0 0 L 50 0 A 50 50 0 0 1 50 100 L 0 100 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="106" cy="50" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            </>
          )}
          {selectedGate === 'OR' && (
            <path d="M 0 0 Q 30 50 0 100 Q 55 100 100 50 Q 55 0 0 0 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
          )}
          {selectedGate === 'NOR' && (
            <>
              <path d="M 0 0 Q 30 50 0 100 Q 55 100 100 50 Q 55 0 0 0 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="106" cy="50" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            </>
          )}
          {selectedGate === 'XOR' && (
            <>
              <path d="M -12 0 Q 18 50 -12 100" fill="none" stroke="#38bdf8" strokeWidth="3" />
              <path d="M 0 0 Q 30 50 0 100 Q 55 100 100 50 Q 55 0 0 0 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            </>
          )}
          {selectedGate === 'XNOR' && (
            <>
              <path d="M -12 0 Q 18 50 -12 100" fill="none" stroke="#38bdf8" strokeWidth="3" />
              <path d="M 0 0 Q 30 50 0 100 Q 55 100 100 50 Q 55 0 0 0 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="106" cy="50" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            </>
          )}
          {selectedGate === 'NOT' && (
            <>
              <path d="M 0 10 L 80 50 L 0 90 Z" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
              <circle cx="86" cy="50" r="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="3" />
            </>
          )}

          {/* Gate label inside */}
          <text x="35" y="55" fill="#94a3b8" fontSize="13" fontWeight="bold" textAnchor="middle">
            {selectedGate}
          </text>
        </g>
      </svg>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Module Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Logic Gate Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Simulate all 7 fundamental gates with dynamic multi-input support and real-time truth tables
        </p>
      </div>

      {/* Gate Selection Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(GATE_DEFINITIONS).map(gate => {
          const isSelected = selectedGate === gate;
          return (
            <button
              key={gate}
              onClick={() => handleGateChange(gate as GateType)}
              className={`rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {gate} Gate
            </button>
          );
        })}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Gate Canvas & Controls (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{gateInfo.fullName}</h3>
                <p className="text-xs font-mono text-emerald-400">{gateInfo.expression}</p>
              </div>

              {selectedGate !== 'NOT' && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Inputs:</span>
                  {[2, 3, 4].map(count => (
                    <button
                      key={count}
                      onClick={() => handleNumInputsChange(count)}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors ${
                        numInputs === count
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SVG Gate Rendering */}
            <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 flex items-center justify-center">
              {renderGateSVG()}
            </div>

            {/* Interactive Binary Input Switches */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Interactive Binary Inputs (Click to Toggle 0 / 1)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {inputs.map((val, idx) => {
                  const isOne = val === 1;
                  return (
                    <button
                      key={idx}
                      onClick={() => toggleInput(idx)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                        isOne
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[11px] font-mono text-slate-400">
                        Input {String.fromCharCode(65 + idx)}
                      </span>
                      <span className={`text-2xl font-extrabold font-mono mt-1 ${isOne ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {val}
                      </span>
                      <span className={`text-[10px] mt-1 font-semibold uppercase ${isOne ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isOne ? 'HIGH (1)' : 'LOW (0)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output State Indicator */}
            <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`h-4 w-4 rounded-full transition-all duration-300 ${
                    outputValue === 1
                      ? 'bg-emerald-400 shadow-[0_0_12px_#10b981]'
                      : 'bg-slate-700'
                  }`}
                />
                <div>
                  <span className="text-xs font-semibold text-slate-400">Current Output (Y)</span>
                  <p className="text-sm font-bold text-white">
                    {outputValue === 1 ? 'Logic HIGH (1) - Signal Active' : 'Logic LOW (0) - Signal Inactive'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase font-mono">IC Specification</span>
                <p className="text-xs font-mono font-semibold text-slate-300">{gateInfo.icNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Truth Table & Educational Reference (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Truth Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Truth Table ({numInputs}-Input)</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {totalRows} Combinations
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-800 text-slate-300 border-b border-slate-700">
                  <tr>
                    {inputs.map((_, idx) => (
                      <th key={idx} className="p-2.5 text-center">
                        {String.fromCharCode(65 + idx)}
                      </th>
                    ))}
                    <th className="p-2.5 text-center text-emerald-400 font-bold">
                      Output (Y)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {truthTableRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        row.isCurrentActive
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'hover:bg-slate-800/40 text-slate-300'
                      }`}
                    >
                      {row.rowInputs.map((val, inIdx) => (
                        <td key={inIdx} className="p-2 text-center">
                          {val}
                        </td>
                      ))}
                      <td className="p-2 text-center font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-xs ${
                            row.rowOut === 1
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {row.rowOut}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400">
              * The highlighted row reflects your currently selected input state.
            </p>
          </div>

          {/* Educational Theory Card */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="h-4 w-4 text-cyan-400" />
              <span>Theory & Applications</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {gateInfo.description}
            </p>
            <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-slate-400">
                <span>Boolean Equation:</span>
                <span className="font-mono text-emerald-400">{gateInfo.expression}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Standard IC Package:</span>
                <span className="font-mono text-slate-300">{gateInfo.icNumber}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Propagation Delay (typ.):</span>
                <span className="font-mono text-slate-300">~10 ns (TTL 74LS)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
