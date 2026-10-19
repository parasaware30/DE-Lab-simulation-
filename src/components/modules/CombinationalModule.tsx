import React, { useState } from 'react';
import { COMBINATIONAL_CIRCUITS, CombinationalCircuitSpec } from '../../engine/combinational/circuits';
import { 
  Network, 
  CheckCircle2, 
  Info, 
  Cpu, 
  Sliders, 
  BookOpen, 
  Sparkles 
} from 'lucide-react';

export const CombinationalModule: React.FC = () => {
  const [activeCircuitId, setActiveCircuitId] = useState<string>('halfAdder');
  const spec = COMBINATIONAL_CIRCUITS[activeCircuitId];

  // Dynamic input states initialized with default values from spec
  const [inputs, setInputs] = useState<Record<string, 0 | 1>>(() => {
    const init: Record<string, 0 | 1> = {};
    spec.inputs.forEach(inp => {
      init[inp.id] = inp.default;
    });
    return init;
  });

  // Handle circuit tab change
  const handleCircuitChange = (id: string) => {
    setActiveCircuitId(id);
    const newSpec = COMBINATIONAL_CIRCUITS[id];
    const init: Record<string, 0 | 1> = {};
    newSpec.inputs.forEach(inp => {
      init[inp.id] = inp.default;
    });
    setInputs(init);
  };

  const toggleInput = (id: string) => {
    setInputs(prev => ({
      ...prev,
      [id]: prev[id] === 1 ? 0 : 1,
    }));
  };

  // Evaluate live output
  const outputs = spec.evaluate(inputs);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Combinational Logic Circuits Laboratory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Interactive simulation of essential Medium-Scale Integration (MSI) arithmetic and data routing circuits
        </p>
      </div>

      {/* Circuit Sub-tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.values(COMBINATIONAL_CIRCUITS).map(c => {
          const isSelected = activeCircuitId === c.id;
          return (
            <button
              key={c.id}
              onClick={() => handleCircuitChange(c.id)}
              className={`rounded-lg px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Main Interactive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls & Schematics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">{spec.name}</h3>
                <p className="text-xs font-mono text-emerald-400">{spec.formula}</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400 border border-slate-700">
                {spec.category}
              </span>
            </div>

            {/* Input Switches */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Interactive Digital Inputs</span>
                <span className="text-[10px] text-emerald-400 font-mono">Click switch to toggle</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {spec.inputs.map(inp => {
                  const val = inputs[inp.id] ?? 0;
                  const isHigh = val === 1;

                  return (
                    <button
                      key={inp.id}
                      onClick={() => toggleInput(inp.id)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-lg border transition-all ${
                        isHigh
                          ? 'bg-emerald-500/15 border-emerald-500/60 text-emerald-400 shadow-sm'
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-xs font-mono text-slate-300 font-bold">{inp.label}</span>
                      <span className={`text-2xl font-extrabold font-mono mt-1 ${isHigh ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {val}
                      </span>
                      <span className={`text-[10px] uppercase font-bold mt-1 ${isHigh ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {isHigh ? 'HIGH (1)' : 'LOW (0)'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Outputs Banner */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Circuit Outputs
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {spec.outputs.map(out => {
                  const val = outputs[out.id] ?? 0;
                  const isHigh = val === 1;

                  return (
                    <div
                      key={out.id}
                      className={`rounded-lg border p-3 flex flex-col items-center justify-center transition-all ${
                        isHigh
                          ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-3 w-3 rounded-full transition-all duration-300 ${
                            isHigh
                              ? 'bg-emerald-400 shadow-[0_0_10px_#10b981]'
                              : 'bg-slate-700'
                          }`}
                        />
                        <span className="text-xs font-bold text-slate-300">{out.label}</span>
                      </div>
                      <span className={`text-2xl font-extrabold font-mono mt-2 ${isHigh ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Schematic Architecture Details */}
            <div className="rounded-lg border border-slate-800 bg-slate-950/50 p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Internal Gate Schematic Architecture</span>
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {spec.schematicExplanation}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Truth Table & Pedagogical Reference (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Truth Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Truth Table</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">
                {spec.truthTable.length} States
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="sticky top-0 bg-slate-800 text-slate-300 border-b border-slate-700">
                  <tr>
                    {spec.inputs.map(inp => (
                      <th key={inp.id} className="p-2.5 text-center">{inp.label}</th>
                    ))}
                    {spec.outputs.map(out => (
                      <th key={out.id} className="p-2.5 text-center text-emerald-400 font-bold">{out.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {spec.truthTable.map((row, idx) => {
                    // Check if row matches current input
                    const isCurrent = spec.inputs.every(inp => row.inputs[inp.id] === inputs[inp.id]);

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isCurrent
                            ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                            : 'hover:bg-slate-800/40 text-slate-300'
                        }`}
                      >
                        {spec.inputs.map(inp => (
                          <td key={inp.id} className="p-2 text-center">
                            {row.inputs[inp.id] ?? 0}
                          </td>
                        ))}
                        {spec.outputs.map(out => (
                          <td key={out.id} className="p-2 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              row.outputs[out.id] === 1
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                : 'text-slate-400'
                            }`}>
                              {row.outputs[out.id] ?? 0}
                            </span>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Educational Applications */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-400" />
              <span>Real-World Engineering Applications</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {spec.applications.map((app, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>{app}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
