export type FlipFlopType = 'SR' | 'JK' | 'D' | 'T';

export interface FlipFlopState {
  q: 0 | 1 | 'X';
  qBar: 0 | 1 | 'X';
  isInvalid: boolean;
  message?: string;
}

export interface FlipFlopStepResult {
  nextState: FlipFlopState;
  stateDescription: string;
}

export function evaluateSR(s: 0 | 1, r: 0 | 1, currentQ: 0 | 1 | 'X'): FlipFlopStepResult {
  if (s === 0 && r === 0) {
    const q = currentQ === 'X' ? 0 : currentQ;
    return {
      nextState: { q, qBar: (q === 1 ? 0 : 1), isInvalid: false },
      stateDescription: 'No Change (Hold State): Q remains unchanged.',
    };
  }
  if (s === 0 && r === 1) {
    return {
      nextState: { q: 0, qBar: 1, isInvalid: false },
      stateDescription: 'Reset State: Output Q is forced to LOW (0).',
    };
  }
  if (s === 1 && r === 0) {
    return {
      nextState: { q: 1, qBar: 0, isInvalid: false },
      stateDescription: 'Set State: Output Q is forced to HIGH (1).',
    };
  }
  // s === 1 && r === 1
  return {
    nextState: { q: 'X', qBar: 'X', isInvalid: true, message: 'Invalid / Metasable race state! Both inputs active simultaneously.' },
    stateDescription: 'Forbidden / Invalid State: Simultaneous SET and RESET causes race condition.',
  };
}

export function evaluateJK(j: 0 | 1, k: 0 | 1, currentQ: 0 | 1 | 'X'): FlipFlopStepResult {
  const qVal = currentQ === 'X' ? 0 : currentQ;

  if (j === 0 && k === 0) {
    return {
      nextState: { q: qVal, qBar: (qVal === 1 ? 0 : 1), isInvalid: false },
      stateDescription: 'No Change (Hold State): Q preserves current bit.',
    };
  }
  if (j === 0 && k === 1) {
    return {
      nextState: { q: 0, qBar: 1, isInvalid: false },
      stateDescription: 'Reset State: Q transitions to 0.',
    };
  }
  if (j === 1 && k === 0) {
    return {
      nextState: { q: 1, qBar: 0, isInvalid: false },
      stateDescription: 'Set State: Q transitions to 1.',
    };
  }
  // j === 1 && k === 1
  const toggledQ = (qVal === 1 ? 0 : 1) as 0 | 1;
  return {
    nextState: { q: toggledQ, qBar: (toggledQ === 1 ? 0 : 1), isInvalid: false },
    stateDescription: 'Toggle State: Q complements its value on every active clock edge.',
  };
}

export function evaluateD(d: 0 | 1): FlipFlopStepResult {
  return {
    nextState: { q: d, qBar: (d === 1 ? 0 : 1), isInvalid: false },
    stateDescription: `Data transfer: Output Q captures input D = ${d}.`,
  };
}

export function evaluateT(t: 0 | 1, currentQ: 0 | 1 | 'X'): FlipFlopStepResult {
  const qVal = currentQ === 'X' ? 0 : currentQ;
  if (t === 0) {
    return {
      nextState: { q: qVal, qBar: (qVal === 1 ? 0 : 1), isInvalid: false },
      stateDescription: 'Hold State: T=0, Q maintains its current logic level.',
    };
  }
  const nextQ = (qVal === 1 ? 0 : 1) as 0 | 1;
  return {
    nextState: { q: nextQ, qBar: (nextQ === 1 ? 0 : 1), isInvalid: false },
    stateDescription: 'Toggle State: T=1, Q inverts on each clock trigger.',
  };
}

export interface SequentialWaveSample {
  cycle: number;
  clk: 0 | 1;
  q0: 0 | 1;
  q1: 0 | 1;
  q2: 0 | 1;
  q3: 0 | 1;
}

export interface RegisterState {
  bits: (0 | 1)[];
}

export function shiftRegisterStep(currentBits: (0 | 1)[], serialIn: 0 | 1): (0 | 1)[] {
  // Shifts right: bit 0 comes from serialIn, bits shift down
  return [serialIn, currentBits[0], currentBits[1], currentBits[2]];
}

export function counterStep(currentVal: number, mode: 'UP' | 'DOWN', mod: number = 16): number {
  if (mode === 'UP') {
    return (currentVal + 1) % mod;
  }
  return (currentVal - 1 + mod) % mod;
}
