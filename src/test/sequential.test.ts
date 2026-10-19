import { describe, it, expect } from 'vitest';
import { evaluateSR, evaluateJK, evaluateD, evaluateT, counterStep } from '../engine/sequential/flipflops';

describe('Sequential Circuits Flip-Flop Engine', () => {
  it('correctly manages SR flip-flop state transitions and invalid state', () => {
    // Hold from Q=0
    expect(evaluateSR(0, 0, 0).nextState.q).toBe(0);
    // Set
    expect(evaluateSR(1, 0, 0).nextState.q).toBe(1);
    // Reset
    expect(evaluateSR(0, 1, 1).nextState.q).toBe(0);
    // Invalid / forbidden (S=1, R=1)
    const invalid = evaluateSR(1, 1, 0);
    expect(invalid.nextState.isInvalid).toBe(true);
    expect(invalid.nextState.q).toBe('X');
  });

  it('correctly manages JK flip-flop including toggle operation', () => {
    // Hold
    expect(evaluateJK(0, 0, 1).nextState.q).toBe(1);
    // Reset
    expect(evaluateJK(0, 1, 1).nextState.q).toBe(0);
    // Set
    expect(evaluateJK(1, 0, 0).nextState.q).toBe(1);
    // Toggle (J=1, K=1)
    expect(evaluateJK(1, 1, 1).nextState.q).toBe(0);
    expect(evaluateJK(1, 1, 0).nextState.q).toBe(1);
  });

  it('correctly captures D flip-flop data', () => {
    expect(evaluateD(1).nextState.q).toBe(1);
    expect(evaluateD(0).nextState.q).toBe(0);
  });

  it('correctly toggles T flip-flop', () => {
    expect(evaluateT(0, 1).nextState.q).toBe(1); // hold
    expect(evaluateT(1, 1).nextState.q).toBe(0); // toggle
    expect(evaluateT(1, 0).nextState.q).toBe(1); // toggle
  });

  it('correctly steps binary counter with rollover', () => {
    expect(counterStep(0, 'UP', 16)).toBe(1);
    expect(counterStep(15, 'UP', 16)).toBe(0); // rollover
    expect(counterStep(0, 'DOWN', 16)).toBe(15); // underflow
  });
});
