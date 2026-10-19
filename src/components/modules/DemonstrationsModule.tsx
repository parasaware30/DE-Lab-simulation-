import React, { useState, useEffect } from 'react';
import { 
  MonitorPlay, 
  Play, 
  Pause, 
  RotateCcw, 
  Lock, 
  Unlock, 
  ShieldAlert, 
  Radio, 
  Clock, 
  Info,
  CheckCircle2
} from 'lucide-react';

export const DemonstrationsModule: React.FC = () => {
  const [activeDemo, setActiveDemo] = useState<string>('sevenSeg');

  // Demo 1: BCD to Seven Segment
  const [bcdDigit, setBcdDigit] = useState<number>(5);

  // Demo 2: Binary Counter Display
  const [counterCount, setCounterCount] = useState<number>(0);
  const [isCounterRunning, setIsCounterRunning] = useState<boolean>(false);

  // Demo 3: Traffic Light State Machine
  const [trafficLightState, setTrafficLightState] = useState<'RED' | 'YELLOW' | 'GREEN'>('GREEN');
  const [carWaitingSensor, setCarWaitingSensor] = useState<boolean>(false);

  // Demo 4: Password Combination Lock (Combination is 1-0-1-1)
  const [enteredCode, setEnteredCode] = useState<[0|1, 0|1, 0|1, 0|1]>([0, 0, 0, 0]);
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [isLockedOut, setIsLockedOut] = useState<boolean>(false);

  // Demo 5: Digital Alarm System
  const [alarmArmed, setAlarmArmed] = useState<boolean>(true);
  const [motionSensor, setMotionSensor] = useState<boolean>(false);
  const [windowSensor, setWindowSensor] = useState<boolean>(false);
  const [smokeSensor, setSmokeSensor] = useState<boolean>(false);

  // Demo 6: 4-Channel Multiplexer Bus
  const [muxSelect, setMuxSelect] = useState<number>(0);

  // Counter Auto-tick
  useEffect(() => {
    if (!isCounterRunning) return;
    const t = setInterval(() => {
      setCounterCount(c => (c + 1) % 10);
    }, 1000);
    return () => clearInterval(t);
  }, [isCounterRunning]);

  // Traffic Light timer
  useEffect(() => {
    const t = setInterval(() => {
      setTrafficLightState(cur => {
        if (cur === 'GREEN') return 'YELLOW';
        if (cur === 'YELLOW') return 'RED';
        return 'GREEN';
      });
    }, 4000);
    return () => clearInterval(t);
  }, []);

  // Alarm output: Siren triggers if (Smoke is active) OR (Armed AND (Motion OR Window))
  const isSirenTriggered = smokeSensor || (alarmArmed && (motionSensor || windowSensor));

  // Seven segment decoder segment map for digits 0-9
  // Segments: a (top), b (top-right), c (bottom-right), d (bottom), e (bottom-left), f (top-left), g (middle)
  const segmentMap: Record<number, Record<string, boolean>> = {
    0: { a: true, b: true, c: true, d: true, e: true, f: true, g: false },
    1: { a: false, b: true, c: true, d: false, e: false, f: false, g: false },
    2: { a: true, b: true, c: false, d: true, e: true, f: false, g: true },
    3: { a: true, b: true, c: true, d: true, e: false, f: false, g: true },
    4: { a: false, b: true, c: true, d: false, e: false, f: true, g: true },
    5: { a: true, b: false, c: true, d: true, e: false, f: true, g: true },
    6: { a: true, b: false, c: true, d: true, e: true, f: true, g: true },
    7: { a: true, b: true, c: true, d: false, e: false, f: false, g: false },
    8: { a: true, b: true, c: true, d: true, e: true, f: true, g: true },
    9: { a: true, b: true, c: true, d: true, e: false, f: true, g: true },
  };

  // Render SVG 7-Segment Display
  const renderSevenSegment = (digit: number) => {
    const segs = segmentMap[digit] || segmentMap[0];
    const onColor = '#ef4444'; // Red LED
    const offColor = '#1e293b';

    return (
      <svg className="w-28 h-44 mx-auto" viewBox="0 0 100 150">
        {/* Segment a (top horizontal) */}
        <path d="M 22 15 L 78 15 L 68 25 L 32 25 Z" fill={segs.a ? onColor : offColor} filter={segs.a ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment b (top right vertical) */}
        <path d="M 80 17 L 80 68 L 70 60 L 70 27 Z" fill={segs.b ? onColor : offColor} filter={segs.b ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment c (bottom right vertical) */}
        <path d="M 80 74 L 80 125 L 70 115 L 70 82 Z" fill={segs.c ? onColor : offColor} filter={segs.c ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment d (bottom horizontal) */}
        <path d="M 22 127 L 78 127 L 68 117 L 32 117 Z" fill={segs.d ? onColor : offColor} filter={segs.d ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment e (bottom left vertical) */}
        <path d="M 20 74 L 20 125 L 30 115 L 30 82 Z" fill={segs.e ? onColor : offColor} filter={segs.e ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment f (top left vertical) */}
        <path d="M 20 17 L 20 68 L 30 60 L 30 27 Z" fill={segs.f ? onColor : offColor} filter={segs.f ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
        {/* Segment g (middle horizontal) */}
        <path d="M 25 71 L 75 71 L 68 76 L 32 76 Z" fill={segs.g ? onColor : offColor} filter={segs.g ? 'drop-shadow(0 0 4px #ef4444)' : undefined} />
      </svg>
    );
  };

  const handleTestPassword = () => {
    if (isLockedOut) return;
    // Target combination: 1-0-1-1
    if (enteredCode[0] === 1 && enteredCode[1] === 0 && enteredCode[2] === 1 && enteredCode[3] === 1) {
      setIsUnlocked(true);
      setFailedAttempts(0);
    } else {
      setIsUnlocked(false);
      const nextFail = failedAttempts + 1;
      setFailedAttempts(nextFail);
      if (nextFail >= 3) {
        setIsLockedOut(true);
      }
    }
  };

  const demos = [
    { id: 'sevenSeg', label: 'BCD to 7-Segment Display' },
    { id: 'counter', label: 'Binary Counter 7-Seg Display' },
    { id: 'traffic', label: 'Traffic Light State Machine' },
    { id: 'lock', label: '4-Bit Combination Digital Lock' },
    { id: 'alarm', label: 'Home Security Digital Alarm' },
    { id: 'muxBus', label: '4-Channel Audio/Data MUX' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Digital Demonstration Laboratory
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Six practical real-world applications engineered from fundamental digital logic and state machines
        </p>
      </div>

      {/* Demo Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {demos.map(d => (
          <button
            key={d.id}
            onClick={() => setActiveDemo(d.id)}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeDemo === d.id
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Demo 1: BCD to 7-Segment */}
      {activeDemo === 'sevenSeg' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 text-center">
            <h3 className="text-sm font-bold text-white">Illuminated 7-Segment LED Readout</h3>
            <div className="p-6 rounded-2xl bg-black border border-slate-800 shadow-2xl flex justify-center">
              {renderSevenSegment(bcdDigit)}
            </div>
            <div className="text-xs font-mono text-emerald-400">
              BCD Input: {bcdDigit.toString(2).padStart(4, '0')}₂ (Digit {bcdDigit})
            </div>
          </div>

          <div className="md:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Select Decimal Digit (0 - 9)</h3>
            <div className="grid grid-cols-5 gap-2">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
                <button
                  key={n}
                  onClick={() => setBcdDigit(n)}
                  className={`p-3 rounded-lg font-mono text-base font-bold transition-colors ${
                    bcdDigit === n
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-400">
              <h4 className="font-bold text-slate-200">Decoding Logic (7447 IC):</h4>
              <p>
                Each segment (a through g) is driven by Boolean equations derived from the 4 BCD bits (A, B, C, D).
                For example, segment <strong>a = A + C + BD + B'D'</strong>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo 2: Binary Counter 7-Segment */}
      {activeDemo === 'counter' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6 max-w-xl mx-auto text-center">
          <h3 className="text-base font-bold text-white">Clocked 0 to 9 Counter with LED Display</h3>
          <div className="p-6 rounded-2xl bg-black border border-slate-800 shadow-2xl flex justify-center">
            {renderSevenSegment(counterCount)}
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsCounterRunning(!isCounterRunning)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow"
            >
              {isCounterRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              <span>{isCounterRunning ? 'Pause Counter' : 'Auto Increment'}</span>
            </button>

            <button
              onClick={() => setCounterCount(0)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset to 0</span>
            </button>
          </div>
        </div>
      )}

      {/* Demo 3: Traffic Light State Machine */}
      {activeDemo === 'traffic' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 flex flex-col items-center justify-center space-y-4">
            <h3 className="text-sm font-bold text-white">Traffic Signal Column</h3>
            {/* Traffic Signal Housing */}
            <div className="w-28 p-4 rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl space-y-4 flex flex-col items-center">
              {/* Red Light */}
              <div
                className={`h-16 w-16 rounded-full border-2 border-red-950 transition-all duration-300 ${
                  trafficLightState === 'RED'
                    ? 'bg-red-500 shadow-[0_0_24px_#ef4444]'
                    : 'bg-red-950/40 opacity-40'
                }`}
              />
              {/* Yellow Light */}
              <div
                className={`h-16 w-16 rounded-full border-2 border-amber-950 transition-all duration-300 ${
                  trafficLightState === 'YELLOW'
                    ? 'bg-amber-400 shadow-[0_0_24px_#f59e0b]'
                    : 'bg-amber-950/40 opacity-40'
                }`}
              />
              {/* Green Light */}
              <div
                className={`h-16 w-16 rounded-full border-2 border-emerald-950 transition-all duration-300 ${
                  trafficLightState === 'GREEN'
                    ? 'bg-emerald-500 shadow-[0_0_24px_#10b981]'
                    : 'bg-emerald-950/40 opacity-40'
                }`}
              />
            </div>
            <span className="text-xs font-mono font-bold text-slate-300">
              Active State: <span className="text-emerald-400">{trafficLightState}</span>
            </span>
          </div>

          <div className="md:col-span-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Finite State Machine (FSM) Architecture</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              This sequential controller cycles through 3 states encoded with 2 D flip-flops (S1, S0):
            </p>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs font-mono text-slate-300">
              <div>State 00: GREEN (Vehicular flow permitted)</div>
              <div>State 01: YELLOW (Deceleration phase)</div>
              <div>State 10: RED (Pedestrian crossing / intersection halt)</div>
            </div>
            <div className="pt-2">
              <label className="text-xs font-bold text-slate-400 uppercase">Emergency Override Switch:</label>
              <div className="flex gap-2 mt-2">
                {(['GREEN', 'YELLOW', 'RED'] as const).map(color => (
                  <button
                    key={color}
                    onClick={() => setTrafficLightState(color)}
                    className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                  >
                    Force {color}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Demo 4: Combination Lock */}
      {activeDemo === 'lock' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {isUnlocked ? <Unlock className="h-5 w-5 text-emerald-400" /> : <Lock className="h-5 w-5 text-amber-400" />}
                <span>4-Bit Digital Password Lock</span>
              </h3>
              <p className="text-xs text-slate-400">Secret binary key logic: [1 - 0 - 1 - 1]</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isUnlocked ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
            }`}>
              {isUnlocked ? 'ACCESS GRANTED' : 'LOCKED'}
            </span>
          </div>

          {/* Keypad switches */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase">Toggle 4-Bit Code Switches:</label>
            <div className="grid grid-cols-4 gap-3">
              {enteredCode.map((bit, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const next = [...enteredCode] as [0|1, 0|1, 0|1, 0|1];
                    next[idx] = next[idx] === 1 ? 0 : 1;
                    setEnteredCode(next);
                  }}
                  className={`p-4 rounded-xl border font-mono text-2xl font-extrabold transition-all ${
                    bit === 1
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] block text-slate-500">Bit {idx + 1}</span>
                  {bit}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              Failed attempts: <strong className="text-rose-400">{failedAttempts} / 3</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setFailedAttempts(0);
                  setIsLockedOut(false);
                  setIsUnlocked(false);
                }}
                className="px-3 py-1.5 rounded bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700"
              >
                Reset System
              </button>
              <button
                onClick={handleTestPassword}
                disabled={isLockedOut}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-xs font-bold text-white shadow"
              >
                Enter Key
              </button>
            </div>
          </div>

          {isLockedOut && (
            <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>SECURITY LOCKOUT TRIGGERED! 3 incorrect attempts recorded.</span>
            </div>
          )}
        </div>
      )}

      {/* Demo 5: Home Security Alarm */}
      {activeDemo === 'alarm' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-400" />
                <span>Digital Home Security Alarm System</span>
              </h3>
              <p className="text-xs text-slate-400">Logic: Siren = Smoke + (Armed · (Motion + Window))</p>
            </div>

            <div className={`px-4 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-2 ${
              isSirenTriggered
                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              <span className={`h-2.5 w-2.5 rounded-full ${isSirenTriggered ? 'bg-white' : 'bg-emerald-400'}`} />
              <span>{isSirenTriggered ? 'ALARM SIREN ACTIVE (1)' : 'STANDBY SECURE (0)'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button
              onClick={() => setAlarmArmed(!alarmArmed)}
              className={`p-4 rounded-xl border text-left transition-all ${
                alarmArmed ? 'bg-emerald-500/15 border-emerald-500/50' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-400">Master Key Switch</span>
              <div className="text-sm font-bold text-white mt-1">{alarmArmed ? 'SYSTEM ARMED (1)' : 'DISARMED (0)'}</div>
            </button>

            <button
              onClick={() => setMotionSensor(!motionSensor)}
              className={`p-4 rounded-xl border text-left transition-all ${
                motionSensor ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-400">PIR Motion Detector</span>
              <div className="text-sm font-bold text-white mt-1">{motionSensor ? 'MOTION DETECTED (1)' : 'CLEAR (0)'}</div>
            </button>

            <button
              onClick={() => setWindowSensor(!windowSensor)}
              className={`p-4 rounded-xl border text-left transition-all ${
                windowSensor ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-400">Window Magnetic Contact</span>
              <div className="text-sm font-bold text-white mt-1">{windowSensor ? 'WINDOW OPEN (1)' : 'CLOSED (0)'}</div>
            </button>

            <button
              onClick={() => setSmokeSensor(!smokeSensor)}
              className={`p-4 rounded-xl border text-left transition-all ${
                smokeSensor ? 'bg-rose-500/20 border-rose-500/50' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className="text-[10px] font-bold uppercase text-slate-400">Smoke / Fire Sensor</span>
              <div className="text-sm font-bold text-white mt-1">{smokeSensor ? 'SMOKE DETECTED (1)' : 'CLEAR (0)'}</div>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            * Note: The smoke sensor triggers the siren unconditionally even when the system is disarmed, demonstrating priority OR logic.
          </p>
        </div>
      )}

      {/* Demo 6: 4-Channel Multiplexer */}
      {activeDemo === 'muxBus' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white">4-Channel Data Bus Multiplexer (MUX) Routing</h3>
            <p className="text-xs text-slate-400">Two select lines (S1, S0) switch which physical input stream reaches the output bus</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(ch => (
              <button
                key={ch}
                onClick={() => setMuxSelect(ch)}
                className={`p-4 rounded-xl border text-center transition-all ${
                  muxSelect === ch
                    ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-md'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <span className="text-xs font-bold">Channel CH_{ch}</span>
                <div className="text-[10px] font-mono mt-1 text-slate-400">
                  Select: {(ch >> 1) & 1}{(ch & 1)}₂
                </div>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Active Output Bus Line:</span>
            <span className="text-sm font-mono font-bold text-emerald-400">
              Forwarding CH_{muxSelect} (Select = S1:{Math.floor(muxSelect/2)}, S0:{muxSelect%2})
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
