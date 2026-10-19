export interface CombinationalCircuitSpec {
  id: string;
  name: string;
  category: string;
  description: string;
  formula: string;
  inputs: { id: string; label: string; default: 0 | 1 }[];
  outputs: { id: string; label: string }[];
  evaluate: (inputs: Record<string, 0 | 1>) => Record<string, 0 | 1>;
  truthTable: { inputs: Record<string, 0 | 1>; outputs: Record<string, 0 | 1> }[];
  schematicExplanation: string;
  applications: string[];
}

export const COMBINATIONAL_CIRCUITS: Record<string, CombinationalCircuitSpec> = {
  halfAdder: {
    id: 'halfAdder',
    name: 'Half Adder',
    category: 'Adders',
    description: 'Adds two single-bit binary numbers A and B to produce Sum and Carry.',
    formula: 'Sum = A ⊕ B, Carry = A · B',
    inputs: [
      { id: 'a', label: 'A', default: 0 },
      { id: 'b', label: 'B', default: 0 },
    ],
    outputs: [
      { id: 'sum', label: 'Sum (S)' },
      { id: 'carry', label: 'Carry (C)' },
    ],
    evaluate: ({ a = 0, b = 0 }) => ({
      sum: (a ^ b) as 0 | 1,
      carry: (a & b) as 0 | 1,
    }),
    truthTable: [
      { inputs: { a: 0, b: 0 }, outputs: { sum: 0, carry: 0 } },
      { inputs: { a: 0, b: 1 }, outputs: { sum: 1, carry: 0 } },
      { inputs: { a: 1, b: 0 }, outputs: { sum: 1, carry: 0 } },
      { inputs: { a: 1, b: 1 }, outputs: { sum: 0, carry: 1 } },
    ],
    schematicExplanation: 'Composed of 1 XOR gate for the Sum and 1 AND gate for the Carry output.',
    applications: ['ALU arithmetic', 'Address calculation', 'Building block for multi-bit ripple-carry adders'],
  },

  fullAdder: {
    id: 'fullAdder',
    name: 'Full Adder',
    category: 'Adders',
    description: 'Adds two binary bits A and B along with an incoming carry bit (Cin).',
    formula: 'Sum = A ⊕ B ⊕ Cin, Cout = (A · B) + (Cin · (A ⊕ B))',
    inputs: [
      { id: 'a', label: 'A', default: 0 },
      { id: 'b', label: 'B', default: 0 },
      { id: 'cin', label: 'Cin', default: 0 },
    ],
    outputs: [
      { id: 'sum', label: 'Sum (S)' },
      { id: 'cout', label: 'Cout (C)' },
    ],
    evaluate: ({ a = 0, b = 0, cin = 0 }) => {
      const xor1 = a ^ b;
      return {
        sum: (xor1 ^ cin) as 0 | 1,
        cout: ((a & b) | (cin & xor1)) as 0 | 1,
      };
    },
    truthTable: [
      { inputs: { a: 0, b: 0, cin: 0 }, outputs: { sum: 0, cout: 0 } },
      { inputs: { a: 0, b: 0, cin: 1 }, outputs: { sum: 1, cout: 0 } },
      { inputs: { a: 0, b: 1, cin: 0 }, outputs: { sum: 1, cout: 0 } },
      { inputs: { a: 0, b: 1, cin: 1 }, outputs: { sum: 0, cout: 1 } },
      { inputs: { a: 1, b: 0, cin: 0 }, outputs: { sum: 1, cout: 0 } },
      { inputs: { a: 1, b: 0, cin: 1 }, outputs: { sum: 0, cout: 1 } },
      { inputs: { a: 1, b: 1, cin: 0 }, outputs: { sum: 0, cout: 1 } },
      { inputs: { a: 1, b: 1, cin: 1 }, outputs: { sum: 1, cout: 1 } },
    ],
    schematicExplanation: 'Constructed from two Half Adders and an OR gate to combine the intermediate carries.',
    applications: ['Multi-bit parallel adders', 'Arithmetic Logic Units (ALUs)', 'Digital signal processors (DSP)'],
  },

  halfSubtractor: {
    id: 'halfSubtractor',
    name: 'Half Subtractor',
    category: 'Subtractors',
    description: 'Subtracts binary bit B from bit A (A - B) to produce Difference and Borrow.',
    formula: 'Difference = A ⊕ B, Borrow = A\' · B',
    inputs: [
      { id: 'a', label: 'A', default: 0 },
      { id: 'b', label: 'B', default: 0 },
    ],
    outputs: [
      { id: 'diff', label: 'Difference (D)' },
      { id: 'borrow', label: 'Borrow (B)' },
    ],
    evaluate: ({ a = 0, b = 0 }) => ({
      diff: (a ^ b) as 0 | 1,
      borrow: ((1 - a) & b) as 0 | 1,
    }),
    truthTable: [
      { inputs: { a: 0, b: 0 }, outputs: { diff: 0, borrow: 0 } },
      { inputs: { a: 0, b: 1 }, outputs: { diff: 1, borrow: 1 } },
      { inputs: { a: 1, b: 0 }, outputs: { diff: 1, borrow: 0 } },
      { inputs: { a: 1, b: 1 }, outputs: { diff: 0, borrow: 0 } },
    ],
    schematicExplanation: 'Utilizes 1 XOR gate for the Difference output and 1 NOT gate + 1 AND gate for Borrow.',
    applications: ['Basic binary subtraction', 'Down-counter decrement stages'],
  },

  fullSubtractor: {
    id: 'fullSubtractor',
    name: 'Full Subtractor',
    category: 'Subtractors',
    description: 'Subtracts bits B and Bin from A (A - B - Bin) producing Difference and Bout.',
    formula: 'Diff = A ⊕ B ⊕ Bin, Bout = A\'B + Bin(A ⊕ B)\'',
    inputs: [
      { id: 'a', label: 'A', default: 0 },
      { id: 'b', label: 'B', default: 0 },
      { id: 'bin', label: 'Bin', default: 0 },
    ],
    outputs: [
      { id: 'diff', label: 'Difference (D)' },
      { id: 'bout', label: 'Bout (B)' },
    ],
    evaluate: ({ a = 0, b = 0, bin = 0 }) => {
      const xorAB = a ^ b;
      return {
        diff: (xorAB ^ bin) as 0 | 1,
        bout: (((1 - a) & b) | (bin & (1 - xorAB))) as 0 | 1,
      };
    },
    truthTable: [
      { inputs: { a: 0, b: 0, bin: 0 }, outputs: { diff: 0, bout: 0 } },
      { inputs: { a: 0, b: 0, bin: 1 }, outputs: { diff: 1, bout: 1 } },
      { inputs: { a: 0, b: 1, bin: 0 }, outputs: { diff: 1, bout: 1 } },
      { inputs: { a: 0, b: 1, bin: 1 }, outputs: { diff: 0, bout: 1 } },
      { inputs: { a: 1, b: 0, bin: 0 }, outputs: { diff: 1, bout: 0 } },
      { inputs: { a: 1, b: 0, bin: 1 }, outputs: { diff: 0, bout: 0 } },
      { inputs: { a: 1, b: 1, bin: 0 }, outputs: { diff: 0, bout: 0 } },
      { inputs: { a: 1, b: 1, bin: 1 }, outputs: { diff: 1, bout: 1 } },
    ],
    schematicExplanation: 'Constructed from two Half Subtractors combined with an OR gate for borrow propagation.',
    applications: ['Multi-bit binary subtractors', 'ALU subtraction operations'],
  },

  mux4to1: {
    id: 'mux4to1',
    name: '4:1 Multiplexer (Data Selector)',
    category: 'Data Routing',
    description: 'Selects one of four data inputs (I0, I1, I2, I3) and forwards it to a single output line based on 2 select lines (S1, S0).',
    formula: 'Y = S1\'S0\'I0 + S1\'S0I1 + S1S0\'I2 + S1S0I3',
    inputs: [
      { id: 'i0', label: 'I0', default: 0 },
      { id: 'i1', label: 'I1', default: 1 },
      { id: 'i2', label: 'I2', default: 0 },
      { id: 'i3', label: 'I3', default: 1 },
      { id: 's1', label: 'S1 (Select MSB)', default: 0 },
      { id: 's0', label: 'S0 (Select LSB)', default: 0 },
    ],
    outputs: [{ id: 'y', label: 'Output (Y)' }],
    evaluate: ({ i0 = 0, i1 = 0, i2 = 0, i3 = 0, s1 = 0, s0 = 0 }) => {
      const sel = (s1 << 1) | s0;
      const val = [i0, i1, i2, i3][sel] ?? 0;
      return { y: val as 0 | 1 };
    },
    truthTable: [
      { inputs: { s1: 0, s0: 0, i0: 0, i1: 0, i2: 0, i3: 0 }, outputs: { y: 0 } },
      { inputs: { s1: 0, s0: 1, i0: 0, i1: 1, i2: 0, i3: 0 }, outputs: { y: 1 } },
      { inputs: { s1: 1, s0: 0, i0: 0, i1: 0, i2: 1, i3: 0 }, outputs: { y: 1 } },
      { inputs: { s1: 1, s0: 1, i0: 0, i1: 0, i2: 0, i3: 1 }, outputs: { y: 1 } },
    ],
    schematicExplanation: 'Composed of 4 AND gates gated by decoded select lines, feeding a 4-input OR gate.',
    applications: ['Data routing & bus sharing', 'Parallel to serial data conversion', 'Logic function realization'],
  },

  demux1to4: {
    id: 'demux1to4',
    name: '1:4 Demultiplexer',
    category: 'Data Routing',
    description: 'Takes a single input line D and routes it to one of four output channels (Y0..Y3) chosen by select lines S1, S0.',
    formula: 'Y0 = S1\'S0\'D, Y1 = S1\'S0D, Y2 = S1S0\'D, Y3 = S1S0D',
    inputs: [
      { id: 'd', label: 'Data Input (D)', default: 1 },
      { id: 's1', label: 'S1 (Select MSB)', default: 0 },
      { id: 's0', label: 'S0 (Select LSB)', default: 0 },
    ],
    outputs: [
      { id: 'y0', label: 'Y0' },
      { id: 'y1', label: 'Y1' },
      { id: 'y2', label: 'Y2' },
      { id: 'y3', label: 'Y3' },
    ],
    evaluate: ({ d = 0, s1 = 0, s0 = 0 }) => {
      const sel = (s1 << 1) | s0;
      return {
        y0: sel === 0 ? d : 0,
        y1: sel === 1 ? d : 0,
        y2: sel === 2 ? d : 0,
        y3: sel === 3 ? d : 0,
      };
    },
    truthTable: [
      { inputs: { d: 1, s1: 0, s0: 0 }, outputs: { y0: 1, y1: 0, y2: 0, y3: 0 } },
      { inputs: { d: 1, s1: 0, s0: 1 }, outputs: { y0: 0, y1: 1, y2: 0, y3: 0 } },
      { inputs: { d: 1, s1: 1, s0: 0 }, outputs: { y0: 0, y1: 0, y2: 1, y3: 0 } },
      { inputs: { d: 1, s1: 1, s0: 1 }, outputs: { y0: 0, y1: 0, y2: 0, y3: 1 } },
    ],
    schematicExplanation: 'Utilizes 4 3-input AND gates enabled by inverter logic from select lines S1 and S0.',
    applications: ['Serial to parallel conversion', 'Address decoding for memory banks'],
  },

  encoder4to2: {
    id: 'encoder4to2',
    name: '4-to-2 Priority Encoder',
    category: 'Encoding/Decoding',
    description: 'Encodes 4 input lines into a 2-bit binary code. Gives highest priority to D3 down to D0.',
    formula: 'Y1 = D3 + D2, Y0 = D3 + D2\'·D1, V = D0 + D1 + D2 + D3',
    inputs: [
      { id: 'd0', label: 'D0 (Lowest Priority)', default: 0 },
      { id: 'd1', label: 'D1', default: 0 },
      { id: 'd2', label: 'D2', default: 0 },
      { id: 'd3', label: 'D3 (Highest Priority)', default: 0 },
    ],
    outputs: [
      { id: 'y1', label: 'Y1 (MSB)' },
      { id: 'y0', label: 'Y0 (LSB)' },
      { id: 'v', label: 'Valid (V)' },
    ],
    evaluate: ({ d0 = 0, d1 = 0, d2 = 0, d3 = 0 }) => {
      const v = (d0 | d1 | d2 | d3) as 0 | 1;
      if (d3 === 1) return { y1: 1, y0: 1, v };
      if (d2 === 1) return { y1: 1, y0: 0, v };
      if (d1 === 1) return { y1: 0, y0: 1, v };
      if (d0 === 1) return { y1: 0, y0: 0, v };
      return { y1: 0, y0: 0, v: 0 };
    },
    truthTable: [
      { inputs: { d3: 0, d2: 0, d1: 0, d0: 1 }, outputs: { y1: 0, y0: 0, v: 1 } },
      { inputs: { d3: 0, d2: 0, d1: 1, d0: 0 }, outputs: { y1: 0, y0: 1, v: 1 } },
      { inputs: { d3: 0, d2: 1, d1: 0, d0: 0 }, outputs: { y1: 1, y0: 0, v: 1 } },
      { inputs: { d3: 1, d2: 0, d1: 0, d0: 0 }, outputs: { y1: 1, y0: 1, v: 1 } },
    ],
    schematicExplanation: 'Implements priority resolution logic to prevent ambiguous states when multiple inputs are simultaneously active.',
    applications: ['Interrupt controllers in microprocessors', 'Keyboard matrix scanning'],
  },

  decoder2to4: {
    id: 'decoder2to4',
    name: '2-to-4 Binary Decoder',
    category: 'Encoding/Decoding',
    description: 'Decodes a 2-bit binary number (A1, A0) to activate exactly one of four output lines when Enable (EN) is HIGH.',
    formula: 'Y0 = EN · A1\' · A0\', Y1 = EN · A1\' · A0, Y2 = EN · A1 · A0\', Y3 = EN · A1 · A0',
    inputs: [
      { id: 'en', label: 'Enable (EN)', default: 1 },
      { id: 'a1', label: 'A1 (MSB)', default: 0 },
      { id: 'a0', label: 'A0 (LSB)', default: 0 },
    ],
    outputs: [
      { id: 'y0', label: 'Y0' },
      { id: 'y1', label: 'Y1' },
      { id: 'y2', label: 'Y2' },
      { id: 'y3', label: 'Y3' },
    ],
    evaluate: ({ en = 1, a1 = 0, a0 = 0 }) => {
      if (en === 0) return { y0: 0, y1: 0, y2: 0, y3: 0 };
      const sel = (a1 << 1) | a0;
      return {
        y0: sel === 0 ? 1 : 0,
        y1: sel === 1 ? 1 : 0,
        y2: sel === 2 ? 1 : 0,
        y3: sel === 3 ? 1 : 0,
      };
    },
    truthTable: [
      { inputs: { en: 1, a1: 0, a0: 0 }, outputs: { y0: 1, y1: 0, y2: 0, y3: 0 } },
      { inputs: { en: 1, a1: 0, a0: 1 }, outputs: { y0: 0, y1: 1, y2: 0, y3: 0 } },
      { inputs: { en: 1, a1: 1, a0: 0 }, outputs: { y0: 0, y1: 0, y2: 1, y3: 0 } },
      { inputs: { en: 1, a1: 1, a0: 1 }, outputs: { y0: 0, y1: 0, y2: 0, y3: 1 } },
    ],
    schematicExplanation: 'Contains 4 AND gates and 2 inverters. The Enable pin allows multiple decoders to be cascaded.',
    applications: ['Memory address decoding', '7-segment display drivers', 'Instruction decoding in CPUs'],
  },

  comparator2bit: {
    id: 'comparator2bit',
    name: '2-Bit Magnitude Comparator',
    category: 'Arithmetic',
    description: 'Compares two 2-bit unsigned binary numbers A (A1,A0) and B (B1,B0) to determine if A > B, A = B, or A < B.',
    formula: 'A=B: (A1 ⊙ B1) · (A0 ⊙ B0), A>B: A1B1\' + (A1 ⊙ B1)A0B0\', A<B: A1\'B1 + (A1 ⊙ B1)A0\'B0',
    inputs: [
      { id: 'a1', label: 'A1', default: 1 },
      { id: 'a0', label: 'A0', default: 0 },
      { id: 'b1', label: 'B1', default: 0 },
      { id: 'b0', label: 'B0', default: 1 },
    ],
    outputs: [
      { id: 'gt', label: 'A > B' },
      { id: 'eq', label: 'A = B' },
      { id: 'lt', label: 'A < B' },
    ],
    evaluate: ({ a1 = 0, a0 = 0, b1 = 0, b0 = 0 }) => {
      const valA = (a1 << 1) | a0;
      const valB = (b1 << 1) | b0;
      return {
        gt: valA > valB ? 1 : 0,
        eq: valA === valB ? 1 : 0,
        lt: valA < valB ? 1 : 0,
      };
    },
    truthTable: [
      { inputs: { a1: 0, a0: 0, b1: 0, b0: 0 }, outputs: { gt: 0, eq: 1, lt: 0 } },
      { inputs: { a1: 0, a0: 1, b1: 0, b0: 0 }, outputs: { gt: 1, eq: 0, lt: 0 } },
      { inputs: { a1: 0, a0: 0, b1: 0, b0: 1 }, outputs: { gt: 0, eq: 0, lt: 1 } },
      { inputs: { a1: 1, a0: 1, b1: 1, b0: 0 }, outputs: { gt: 1, eq: 0, lt: 0 } },
    ],
    schematicExplanation: 'Uses XNOR gates for bit equivalence checking combined with cascaded priority AND-OR chains for greater-than and less-than.',
    applications: ['Branch conditions in microprocessors', 'Sorting hardware', 'Digital servo positioning'],
  },
};
