import { describe, it, expect } from 'vitest';
import { evalGate, evalNot, evalAnd, evalOr, evalXor, GATE_DEFINITIONS } from '../engine/logicGates';

describe('Logic Gates Engine', () => {
  it('correctly evaluates NOT gate', () => {
    expect(evalNot(0)).toBe(1);
    expect(evalNot(1)).toBe(0);
    expect(evalNot('X')).toBe('X');
    expect(evalNot('Z')).toBe('X');
  });

  it('correctly evaluates AND gate truth table', () => {
    expect(evalAnd([0, 0])).toBe(0);
    expect(evalAnd([0, 1])).toBe(0);
    expect(evalAnd([1, 0])).toBe(0);
    expect(evalAnd([1, 1])).toBe(1);
    // Dominant 0 test with unknown
    expect(evalAnd([0, 'X'])).toBe(0);
    expect(evalAnd([1, 'X'])).toBe('X');
  });

  it('correctly evaluates OR gate truth table', () => {
    expect(evalOr([0, 0])).toBe(0);
    expect(evalOr([0, 1])).toBe(1);
    expect(evalOr([1, 0])).toBe(1);
    expect(evalOr([1, 1])).toBe(1);
    // Dominant 1 test with unknown
    expect(evalOr([1, 'X'])).toBe(1);
    expect(evalOr([0, 'X'])).toBe('X');
  });

  it('correctly evaluates XOR and XNOR gates', () => {
    expect(evalXor([0, 0])).toBe(0);
    expect(evalXor([0, 1])).toBe(1);
    expect(evalXor([1, 0])).toBe(1);
    expect(evalXor([1, 1])).toBe(0);
    expect(evalGate('XNOR', [0, 0])).toBe(1);
    expect(evalGate('XNOR', [0, 1])).toBe(0);
    expect(evalGate('XNOR', [1, 0])).toBe(0);
    expect(evalGate('XNOR', [1, 1])).toBe(1);
  });

  it('correctly evaluates NAND and NOR universal gates', () => {
    expect(evalGate('NAND', [0, 0])).toBe(1);
    expect(evalGate('NAND', [1, 1])).toBe(0);
    expect(evalGate('NOR', [0, 0])).toBe(1);
    expect(evalGate('NOR', [0, 1])).toBe(0);
    expect(evalGate('NOR', [1, 1])).toBe(0);
  });

  it('contains valid metadata for all 7 standard gates', () => {
    const requiredGates = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'];
    for (const g of requiredGates) {
      expect(GATE_DEFINITIONS[g]).toBeDefined();
      expect(GATE_DEFINITIONS[g].icNumber).toBeTruthy();
      expect(GATE_DEFINITIONS[g].expression).toBeTruthy();
    }
  });
});
