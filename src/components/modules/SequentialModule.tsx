import React, { useState, useEffect, useRef } from 'react';
import { 
  evaluateSR, 
  evaluateJK, 
  evaluateD, 
  evaluateT, 
  shiftRegisterStep, 
  counterStep,
  SequentialWaveSample,
  FlipFlopType 
} from '../../engine/sequential/flipflops';
import { 
  Activity, 
  Play, 
  Pause, 
  RotateCcw, 
  AlertTriangle, 
  Sliders, 
  Layers,
  Sparkles
} from 'lucide-react';

export const SequentialModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'FLIP_FLOPS' | 'REGISTERS' | 'COUNTERS'>('FLIP_FLOPS');

  // Flip-Flop State
  const [selectedFF, setSelectedFF] = useState<FlipFlopType>('JK');
  const [ffState, setFFState] = useState<{ q: 0 | 1 | 'X'; qBar: 0 | 1 | 'X' }>({ q: 0, qBar: 1 });
  const [inputs, setInputs] = useState<{ s: 0 | 1; r: 0 | 1; j: 0 | 1; k: 0 | 1; d: 0 | 1; t: 0 | 1 }>({
    s: 0, r: 0, j: 1, k: 0, d: 1, t: 1
  });
  const [clockSignal, setClockSignal] = useState<0 | 1>(0);
  const [isAutoClock, setIsAutoClock] = useState<boolean>(false);
  const [clockFrequency, setClockFrequency] = useState<number>(1); // Hz
  const [stateLog, setStateLog] = useState<string>('System initialized.');

  // Timing Waveform samples history
  const [waveHistory, setWaveHistory] = useState<SequentialWaveSample[]>([
    { cycle: 0, clk: 0, q0: 0, q1: 0, q2: 0, q3: 0 }
  ]);

  // Shift Register State
  const [registerBits, setRegisterBits] = useState<(0 | 1)[]>([0, 0, 0, 0]);
  const [serialInput, setSerialInput] = useState<0 | 1>(1);

  // Counter State
  const [counterVal, setCounterVal] = useState<number>(0);
  const [counterMode, setCounterMode] = useState<'UP' | 'DOWN'>('UP');

  // Trigger one clock pulse cycle (0 -> 1 -> 0)
  const pulseClock = () => {
    // 1. Rising edge
    setClockSignal(1);

    // Update Flip-Flop
    let nextQ = ffState.q;
    let nextQBar = ffState.qBar;
    let desc = '';

    if (selectedFF === 'SR') {
      const res = evaluateSR(inputs.s, inputs.r, ffState.q);
      nextQ = res.nextState.q;
      nextQBar = res.nextState.qBar;
      desc = res.stateDescription;
    } else if (selectedFF === 'JK') {
      const res = evaluateJK(inputs.j, inputs.k, ffState.q);
      nextQ = res.nextState.q;
      nextQBar = res.nextState.qBar;
      desc = res.stateDescription;
    } else if (selectedFF === 'D') {
      const res = evaluateD(inputs.d);
      nextQ = res.nextState.q;
      nextQBar = res.nextState.qBar;
      desc = res.stateDescription;
    } else if (selectedFF === 'T') {
      const res = evaluateT(inputs.t, ffState.q);
      nextQ = res.nextState.q;
      nextQBar = res.nextState.qBar;
      desc = res.stateDescription;
    }

    setFFState({ q: nextQ, qBar: nextQBar });
    setStateLog(desc);

    // Update Shift Register
    setRegisterBits(prev => shiftRegisterStep(prev, serialInput));

    // Update Counter
    setCounterVal(prev => counterStep(prev, counterMode, 16));

    // Append Wave sample
    setWaveHistory(prev => {
      const cycle = prev.length;
      const qVal = nextQ === 1 ? 1 : 0;
      const cntBin = (counterStep(counterVal, counterMode, 16)).toString(2).padStart(4, '0');
      return [
        ...prev.slice(-15),
        {
          cycle,
          clk: 1,
          q0: parseInt(cntBin[3], 10) as 0 | 1,
          q1: parseInt(cntBin[2], 10) as 0 | 1,
          q2: parseInt(cntBin[1], 10) as 0 | 1,
          q3: parseInt(cntBin[0], 10) as 0 | 1,
        },
      ];
    });

    // Reset clock back to 0 shortly after
    setTimeout(() => {
      setClockSignal(0);
    }, 150);
  };

  // Auto-Clock Generator Interval
  useEffect(() => {
    if (!isAutoClock) return;
    const intervalMs = Math.round(1000 / clockFrequency);
    const timer = setInterval(() => {
      pulseClock();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoClock, clockFrequency, selectedFF, inputs, ffState, serialInput, counterMode, counterVal]);

  const handleReset = () => {
    setFFState({ q: 0, qBar: 1 });
    setRegisterBits([0, 0, 0, 0]);
    setCounterVal(0);
    setStateLog('Asynchronous Master Reset applied.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Sequential Logic & Clocking Simulator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Simulate clocked flip-flops (SR, JK, D, T), shift registers, ripple counters, and real-time timing waveforms
        </p>
      </div>

      {/* Global Clock Generator Control Strip */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full transition-all duration-150 ${
                clockSignal === 1 ? 'bg-cyan-400 shadow-[0_0_10px_#22d3ee]' : 'bg-slate-700'
              }`}
            />
            <span className="text-xs font-mono font-bold text-white">
              CLK: {clockSignal}
            </span>
          </div>

          <button
            onClick={pulseClock}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm transition-colors"
          >
            Manual Pulse (↑ Trigger)
          </button>

          <button
            onClick={() => setIsAutoClock(!isAutoClock)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              isAutoClock
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
            }`}
          >
            {isAutoClock ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{isAutoClock ? 'Stop Clock' : 'Auto Clock'}</span>
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Sliders className="h-3.5 w-3.5" />
            <span>Freq: {clockFrequency} Hz</span>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={clockFrequency}
              onChange={e => setClockFrequency(parseFloat(e.target.value))}
              className="w-24 accent-emerald-500 cursor-pointer"
            />
          </div>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-bold border border-rose-500/40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Async Reset (CLR)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('FLIP_FLOPS')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === 'FLIP_FLOPS'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          Flip-Flops Test Bench
        </button>
        <button
          onClick={() => setActiveSubTab('REGISTERS')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === 'REGISTERS'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          4-Bit Shift Register (SISO)
        </button>
        <button
          onClick={() => setActiveSubTab('COUNTERS')}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            activeSubTab === 'COUNTERS'
              ? 'bg-emerald-500 text-slate-950 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          4-Bit Binary Ripple Counter
        </button>
      </div>

      {/* Section 1: Flip-Flop Test Bench */}
      {activeSubTab === 'FLIP_FLOPS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
              {/* Flip-Flop Selector */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-400 uppercase">Select Flip-Flop:</span>
                <div className="flex gap-1.5">
                  {(['JK', 'SR', 'D', 'T'] as FlipFlopType[]).map(type => (
                    <button
                      key={type}
                      onClick={() => {
                        setSelectedFF(type);
                        setFFState({ q: 0, qBar: 1 });
                      }}
                      className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                        selectedFF === type
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {type} Flip-Flop
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Switches for Active FF */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Inputs for {selectedFF} Flip-Flop
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {selectedFF === 'SR' && (
                    <>
                      <button
                        onClick={() => setInputs(i => ({ ...i, s: i.s === 1 ? 0 : 1 }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          inputs.s === 1
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Set (S)</span>
                        <div className="text-2xl font-extrabold font-mono mt-1">{inputs.s}</div>
                      </button>
                      <button
                        onClick={() => setInputs(i => ({ ...i, r: i.r === 1 ? 0 : 1 }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          inputs.r === 1
                            ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Reset (R)</span>
                        <div className="text-2xl font-extrabold font-mono mt-1">{inputs.r}</div>
                      </button>
                    </>
                  )}

                  {selectedFF === 'JK' && (
                    <>
                      <button
                        onClick={() => setInputs(i => ({ ...i, j: i.j === 1 ? 0 : 1 }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          inputs.j === 1
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Input J</span>
                        <div className="text-2xl font-extrabold font-mono mt-1">{inputs.j}</div>
                      </button>
                      <button
                        onClick={() => setInputs(i => ({ ...i, k: i.k === 1 ? 0 : 1 }))}
                        className={`p-3 rounded-lg border text-center transition-all ${
                          inputs.k === 1
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                      >
                        <span className="text-xs font-bold font-mono">Input K</span>
                        <div className="text-2xl font-extrabold font-mono mt-1">{inputs.k}</div>
                      </button>
                    </>
                  )}

                  {selectedFF === 'D' && (
                    <button
                      onClick={() => setInputs(i => ({ ...i, d: i.d === 1 ? 0 : 1 }))}
                      className={`col-span-2 p-3 rounded-lg border text-center transition-all ${
                        inputs.d === 1
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">Data Line (D)</span>
                      <div className="text-2xl font-extrabold font-mono mt-1">{inputs.d}</div>
                    </button>
                  )}

                  {selectedFF === 'T' && (
                    <button
                      onClick={() => setInputs(i => ({ ...i, t: i.t === 1 ? 0 : 1 }))}
                      className={`col-span-2 p-3 rounded-lg border text-center transition-all ${
                        inputs.t === 1
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400'
                      }`}
                    >
                      <span className="text-xs font-bold font-mono">Toggle Line (T)</span>
                      <div className="text-2xl font-extrabold font-mono mt-1">{inputs.t}</div>
                    </button>
                  )}
                </div>
              </div>

              {/* State Output LEDs */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Internal Stored State
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border text-center ${
                    ffState.q === 1
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}>
                    <span className="text-xs font-bold">Normal Output (Q)</span>
                    <div className="text-3xl font-mono font-extrabold mt-1">{ffState.q}</div>
                  </div>

                  <div className={`p-4 rounded-xl border text-center ${
                    ffState.qBar === 1
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400'
                  }`}>
                    <span className="text-xs font-bold">Inverted Output (Q')</span>
                    <div className="text-3xl font-mono font-extrabold mt-1">{ffState.qBar}</div>
                  </div>
                </div>
              </div>

              {/* State Transition Note */}
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs font-mono text-cyan-300">
                Log: {stateLog}
              </div>
            </div>
          </div>

          {/* Right: Characteristic Table & Info (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white">
                {selectedFF} Flip-Flop Characteristic Table
              </h3>

              {selectedFF === 'JK' && (
                <div className="text-xs space-y-2">
                  <p className="text-slate-300">
                    The JK Flip-Flop eliminates the undefined state of SR by complementing output when J=1 and K=1.
                  </p>
                  <table className="w-full text-xs font-mono text-left border border-slate-800 rounded bg-slate-950">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="p-2">J</th>
                        <th className="p-2">K</th>
                        <th className="p-2">Q(n+1)</th>
                        <th className="p-2">State Operation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      <tr><td className="p-2">0</td><td className="p-2">0</td><td className="p-2">Q(n)</td><td className="p-2">No Change (Hold)</td></tr>
                      <tr><td className="p-2">0</td><td className="p-2">1</td><td className="p-2">0</td><td className="p-2">Reset</td></tr>
                      <tr><td className="p-2">1</td><td className="p-2">0</td><td className="p-2">1</td><td className="p-2">Set</td></tr>
                      <tr><td className="p-2 text-emerald-400 font-bold">1</td><td className="p-2 text-emerald-400 font-bold">1</td><td className="p-2 text-emerald-400 font-bold">Q'(n)</td><td className="p-2 text-emerald-400 font-bold">Toggle</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {selectedFF === 'SR' && (
                <div className="text-xs space-y-2">
                  <p className="text-slate-300">
                    Basic Set-Reset bistable multivibrator. S=1, R=1 produces an invalid state.
                  </p>
                  <table className="w-full text-xs font-mono text-left border border-slate-800 rounded bg-slate-950">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="p-2">S</th>
                        <th className="p-2">R</th>
                        <th className="p-2">Q(n+1)</th>
                        <th className="p-2">State Operation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-400">
                      <tr><td className="p-2">0</td><td className="p-2">0</td><td className="p-2">Q(n)</td><td className="p-2">Hold</td></tr>
                      <tr><td className="p-2">0</td><td className="p-2">1</td><td className="p-2">0</td><td className="p-2">Reset</td></tr>
                      <tr><td className="p-2">1</td><td className="p-2">0</td><td className="p-2">1</td><td className="p-2">Set</td></tr>
                      <tr className="text-rose-400 font-bold"><td className="p-2">1</td><td className="p-2">1</td><td className="p-2">X</td><td className="p-2">Forbidden / Invalid</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {selectedFF === 'D' && (
                <div className="text-xs space-y-2">
                  <p className="text-slate-300">
                    Data (Delay) Flip-Flop transfers input D to output Q on the active clock edge. Q(n+1) = D.
                  </p>
                </div>
              )}

              {selectedFF === 'T' && (
                <div className="text-xs space-y-2">
                  <p className="text-slate-300">
                    Toggle Flip-Flop inverts state when T=1 and holds when T=0. Fundamental component of binary counters.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Section 2: 4-Bit Shift Register (SISO) */}
      {activeSubTab === 'REGISTERS' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">4-Bit Serial-In Serial-Out (SISO) Shift Register</h3>
              <p className="text-xs text-slate-400">Bits shift right through cascaded D flip-flops on each clock edge</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Next Serial In (D):</span>
              <button
                onClick={() => setSerialInput(s => (s === 1 ? 0 : 1))}
                className={`px-3 py-1 rounded font-mono font-bold text-xs ${
                  serialInput === 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {serialInput} ({serialInput === 1 ? 'HIGH' : 'LOW'})
              </button>
            </div>
          </div>

          {/* Graphical Shift Register Stages */}
          <div className="grid grid-cols-4 gap-3">
            {registerBits.map((bit, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 text-center transition-all ${
                  bit === 1
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold text-slate-400">Stage Q{idx} (FF {idx})</span>
                <div className="text-3xl font-extrabold font-mono mt-2">{bit}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-400">
            Click <strong>"Manual Pulse"</strong> above to clock the register and shift bits right.
          </p>
        </div>
      )}

      {/* Section 3: 4-Bit Binary Ripple Counter */}
      {activeSubTab === 'COUNTERS' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">4-Bit Asynchronous Binary Counter (MOD-16)</h3>
              <p className="text-xs text-slate-400">Counts from 0 to 15 (0000₂ to 1111₂) using T/JK flip-flops</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCounterMode(m => (m === 'UP' ? 'DOWN' : 'UP'))}
                className="px-3 py-1 rounded bg-slate-800 text-emerald-400 border border-slate-700 text-xs font-bold"
              >
                Mode: Counting {counterMode}
              </button>
            </div>
          </div>

          {/* Visual Digital Display */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 py-4">
            <div className="rounded-2xl border-2 border-emerald-500/40 bg-slate-950 p-6 text-center w-48 shadow-xl shadow-emerald-950/40">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Decimal Value</span>
              <div className="text-5xl font-mono font-extrabold text-emerald-400 mt-2">
                {counterVal}
              </div>
            </div>

            <div className="rounded-2xl border-2 border-cyan-500/40 bg-slate-950 p-6 text-center w-56 shadow-xl shadow-cyan-950/40">
              <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Binary Output (Q3 Q2 Q1 Q0)</span>
              <div className="text-4xl font-mono font-extrabold text-cyan-400 mt-2 tracking-widest">
                {counterVal.toString(2).padStart(4, '0')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Waveform Timing Diagram */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-400" />
          <span>Real-Time Timing Diagram Waveforms (Last {waveHistory.length} Cycles)</span>
        </h3>

        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4">
          <svg className="w-full h-44 min-w-[500px]" viewBox={`0 0 ${waveHistory.length * 40 + 60} 140`}>
            {/* Grid Lines */}
            {waveHistory.map((_, i) => (
              <line
                key={i}
                x1={60 + i * 40}
                y1="10"
                x2={60 + i * 40}
                y2="130"
                stroke="#1e293b"
                strokeWidth="1"
              />
            ))}

            {/* CLK Wave */}
            <text x="10" y="32" fill="#38bdf8" fontSize="11" fontWeight="bold">CLK</text>
            <path
              d={waveHistory.reduce((acc, s, i) => {
                const x = 60 + i * 40;
                const y = s.clk === 1 ? 20 : 38;
                return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
              }, '')}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
            />

            {/* Q0 Wave */}
            <text x="10" y="72" fill="#10b981" fontSize="11" fontWeight="bold">Q0</text>
            <path
              d={waveHistory.reduce((acc, s, i) => {
                const x = 60 + i * 40;
                const y = s.q0 === 1 ? 60 : 78;
                return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
              }, '')}
              fill="none"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Q1 Wave */}
            <text x="10" y="112" fill="#f59e0b" fontSize="11" fontWeight="bold">Q1</text>
            <path
              d={waveHistory.reduce((acc, s, i) => {
                const x = 60 + i * 40;
                const y = s.q1 === 1 ? 100 : 118;
                return acc + (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
              }, '')}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2.5"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};
