import { Circuit, CircuitNode, Wire, LogicValue, SimulationResult } from './types';
import { evalGate } from './logicGates';

export const MAX_SIMULATION_STEPS = 50;

export function cloneCircuit(circuit: Circuit): Circuit {
  return {
    ...circuit,
    nodes: circuit.nodes.map(n => ({
      ...n,
      inputs: n.inputs.map(p => ({ ...p })),
      outputs: n.outputs.map(p => ({ ...p })),
      state: n.state ? { ...n.state } : undefined,
    })),
    wires: circuit.wires.map(w => ({ ...w })),
  };
}

/**
 * Validates circuit topology and connections
 */
export function validateCircuit(circuit: Circuit): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nodeMap = new Map<string, CircuitNode>();
  for (const node of circuit.nodes) {
    nodeMap.set(node.id, node);
  }

  // Check wires for valid node references and port bounds
  const inputPortConnections = new Map<string, number>();

  for (const wire of circuit.wires) {
    const fromNode = nodeMap.get(wire.fromNodeId);
    const toNode = nodeMap.get(wire.toNodeId);

    if (!fromNode) {
      errors.push(`Wire references non-existent source node: ${wire.fromNodeId}`);
      continue;
    }
    if (!toNode) {
      errors.push(`Wire references non-existent destination node: ${wire.toNodeId}`);
      continue;
    }

    if (wire.fromPortIndex < 0 || wire.fromPortIndex >= fromNode.outputs.length) {
      errors.push(`Invalid source port index ${wire.fromPortIndex} on node "${fromNode.label || fromNode.type}"`);
    }

    if (wire.toPortIndex < 0 || wire.toPortIndex >= toNode.inputs.length) {
      errors.push(`Invalid destination port index ${wire.toPortIndex} on node "${toNode.label || toNode.type}"`);
    }

    const destKey = `${wire.toNodeId}_in_${wire.toPortIndex}`;
    inputPortConnections.set(destKey, (inputPortConnections.get(destKey) || 0) + 1);
  }

  // Check for short circuits: multiple wires driving the exact same input port
  inputPortConnections.forEach((count, key) => {
    if (count > 1) {
      warnings.push(`Multiple wires connected to single input port (${key}) - potential contention`);
    }
  });

  // Check for disconnected/floating inputs on gates
  for (const node of circuit.nodes) {
    if (['SWITCH', 'CLOCK'].includes(node.type)) continue;

    for (let i = 0; i < node.inputs.length; i++) {
      const key = `${node.id}_in_${i}`;
      if (!inputPortConnections.has(key)) {
        warnings.push(`Floating input "${node.inputs[i].name || `In ${i+1}`}" on node "${node.label || node.type}"`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Evaluates a single node based on current input values and internal state
 */
function evaluateNode(node: CircuitNode, clockTicked: boolean = false): boolean {
  let changed = false;

  switch (node.type) {
    case 'SWITCH': {
      const val: LogicValue = node.state?.highValue ? 1 : 0;
      if (node.outputs[0].value !== val) {
        node.outputs[0].value = val;
        changed = true;
      }
      break;
    }

    case 'CLOCK': {
      // Clock state is managed by external pulse or simulator clock tick
      const val: LogicValue = node.state?.highValue ? 1 : 0;
      if (node.outputs[0].value !== val) {
        node.outputs[0].value = val;
        changed = true;
      }
      break;
    }

    case 'LED':
    case 'PROBE': {
      const inVal = node.inputs[0]?.value ?? 'Z';
      const outVal = inVal === 1 ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'SEVEN_SEG': {
      // 7-segment display node with 7 or 4 inputs
      // Simply reflects inputs to state
      break;
    }

    case 'SR_FF': {
      // Inputs: [S, R, CLK]
      const s = node.inputs[0]?.value ?? 0;
      const r = node.inputs[1]?.value ?? 0;
      const clk = node.inputs[2]?.value ?? 1; // Default HIGH if unclocked latch

      if (!node.state) {
        node.state = { q: 0, qBar: 1, prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = (prevClk === 0 && clk === 1) || node.inputs.length < 3;
      node.state.prevClock = clk;

      if (isRisingEdge || clockTicked) {
        let nextQ: LogicValue = node.state.q ?? 0;
        let nextQBar: LogicValue = node.state.qBar ?? 1;

        if (s === 1 && r === 1) {
          // Invalid / forbidden state in SR flip-flop
          nextQ = 'X';
          nextQBar = 'X';
        } else if (s === 1 && r === 0) {
          nextQ = 1;
          nextQBar = 0;
        } else if (s === 0 && r === 1) {
          nextQ = 0;
          nextQBar = 1;
        }
        // s=0, r=0 -> hold state

        if (node.outputs[0] && node.outputs[0].value !== nextQ) {
          node.outputs[0].value = nextQ;
          node.state.q = nextQ;
          changed = true;
        }
        if (node.outputs[1] && node.outputs[1].value !== nextQBar) {
          node.outputs[1].value = nextQBar;
          node.state.qBar = nextQBar;
          changed = true;
        }
      }
      break;
    }

    case 'D_FF': {
      // Inputs: [D, CLK, (Optional RESET)]
      const d = node.inputs[0]?.value ?? 0;
      const clk = node.inputs[1]?.value ?? 0;
      const rst = node.inputs[2]?.value ?? 0;

      if (!node.state) {
        node.state = { q: 0, qBar: 1, prevClock: 0 };
      }

      if (rst === 1) {
        // Asynchronous reset
        if (node.state.q !== 0 || node.state.qBar !== 1) {
          node.state.q = 0;
          node.state.qBar = 1;
          if (node.outputs[0]) node.outputs[0].value = 0;
          if (node.outputs[1]) node.outputs[1].value = 1;
          changed = true;
        }
      } else {
        const prevClk = node.state.prevClock ?? 0;
        const isRisingEdge = prevClk === 0 && clk === 1;
        node.state.prevClock = clk;

        if (isRisingEdge || clockTicked) {
          const nextQ = d === 1 ? 1 : 0;
          const nextQBar = nextQ === 1 ? 0 : 1;
          if (node.outputs[0] && node.outputs[0].value !== nextQ) {
            node.outputs[0].value = nextQ;
            node.state.q = nextQ;
            changed = true;
          }
          if (node.outputs[1] && node.outputs[1].value !== nextQBar) {
            node.outputs[1].value = nextQBar;
            node.state.qBar = nextQBar;
            changed = true;
          }
        }
      }
      break;
    }

    case 'JK_FF': {
      // Inputs: [J, K, CLK]
      const j = node.inputs[0]?.value ?? 0;
      const k = node.inputs[1]?.value ?? 0;
      const clk = node.inputs[2]?.value ?? 0;

      if (!node.state) {
        node.state = { q: 0, qBar: 1, prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (isRisingEdge || clockTicked) {
        const currentQ = node.state.q === 1 ? 1 : 0;
        let nextQ: LogicValue = currentQ;

        if (j === 0 && k === 0) {
          nextQ = currentQ; // Hold
        } else if (j === 0 && k === 1) {
          nextQ = 0; // Reset
        } else if (j === 1 && k === 0) {
          nextQ = 1; // Set
        } else if (j === 1 && k === 1) {
          nextQ = currentQ === 1 ? 0 : 1; // Toggle
        }

        const nextQBar: LogicValue = nextQ === 1 ? 0 : 1;
        if (node.outputs[0] && node.outputs[0].value !== nextQ) {
          node.outputs[0].value = nextQ;
          node.state.q = nextQ;
          changed = true;
        }
        if (node.outputs[1] && node.outputs[1].value !== nextQBar) {
          node.outputs[1].value = nextQBar;
          node.state.qBar = nextQBar;
          changed = true;
        }
      }
      break;
    }

    case 'T_FF': {
      // Inputs: [T, CLK]
      const t = node.inputs[0]?.value ?? 0;
      const clk = node.inputs[1]?.value ?? 0;

      if (!node.state) {
        node.state = { q: 0, qBar: 1, prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (isRisingEdge || clockTicked) {
        const currentQ = node.state.q === 1 ? 1 : 0;
        const nextQ = t === 1 ? (currentQ === 1 ? 0 : 1) : currentQ;
        const nextQBar = nextQ === 1 ? 0 : 1;

        if (node.outputs[0] && node.outputs[0].value !== nextQ) {
          node.outputs[0].value = nextQ;
          node.state.q = nextQ;
          changed = true;
        }
        if (node.outputs[1] && node.outputs[1].value !== nextQBar) {
          node.outputs[1].value = nextQBar;
          node.state.qBar = nextQBar;
          changed = true;
        }
      }
      break;
    }

    default: {
      // Standard combinational gate
      const inVals = node.inputs.map(p => p.value);
      const outVal = evalGate(node.type, inVals);
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }
  }

  return changed;
}

/**
 * Propagate wire signals from output ports to destination input ports
 */
function propagateWires(nodes: CircuitNode[], wires: Wire[]): boolean {
  let changed = false;
  const nodeMap = new Map<string, CircuitNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Clear inputs before re-evaluation if needed or propagate values
  for (const wire of wires) {
    const fromNode = nodeMap.get(wire.fromNodeId);
    const toNode = nodeMap.get(wire.toNodeId);

    if (fromNode && toNode) {
      const fromPort = fromNode.outputs[wire.fromPortIndex];
      const toPort = toNode.inputs[wire.toPortIndex];

      if (fromPort && toPort) {
        const val = fromPort.value;
        if (wire.value !== val) {
          wire.value = val;
          changed = true;
        }
        if (toPort.value !== val) {
          toPort.value = val;
          changed = true;
        }
      }
    }
  }

  return changed;
}

/**
 * Runs the deterministic simulation on a circuit
 */
export function simulateCircuit(circuit: Circuit, options?: { clockTick?: boolean }): SimulationResult {
  const cloned = cloneCircuit(circuit);
  const validation = validateCircuit(cloned);

  let steps = 0;
  let hasActivity = true;
  let cyclesDetected = false;

  // Initial node evaluation (switches, clocks, presets)
  for (const node of cloned.nodes) {
    evaluateNode(node, options?.clockTick);
  }

  while (hasActivity && steps < MAX_SIMULATION_STEPS) {
    steps++;
    const wiresChanged = propagateWires(cloned.nodes, cloned.wires);

    let nodesChanged = false;
    for (const node of cloned.nodes) {
      if (evaluateNode(node, false)) {
        nodesChanged = true;
      }
    }

    hasActivity = wiresChanged || nodesChanged;
  }

  if (steps >= MAX_SIMULATION_STEPS) {
    cyclesDetected = true;
    validation.warnings.push('Unstable feedback oscillation detected or maximum simulation steps exceeded.');
  }

  return {
    nodes: cloned.nodes,
    wires: cloned.wires,
    isValid: validation.isValid,
    errors: validation.errors,
    warnings: validation.warnings,
    cyclesDetected,
  };
}
