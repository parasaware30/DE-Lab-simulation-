import { describe, it, expect } from 'vitest';
import { simulateCircuit, validateCircuit } from '../engine/simulator';
import { SAMPLE_CIRCUITS } from '../engine/sampleCircuits';
import { generateCircuitTruthTable, truthTableToCSV } from '../engine/truthTableGenerator';
import { Circuit, LogicValue } from '../engine/types';

describe('Circuit Simulator & Validator', () => {
  it('validates and simulates Half Adder sample circuit correctly', () => {
    const halfAdder = SAMPLE_CIRCUITS.find(c => c.id === 'sample_half_adder');
    expect(halfAdder).toBeDefined();
    if (!halfAdder) return;

    const validation = validateCircuit(halfAdder);
    expect(validation.isValid).toBe(true);

    const result = simulateCircuit(halfAdder);
    expect(result.isValid).toBe(true);

    // Initial state: A=1, B=0 -> Sum=1, Carry=0
    const sumLed = result.nodes.find(n => n.id === 'led_sum');
    const carryLed = result.nodes.find(n => n.id === 'led_carry');

    expect(sumLed?.inputs[0].value).toBe(1);
    expect(carryLed?.inputs[0].value).toBe(0);
  });

  it('generates accurate 2^n truth table for Half Adder circuit', () => {
    const halfAdder = SAMPLE_CIRCUITS.find(c => c.id === 'sample_half_adder');
    expect(halfAdder).toBeDefined();
    if (!halfAdder) return;

    const ttRes = generateCircuitTruthTable(halfAdder);
    expect(ttRes.success).toBe(true);
    expect(ttRes.data?.rows.length).toBe(4); // 2^2 = 4 combinations

    const csv = truthTableToCSV(ttRes.data!);
    expect(csv).toContain('A,B,Sum (S),Carry (C)');
    expect(csv).toContain('0,0,0,0');
    expect(csv).toContain('0,1,1,0');
    expect(csv).toContain('1,0,1,0');
    expect(csv).toContain('1,1,0,1');
  });

  it('detects floating inputs and missing destination nodes', () => {
    const brokenCircuit = {
      id: 'broken',
      name: 'Broken',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'and1',
          type: 'AND' as const,
          label: 'AND',
          x: 0,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'A', type: 'input' as const, value: 0 as const },
            { id: 'in_1', name: 'B', type: 'input' as const, value: 0 as const },
          ],
          outputs: [{ id: 'out_0', name: 'Y', type: 'output' as const, value: 0 as const }],
        },
      ],
      wires: [
        {
          id: 'w_broken',
          fromNodeId: 'non_existent_node',
          fromPortIndex: 0,
          toNodeId: 'and1',
          toPortIndex: 0,
          value: 0 as const,
        },
      ],
    };

    const validation = validateCircuit(brokenCircuit);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some(e => e.includes('non-existent source node'))).toBe(true);
    expect(validation.warnings.some(w => w.includes('Floating input'))).toBe(true);
  });

  it('correctly simulates FULL_ADDER with Carry-In and Carry-Out', () => {
    const circuit = {
      id: 'fa_test',
      name: 'Full Adder Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'vcc',
          type: 'CONST_HIGH' as const,
          label: 'VCC',
          x: 0,
          y: 0,
          inputs: [],
          outputs: [{ id: 'out_0', name: '1', type: 'output' as const, value: 1 as const }],
        },
        {
          id: 'gnd',
          type: 'CONST_LOW' as const,
          label: 'GND',
          x: 0,
          y: 100,
          inputs: [],
          outputs: [{ id: 'out_0', name: '0', type: 'output' as const, value: 0 as const }],
        },
        {
          id: 'fa',
          type: 'FULL_ADDER' as const,
          label: 'FA',
          x: 200,
          y: 50,
          inputs: [
            { id: 'in_0', name: 'A', type: 'input' as const, value: 0 as const },
            { id: 'in_1', name: 'B', type: 'input' as const, value: 0 as const },
            { id: 'in_2', name: 'Cin', type: 'input' as const, value: 0 as const },
          ],
          outputs: [
            { id: 'out_0', name: 'Sum', type: 'output' as const, value: 0 as const },
            { id: 'out_1', name: 'Cout', type: 'output' as const, value: 0 as const },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'fa', toPortIndex: 0, value: 1 as const }, // A=1
        { id: 'w2', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'fa', toPortIndex: 1, value: 1 as const }, // B=1
        { id: 'w3', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'fa', toPortIndex: 2, value: 1 as const }, // Cin=1
      ],
    };

    const res = simulateCircuit(circuit);
    const faNode = res.nodes.find(n => n.id === 'fa');
    expect(faNode?.outputs[0].value).toBe(1); // Sum: 1 + 1 + 1 = 3 (Sum=1)
    expect(faNode?.outputs[1].value).toBe(1); // Cout: (Cout=1)
  });

  it('correctly routes selected input in MUX_4TO1', () => {
    const circuit = {
      id: 'mux_test',
      name: 'MUX Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'vcc',
          type: 'CONST_HIGH' as const,
          label: 'VCC',
          x: 0,
          y: 0,
          inputs: [],
          outputs: [{ id: 'out_0', name: '1', type: 'output' as const, value: 1 as const }],
        },
        {
          id: 'mux',
          type: 'MUX_4TO1' as const,
          label: 'MUX',
          x: 200,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'D0', type: 'input' as const, value: 0 as const },
            { id: 'in_1', name: 'D1', type: 'input' as const, value: 0 as const },
            { id: 'in_2', name: 'D2', type: 'input' as const, value: 0 as const },
            { id: 'in_3', name: 'D3', type: 'input' as const, value: 0 as const },
            { id: 'in_4', name: 'S0', type: 'input' as const, value: 0 as const },
            { id: 'in_5', name: 'S1', type: 'input' as const, value: 0 as const },
          ],
          outputs: [{ id: 'out_0', name: 'Y', type: 'output' as const, value: 0 as const }],
        },
      ],
      wires: [
        { id: 'w1', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'mux', toPortIndex: 2, value: 1 as const }, // D2 = 1
        { id: 'w2', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'mux', toPortIndex: 5, value: 1 as const }, // S1 = 1 (Select = 2, binary 10)
      ],
    };

    const res = simulateCircuit(circuit);
    const muxNode = res.nodes.find(n => n.id === 'mux');
    expect(muxNode?.outputs[0].value).toBe(1); // Y should output D2 which is 1
  });

  it('increments 4-bit counter on rising clock edge', () => {
    let circuit: Circuit = {
      id: 'counter_test',
      name: 'Counter Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'cnt',
          type: 'COUNTER_4BIT',
          label: 'Counter',
          x: 0,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'CLK', type: 'input', value: 0 },
            { id: 'in_1', name: 'RST', type: 'input', value: 0 },
          ],
          outputs: [
            { id: 'out_0', name: 'Q0', type: 'output', value: 0 },
            { id: 'out_1', name: 'Q1', type: 'output', value: 0 },
            { id: 'out_2', name: 'Q2', type: 'output', value: 0 },
            { id: 'out_3', name: 'Q3', type: 'output', value: 0 },
          ],
          state: { counterValue: 0, prevClock: 0 },
        },
      ],
      wires: [],
    };

    // Low CLK
    let res = simulateCircuit(circuit);
    expect(res.nodes[0].state?.counterValue).toBe(0);

    // Rising edge: CLK becomes 1
    circuit = {
      ...circuit,
      nodes: [
        {
          ...circuit.nodes[0],
          state: res.nodes[0].state,
          inputs: [
            { ...circuit.nodes[0].inputs[0], value: 1 },
            circuit.nodes[0].inputs[1],
          ],
        },
      ],
    };

    res = simulateCircuit(circuit);
    expect(res.nodes[0].state?.counterValue).toBe(1);
    expect(res.nodes[0].outputs[0].value).toBe(1); // Q0 = 1
    expect(res.nodes[0].outputs[1].value).toBe(0); // Q1 = 0
  });

  it('correctly decodes BCD to 7-segment display', () => {
    // Number 3 = BCD 0011 (A=0, B=0, C=1, D=1)
    const circuit = {
      id: 'bcd_test',
      name: 'BCD Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'vcc',
          type: 'CONST_HIGH' as const,
          label: 'VCC',
          x: 0,
          y: 0,
          inputs: [],
          outputs: [{ id: 'out_0', name: '1', type: 'output' as const, value: 1 as const }],
        },
        {
          id: 'bcd',
          type: 'BCD_TO_7SEG' as const,
          label: 'BCD',
          x: 100,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'A', type: 'input' as const, value: 0 as const },
            { id: 'in_1', name: 'B', type: 'input' as const, value: 0 as const },
            { id: 'in_2', name: 'C', type: 'input' as const, value: 0 as const },
            { id: 'in_3', name: 'D', type: 'input' as const, value: 0 as const },
          ],
          outputs: [
            { id: 'out_0', name: 'a', type: 'output' as const, value: 0 as const },
            { id: 'out_1', name: 'b', type: 'output' as const, value: 0 as const },
            { id: 'out_2', name: 'c', type: 'output' as const, value: 0 as const },
            { id: 'out_3', name: 'd', type: 'output' as const, value: 0 as const },
            { id: 'out_4', name: 'e', type: 'output' as const, value: 0 as const },
            { id: 'out_5', name: 'f', type: 'output' as const, value: 0 as const },
            { id: 'out_6', name: 'g', type: 'output' as const, value: 0 as const },
          ],
        },
      ],
      wires: [
        { id: 'w1', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'bcd', toPortIndex: 0, value: 1 as const }, // A = 1 (1)
        { id: 'w2', fromNodeId: 'vcc', fromPortIndex: 0, toNodeId: 'bcd', toPortIndex: 1, value: 1 as const }, // B = 1 (2) -> 1+2=3
      ],
    };

    const res = simulateCircuit(circuit);
    const bcdNode = res.nodes.find(n => n.id === 'bcd');
    // For digit 3: a=1, b=1, c=1, d=1, e=0, f=0, g=1
    expect(bcdNode?.outputs[0].value).toBe(1); // a
    expect(bcdNode?.outputs[1].value).toBe(1); // b
    expect(bcdNode?.outputs[2].value).toBe(1); // c
    expect(bcdNode?.outputs[3].value).toBe(1); // d
    expect(bcdNode?.outputs[4].value).toBe(0); // e
    expect(bcdNode?.outputs[5].value).toBe(0); // f
    expect(bcdNode?.outputs[6].value).toBe(1); // g
  });

  it('accurately executes 4-Bit ALU arithmetic and logic operations', () => {
    // Op 0: ADD (A + B + Cin) -> 5 + 3 + 0 = 8 (F = 1000b, Cout = 0, Zero = 0)
    const aluCircuit: Circuit = {
      id: 'alu_test',
      name: 'ALU Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'alu1',
          type: 'ALU_4BIT',
          label: 'ALU',
          x: 0,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'A0', type: 'input', value: 1 }, // A = 5 (0101b)
            { id: 'in_1', name: 'A1', type: 'input', value: 0 },
            { id: 'in_2', name: 'A2', type: 'input', value: 1 },
            { id: 'in_3', name: 'A3', type: 'input', value: 0 },
            { id: 'in_4', name: 'B0', type: 'input', value: 1 }, // B = 3 (0011b)
            { id: 'in_5', name: 'B1', type: 'input', value: 1 },
            { id: 'in_6', name: 'B2', type: 'input', value: 0 },
            { id: 'in_7', name: 'B3', type: 'input', value: 0 },
            { id: 'in_8', name: 'S0', type: 'input', value: 0 }, // S = 0 -> ADD
            { id: 'in_9', name: 'S1', type: 'input', value: 0 },
            { id: 'in_10', name: 'Cin', type: 'input', value: 0 },
          ],
          outputs: [
            { id: 'out_0', name: 'F0', type: 'output', value: 0 },
            { id: 'out_1', name: 'F1', type: 'output', value: 0 },
            { id: 'out_2', name: 'F2', type: 'output', value: 0 },
            { id: 'out_3', name: 'F3', type: 'output', value: 0 },
            { id: 'out_4', name: 'Cout', type: 'output', value: 0 },
            { id: 'out_5', name: 'Zero', type: 'output', value: 0 },
          ],
        },
      ],
      wires: [],
    };

    const res = simulateCircuit(aluCircuit);
    const aluNode = res.nodes.find(n => n.id === 'alu1');
    expect(aluNode?.outputs[0].value).toBe(0); // F0
    expect(aluNode?.outputs[1].value).toBe(0); // F1
    expect(aluNode?.outputs[2].value).toBe(0); // F2
    expect(aluNode?.outputs[3].value).toBe(1); // F3 = 8
    expect(aluNode?.outputs[4].value).toBe(0); // Cout = 0
    expect(aluNode?.outputs[5].value).toBe(0); // Zero = 0
  });

  it('correctly routes signals through 8:1 MUX and 3:8 Decoder', () => {
    // 8:1 MUX: Set select to 5 (101b). D5 = 1, others 0 -> Y = 1, W = 0
    const muxCircuit: Circuit = {
      id: 'mux8_test',
      name: 'MUX8 Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'mux8',
          type: 'MUX_8TO1',
          label: '8:1 MUX',
          x: 0,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'D0', type: 'input', value: 0 },
            { id: 'in_1', name: 'D1', type: 'input', value: 0 },
            { id: 'in_2', name: 'D2', type: 'input', value: 0 },
            { id: 'in_3', name: 'D3', type: 'input', value: 0 },
            { id: 'in_4', name: 'D4', type: 'input', value: 0 },
            { id: 'in_5', name: 'D5', type: 'input', value: 1 }, // High
            { id: 'in_6', name: 'D6', type: 'input', value: 0 },
            { id: 'in_7', name: 'D7', type: 'input', value: 0 },
            { id: 'in_8', name: 'S0', type: 'input', value: 1 }, // 1
            { id: 'in_9', name: 'S1', type: 'input', value: 0 }, // 0
            { id: 'in_10', name: 'S2', type: 'input', value: 1 }, // 4 -> Sel = 5
            { id: 'in_11', name: 'EN', type: 'input', value: 1 },
          ],
          outputs: [
            { id: 'out_0', name: 'Y', type: 'output', value: 0 },
            { id: 'out_1', name: 'W', type: 'output', value: 1 },
          ],
        },
      ],
      wires: [],
    };

    const res = simulateCircuit(muxCircuit);
    const muxNode = res.nodes.find(n => n.id === 'mux8');
    expect(muxNode?.outputs[0].value).toBe(1); // Y
    expect(muxNode?.outputs[1].value).toBe(0); // W (inverted Y)
  });

  it('correctly simulates transparent D-Latch and Decade BCD counter', () => {
    // D Latch with EN=1 captures D=1
    const latchCircuit: Circuit = {
      id: 'latch_test',
      name: 'Latch Test',
      createdAt: 0,
      updatedAt: 0,
      nodes: [
        {
          id: 'latch1',
          type: 'D_LATCH',
          label: 'D Latch',
          x: 0,
          y: 0,
          inputs: [
            { id: 'in_0', name: 'D', type: 'input', value: 1 },
            { id: 'in_1', name: 'EN', type: 'input', value: 1 },
          ],
          outputs: [
            { id: 'out_0', name: 'Q', type: 'output', value: 0 },
            { id: 'out_1', name: "Q'", type: 'output', value: 1 },
          ],
          state: { q: 0, qBar: 1 },
        },
      ],
      wires: [],
    };

    const res = simulateCircuit(latchCircuit);
    const latch = res.nodes.find(n => n.id === 'latch1');
    expect(latch?.outputs[0].value).toBe(1); // Q
    expect(latch?.outputs[1].value).toBe(0); // Q'
  });
});
