import { LogicValue, GateType } from './types';

export function evalNot(input: LogicValue): LogicValue {
  if (input === 1) return 0;
  if (input === 0) return 1;
  return 'X';
}

export function evalAnd(inputs: LogicValue[]): LogicValue {
  if (inputs.length === 0) return 'X';
  let hasUndefined = false;
  for (const v of inputs) {
    if (v === 0) return 0; // Dominant 0 in AND
    if (v === 'X' || v === 'Z') hasUndefined = true;
  }
  return hasUndefined ? 'X' : 1;
}

export function evalOr(inputs: LogicValue[]): LogicValue {
  if (inputs.length === 0) return 'X';
  let hasUndefined = false;
  for (const v of inputs) {
    if (v === 1) return 1; // Dominant 1 in OR
    if (v === 'X' || v === 'Z') hasUndefined = true;
  }
  return hasUndefined ? 'X' : 0;
}

export function evalXor(inputs: LogicValue[]): LogicValue {
  if (inputs.length === 0) return 'X';
  for (const v of inputs) {
    if (v === 'X' || v === 'Z') return 'X';
  }
  // Standard multi-input XOR evaluates to parity (odd number of 1s -> 1)
  const ones = inputs.filter(v => v === 1).length;
  return ones % 2 === 1 ? 1 : 0;
}

export function evalGate(type: GateType, inputs: LogicValue[]): LogicValue {
  switch (type) {
    case 'NOT':
      return evalNot(inputs[0] ?? 'Z');
    case 'BUFFER':
      return inputs[0] === 0 ? 0 : inputs[0] === 1 ? 1 : 'X';
    case 'AND':
    case 'AND3':
    case 'AND4':
      return evalAnd(inputs);
    case 'NAND':
    case 'NAND3':
    case 'NAND4': {
      const res = evalAnd(inputs);
      return evalNot(res);
    }
    case 'OR':
    case 'OR3':
    case 'OR4':
      return evalOr(inputs);
    case 'NOR':
    case 'NOR3':
    case 'NOR4': {
      const res = evalOr(inputs);
      return evalNot(res);
    }
    case 'XOR':
    case 'XOR3':
      return evalXor(inputs);
    case 'XNOR': {
      const res = evalXor(inputs);
      return evalNot(res);
    }
    case 'TRI_STATE': {
      // inputs: [Data, Enable]
      const data = inputs[0];
      const enable = inputs[1];
      if (enable === 1) return data === 1 ? 1 : data === 0 ? 0 : 'X';
      if (enable === 0) return 'Z';
      return 'X';
    }
    default:
      return 'X';
  }
}

export interface GateInfo {
  type: GateType;
  name: string;
  fullName: string;
  expression: string;
  icNumber: string;
  description: string;
  defaultInputs: number;
  truthTable2In: { a: 0 | 1; b: 0 | 1; out: 0 | 1 }[];
}

export const GATE_DEFINITIONS: Record<string, GateInfo> = {
  AND: {
    type: 'AND',
    name: 'AND',
    fullName: 'AND Gate (Conjunction)',
    expression: 'Y = A · B',
    icNumber: '7408 (Quad 2-Input)',
    description: 'Output is HIGH (1) only if all inputs are HIGH (1).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 0 },
      { a: 1, b: 0, out: 0 },
      { a: 1, b: 1, out: 1 },
    ],
  },
  OR: {
    type: 'OR',
    name: 'OR',
    fullName: 'OR Gate (Disjunction)',
    expression: 'Y = A + B',
    icNumber: '7432 (Quad 2-Input)',
    description: 'Output is HIGH (1) if at least one input is HIGH (1).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 1 },
      { a: 1, b: 0, out: 1 },
      { a: 1, b: 1, out: 1 },
    ],
  },
  NOT: {
    type: 'NOT',
    name: 'NOT',
    fullName: 'NOT Gate (Inverter)',
    expression: 'Y = A̅  (or !A)',
    icNumber: '7404 (Hex Inverter)',
    description: 'Output is the inverse of the input. 0 becomes 1, 1 becomes 0.',
    defaultInputs: 1,
    truthTable2In: [
      { a: 0, b: 0, out: 1 },
      { a: 1, b: 0, out: 0 },
    ],
  },
  NAND: {
    type: 'NAND',
    name: 'NAND',
    fullName: 'NAND Gate (NOT-AND)',
    expression: 'Y = (A · B)̅',
    icNumber: '7400 (Quad 2-Input)',
    description: 'Universal gate. Output is LOW (0) only if all inputs are HIGH (1).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 1 },
      { a: 0, b: 1, out: 1 },
      { a: 1, b: 0, out: 1 },
      { a: 1, b: 1, out: 0 },
    ],
  },
  NOR: {
    type: 'NOR',
    name: 'NOR',
    fullName: 'NOR Gate (NOT-OR)',
    expression: 'Y = (A + B)̅',
    icNumber: '7402 (Quad 2-Input)',
    description: 'Universal gate. Output is HIGH (1) only if all inputs are LOW (0).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 1 },
      { a: 0, b: 1, out: 0 },
      { a: 1, b: 0, out: 0 },
      { a: 1, b: 1, out: 0 },
    ],
  },
  XOR: {
    type: 'XOR',
    name: 'XOR',
    fullName: 'XOR Gate (Exclusive OR)',
    expression: 'Y = A ⊕ B = A̅B + AB̅',
    icNumber: '7486 (Quad 2-Input)',
    description: 'Output is HIGH (1) if inputs are different (odd parity).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 0 },
      { a: 0, b: 1, out: 1 },
      { a: 1, b: 0, out: 1 },
      { a: 1, b: 1, out: 0 },
    ],
  },
  XNOR: {
    type: 'XNOR',
    name: 'XNOR',
    fullName: 'XNOR Gate (Equivalence)',
    expression: 'Y = (A ⊕ B)̅ = AB + A̅B̅',
    icNumber: '74266 (Quad 2-Input)',
    description: 'Output is HIGH (1) if all inputs are identical (even parity).',
    defaultInputs: 2,
    truthTable2In: [
      { a: 0, b: 0, out: 1 },
      { a: 0, b: 1, out: 0 },
      { a: 1, b: 0, out: 0 },
      { a: 1, b: 1, out: 1 },
    ],
  },
};
