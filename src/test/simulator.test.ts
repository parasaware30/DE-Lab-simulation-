import { describe, it, expect } from 'vitest';
import { simulateCircuit, validateCircuit } from '../engine/simulator';
import { SAMPLE_CIRCUITS } from '../engine/sampleCircuits';
import { generateCircuitTruthTable, truthTableToCSV } from '../engine/truthTableGenerator';

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
});
