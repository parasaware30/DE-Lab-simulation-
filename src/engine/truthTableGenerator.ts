import { Circuit, TruthTableData, TruthTableRow, LogicValue } from './types';
import { simulateCircuit, cloneCircuit } from './simulator';

export const MAX_TRUTH_TABLE_INPUTS = 10; // 2^10 = 1024 rows maximum for responsive browser performance

export function generateCircuitTruthTable(circuit: Circuit): {
  success: boolean;
  data?: TruthTableData;
  error?: string;
} {
  // Find all primary input nodes (SWITCH or explicit INPUT)
  const inputNodes = circuit.nodes.filter(n => n.type === 'SWITCH');
  // Find all primary output nodes (LED or PROBE)
  const outputNodes = circuit.nodes.filter(n => n.type === 'LED' || n.type === 'PROBE');

  if (inputNodes.length === 0) {
    return {
      success: false,
      error: 'No input switches found in the circuit. Add at least one Switch to generate a truth table.',
    };
  }

  if (outputNodes.length === 0) {
    return {
      success: false,
      error: 'No output indicators (LED/Probe) found in the circuit. Add at least one LED/Probe to generate a truth table.',
    };
  }

  if (inputNodes.length > MAX_TRUTH_TABLE_INPUTS) {
    return {
      success: false,
      error: `Circuit contains ${inputNodes.length} inputs. Automatic truth table is capped at ${MAX_TRUTH_TABLE_INPUTS} inputs (1024 combinations) to prevent browser freezing.`,
    };
  }

  const inputNames = inputNodes.map((n, idx) => n.label || `In_${idx + 1}`);
  const outputNames = outputNodes.map((n, idx) => n.label || `Out_${idx + 1}`);

  const totalCombinations = 1 << inputNodes.length; // 2^n
  const rows: TruthTableRow[] = [];

  for (let i = 0; i < totalCombinations; i++) {
    // Clone circuit for isolated run
    const testCircuit = cloneCircuit(circuit);
    const inputsRow: Record<string, 0 | 1> = {};

    // Configure inputs for this combination
    inputNodes.forEach((node, idx) => {
      // Bit value at index (from MSB to LSB or LSB to MSB; standard truth tables count 000, 001, 010...)
      const bit = (i >> (inputNodes.length - 1 - idx)) & 1;
      const testNode = testCircuit.nodes.find(n => n.id === node.id);
      if (testNode) {
        if (!testNode.state) testNode.state = {};
        testNode.state.highValue = bit === 1;
      }
      inputsRow[inputNames[idx]] = bit as 0 | 1;
    });

    // Run simulation
    const result = simulateCircuit(testCircuit);

    const outputsRow: Record<string, LogicValue> = {};
    outputNodes.forEach((node, idx) => {
      const resNode = result.nodes.find(n => n.id === node.id);
      // The LED input port 0 holds the evaluated signal
      const val = resNode?.inputs[0]?.value ?? 'Z';
      outputsRow[outputNames[idx]] = val;
    });

    rows.push({
      inputs: inputsRow,
      outputs: outputsRow,
    });
  }

  return {
    success: true,
    data: {
      inputNames,
      outputNames,
      rows,
    },
  };
}

/**
 * Converts TruthTableData to downloadable CSV string
 */
export function truthTableToCSV(data: TruthTableData): string {
  const headers = [...data.inputNames, ...data.outputNames].join(',');
  const lines = data.rows.map(row => {
    const inVals = data.inputNames.map(name => row.inputs[name] ?? 0);
    const outVals = data.outputNames.map(name => row.outputs[name] ?? 'X');
    return [...inVals, ...outVals].join(',');
  });

  return [headers, ...lines].join('\n');
}
