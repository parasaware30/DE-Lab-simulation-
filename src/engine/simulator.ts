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
    if (['SWITCH', 'PUSH_BUTTON', 'CLOCK', 'CONST_HIGH', 'CONST_LOW', 'COMMENT', 'SEVEN_SEG', 'HEX_DISPLAY', 'BAR_GRAPH', 'BATTERY_DC', 'GND', 'CRYSTAL_OSC', 'RGB_LED', 'VOLTMETER'].includes(node.type)) continue;

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

    case 'PUSH_BUTTON': {
      const val: LogicValue = node.state?.highValue ? 1 : 0;
      if (node.outputs[0].value !== val) {
        node.outputs[0].value = val;
        changed = true;
      }
      break;
    }

    case 'CONST_HIGH': {
      if (node.outputs[0].value !== 1) {
        node.outputs[0].value = 1;
        changed = true;
      }
      break;
    }

    case 'CONST_LOW': {
      if (node.outputs[0].value !== 0) {
        node.outputs[0].value = 0;
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
    case 'PROBE':
    case 'BUZZER': {
      const inVal = node.inputs[0]?.value ?? 'Z';
      const outVal = inVal === 1 ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'HEX_DISPLAY':
    case 'BAR_GRAPH':
    case 'SEVEN_SEG':
    case 'COMMENT': {
      // Passive annotation element or display
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

    case 'D_LATCH': {
      // Inputs: [D, EN] -> Outputs: [Q, Q']
      const d = node.inputs[0]?.value === 1 ? 1 : 0;
      const en = node.inputs[1]?.value === 1 ? 1 : 0;
      if (!node.state) {
        node.state = { q: 0, qBar: 1 };
      }
      if (en === 1) {
        node.state.q = d;
        node.state.qBar = d === 1 ? 0 : 1;
      }
      const q = node.state.q ?? 0;
      const qBar = node.state.qBar ?? 1;
      if (node.outputs[0] && node.outputs[0].value !== q) {
        node.outputs[0].value = q;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== qBar) {
        node.outputs[1].value = qBar;
        changed = true;
      }
      break;
    }

    case 'HALF_ADDER': {
      // Inputs: [A, B] -> Outputs: [Sum (S), Carry (C)]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 1 : 0;
      const sum: LogicValue = (a ^ b) as LogicValue;
      const carry: LogicValue = (a & b) as LogicValue;
      if (node.outputs[0] && node.outputs[0].value !== sum) {
        node.outputs[0].value = sum;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== carry) {
        node.outputs[1].value = carry;
        changed = true;
      }
      break;
    }

    case 'FULL_ADDER': {
      // Inputs: [A, B, Cin] -> Outputs: [Sum (S), Cout]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 1 : 0;
      const cin = node.inputs[2]?.value === 1 ? 1 : 0;
      const sum: LogicValue = (a ^ b ^ cin) as LogicValue;
      const cout: LogicValue = ((a & b) | (cin & (a ^ b))) as LogicValue;
      if (node.outputs[0] && node.outputs[0].value !== sum) {
        node.outputs[0].value = sum;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== cout) {
        node.outputs[1].value = cout;
        changed = true;
      }
      break;
    }

    case 'HALF_SUB': {
      // Inputs: [A, B] -> Outputs: [Diff (D), Borrow (B)]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 1 : 0;
      const diff: LogicValue = (a ^ b) as LogicValue;
      const borrow: LogicValue = (!a && b ? 1 : 0) as LogicValue;
      if (node.outputs[0] && node.outputs[0].value !== diff) {
        node.outputs[0].value = diff;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== borrow) {
        node.outputs[1].value = borrow;
        changed = true;
      }
      break;
    }

    case 'FULL_SUB': {
      // Inputs: [A, B, Bin] -> Outputs: [Diff (D), Bout]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 1 : 0;
      const bin = node.inputs[2]?.value === 1 ? 1 : 0;
      const diff: LogicValue = (a ^ b ^ bin) as LogicValue;
      const bout: LogicValue = (((!a && b) || (!(a ^ b) && bin)) ? 1 : 0) as LogicValue;
      if (node.outputs[0] && node.outputs[0].value !== diff) {
        node.outputs[0].value = diff;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== bout) {
        node.outputs[1].value = bout;
        changed = true;
      }
      break;
    }

    case 'MUX_2TO1': {
      // Inputs: [D0, D1, S] -> Output: [Y]
      const s = node.inputs[2]?.value === 1 ? 1 : 0;
      const out = s === 1 ? (node.inputs[1]?.value ?? 0) : (node.inputs[0]?.value ?? 0);
      if (node.outputs[0] && node.outputs[0].value !== out) {
        node.outputs[0].value = out;
        changed = true;
      }
      break;
    }

    case 'MUX_4TO1': {
      // Inputs: [D0, D1, D2, D3, S0, S1] -> Output: [Y]
      const s0 = node.inputs[4]?.value === 1 ? 1 : 0;
      const s1 = node.inputs[5]?.value === 1 ? 2 : 0;
      const sel = s1 + s0;
      const out = node.inputs[sel]?.value ?? 0;
      if (node.outputs[0] && node.outputs[0].value !== out) {
        node.outputs[0].value = out;
        changed = true;
      }
      break;
    }

    case 'MUX_8TO1': {
      // Inputs: [D0..D7 (0..7), S0 (8), S1 (9), S2 (10), EN (11)] -> Outputs: [Y (0), W / Y' (1)]
      const s0 = node.inputs[8]?.value === 1 ? 1 : 0;
      const s1 = node.inputs[9]?.value === 1 ? 2 : 0;
      const s2 = node.inputs[10]?.value === 1 ? 4 : 0;
      const sel = s0 + s1 + s2;
      const en = node.inputs[11] ? (node.inputs[11].value === 1 ? 1 : 0) : 1;
      const selVal: LogicValue = en === 1 ? (node.inputs[sel]?.value ?? 0) : 0;
      const invVal: LogicValue = en === 1 ? (selVal === 1 ? 0 : 1) : 1;
      if (node.outputs[0] && node.outputs[0].value !== selVal) {
        node.outputs[0].value = selVal;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== invVal) {
        node.outputs[1].value = invVal;
        changed = true;
      }
      break;
    }

    case 'DEMUX_1TO2': {
      // Inputs: [In, S] -> Outputs: [Y0, Y1]
      const inVal = node.inputs[0]?.value ?? 0;
      const s = node.inputs[1]?.value === 1 ? 1 : 0;
      const y0: LogicValue = s === 0 ? inVal : 0;
      const y1: LogicValue = s === 1 ? inVal : 0;
      if (node.outputs[0] && node.outputs[0].value !== y0) {
        node.outputs[0].value = y0;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== y1) {
        node.outputs[1].value = y1;
        changed = true;
      }
      break;
    }

    case 'DEMUX_1TO4': {
      // Inputs: [In, S0, S1] -> Outputs: [Y0, Y1, Y2, Y3]
      const inVal = node.inputs[0]?.value ?? 0;
      const s0 = node.inputs[1]?.value === 1 ? 1 : 0;
      const s1 = node.inputs[2]?.value === 1 ? 2 : 0;
      const sel = s1 + s0;
      for (let k = 0; k < 4; k++) {
        const val: LogicValue = k === sel ? inVal : 0;
        if (node.outputs[k] && node.outputs[k].value !== val) {
          node.outputs[k].value = val;
          changed = true;
        }
      }
      break;
    }

    case 'DECODER_2TO4': {
      // Inputs: [A0, A1, EN] -> Outputs: [Y0, Y1, Y2, Y3]
      const en = node.inputs[2] ? (node.inputs[2].value === 1 ? 1 : 0) : 1;
      const a0 = node.inputs[0]?.value === 1 ? 1 : 0;
      const a1 = node.inputs[1]?.value === 1 ? 2 : 0;
      const sel = a1 + a0;
      for (let k = 0; k < 4; k++) {
        const val: LogicValue = en === 1 && k === sel ? 1 : 0;
        if (node.outputs[k] && node.outputs[k].value !== val) {
          node.outputs[k].value = val;
          changed = true;
        }
      }
      break;
    }

    case 'DECODER_3TO8': {
      // Inputs: [A, B, C, EN] -> Outputs: [Y0..Y7]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 2 : 0;
      const c = node.inputs[2]?.value === 1 ? 4 : 0;
      const en = node.inputs[3] ? (node.inputs[3].value === 1 ? 1 : 0) : 1;
      const sel = a + b + c;
      for (let k = 0; k < 8; k++) {
        const val: LogicValue = (en === 1 && k === sel) ? 1 : 0;
        if (node.outputs[k] && node.outputs[k].value !== val) {
          node.outputs[k].value = val;
          changed = true;
        }
      }
      break;
    }

    case 'PRIORITY_ENC_4TO2': {
      // Inputs: [D0, D1, D2, D3] -> Outputs: [A0, A1, V]
      let a0: LogicValue = 0;
      let a1: LogicValue = 0;
      let v: LogicValue = 0;
      if (node.inputs[3]?.value === 1) {
        a1 = 1; a0 = 1; v = 1;
      } else if (node.inputs[2]?.value === 1) {
        a1 = 1; a0 = 0; v = 1;
      } else if (node.inputs[1]?.value === 1) {
        a1 = 0; a0 = 1; v = 1;
      } else if (node.inputs[0]?.value === 1) {
        a1 = 0; a0 = 0; v = 1;
      }
      if (node.outputs[0] && node.outputs[0].value !== a0) {
        node.outputs[0].value = a0;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== a1) {
        node.outputs[1].value = a1;
        changed = true;
      }
      if (node.outputs[2] && node.outputs[2].value !== v) {
        node.outputs[2].value = v;
        changed = true;
      }
      break;
    }

    case 'MAG_COMP_2BIT': {
      // Inputs: [A, B] -> Outputs: [A>B, A=B, A<B]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 1 : 0;
      const gt: LogicValue = a > b ? 1 : 0;
      const eq: LogicValue = a === b ? 1 : 0;
      const lt: LogicValue = a < b ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== gt) {
        node.outputs[0].value = gt;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== eq) {
        node.outputs[1].value = eq;
        changed = true;
      }
      if (node.outputs[2] && node.outputs[2].value !== lt) {
        node.outputs[2].value = lt;
        changed = true;
      }
      break;
    }

    case 'MAG_COMP_4BIT': {
      // Inputs: A0..A3 (0..3), B0..B3 (4..7) -> Outputs: [A>B, A=B, A<B]
      const a = (node.inputs[0]?.value === 1 ? 1 : 0) |
                (node.inputs[1]?.value === 1 ? 2 : 0) |
                (node.inputs[2]?.value === 1 ? 4 : 0) |
                (node.inputs[3]?.value === 1 ? 8 : 0);
      const b = (node.inputs[4]?.value === 1 ? 1 : 0) |
                (node.inputs[5]?.value === 1 ? 2 : 0) |
                (node.inputs[6]?.value === 1 ? 4 : 0) |
                (node.inputs[7]?.value === 1 ? 8 : 0);
      const gt: LogicValue = a > b ? 1 : 0;
      const eq: LogicValue = a === b ? 1 : 0;
      const lt: LogicValue = a < b ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== gt) {
        node.outputs[0].value = gt;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== eq) {
        node.outputs[1].value = eq;
        changed = true;
      }
      if (node.outputs[2] && node.outputs[2].value !== lt) {
        node.outputs[2].value = lt;
        changed = true;
      }
      break;
    }

    case 'PARITY_GEN': {
      // Inputs: [D0..D3] -> Outputs: [PEVEN, PODD]
      const ones = (node.inputs[0]?.value === 1 ? 1 : 0) +
                   (node.inputs[1]?.value === 1 ? 1 : 0) +
                   (node.inputs[2]?.value === 1 ? 1 : 0) +
                   (node.inputs[3]?.value === 1 ? 1 : 0);
      const even: LogicValue = ones % 2 === 0 ? 1 : 0;
      const odd: LogicValue = ones % 2 === 1 ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== even) {
        node.outputs[0].value = even;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== odd) {
        node.outputs[1].value = odd;
        changed = true;
      }
      break;
    }

    case 'ALU_4BIT': {
      // Inputs: [A0..A3, B0..B3, S0, S1, Cin] -> Outputs: [F0..F3, Cout, Zero]
      const a = (node.inputs[0]?.value === 1 ? 1 : 0) |
                (node.inputs[1]?.value === 1 ? 2 : 0) |
                (node.inputs[2]?.value === 1 ? 4 : 0) |
                (node.inputs[3]?.value === 1 ? 8 : 0);
      const b = (node.inputs[4]?.value === 1 ? 1 : 0) |
                (node.inputs[5]?.value === 1 ? 2 : 0) |
                (node.inputs[6]?.value === 1 ? 4 : 0) |
                (node.inputs[7]?.value === 1 ? 8 : 0);
      const s0 = node.inputs[8]?.value === 1 ? 1 : 0;
      const s1 = node.inputs[9]?.value === 1 ? 2 : 0;
      const cin = node.inputs[10]?.value === 1 ? 1 : 0;
      const op = s0 + s1; // 0: ADD, 1: SUB, 2: AND, 3: OR

      let fVal = 0;
      let coutVal: LogicValue = 0;

      if (op === 0) {
        const sum = a + b + cin;
        fVal = sum & 0xF;
        coutVal = sum > 15 ? 1 : 0;
      } else if (op === 1) {
        const diff = a - b - cin;
        fVal = (diff + 16) & 0xF;
        coutVal = diff < 0 ? 1 : 0;
      } else if (op === 2) {
        fVal = (a & b) & 0xF;
        coutVal = 0;
      } else {
        fVal = (a | b) & 0xF;
        coutVal = 0;
      }

      const zeroVal: LogicValue = fVal === 0 ? 1 : 0;
      const fBits: LogicValue[] = [
        (fVal & 1) ? 1 : 0,
        (fVal & 2) ? 1 : 0,
        (fVal & 4) ? 1 : 0,
        (fVal & 8) ? 1 : 0,
      ];

      for (let k = 0; k < 4; k++) {
        if (node.outputs[k] && node.outputs[k].value !== fBits[k]) {
          node.outputs[k].value = fBits[k];
          changed = true;
        }
      }
      if (node.outputs[4] && node.outputs[4].value !== coutVal) {
        node.outputs[4].value = coutVal;
        changed = true;
      }
      if (node.outputs[5] && node.outputs[5].value !== zeroVal) {
        node.outputs[5].value = zeroVal;
        changed = true;
      }
      break;
    }

    case 'COUNTER_4BIT': {
      // Inputs: [CLK, RST] -> Outputs: [Q0, Q1, Q2, Q3]
      const clk = node.inputs[0]?.value ?? 0;
      const rst = node.inputs[1]?.value ?? 0;

      if (!node.state) {
        node.state = { counterValue: 0, prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (rst === 1) {
        node.state.counterValue = 0;
      } else if (isRisingEdge || clockTicked) {
        node.state.counterValue = ((node.state.counterValue ?? 0) + 1) % 16;
      }

      const c = node.state.counterValue ?? 0;
      const bits: LogicValue[] = [
        (c & 1) ? 1 : 0,
        (c & 2) ? 1 : 0,
        (c & 4) ? 1 : 0,
        (c & 8) ? 1 : 0,
      ];
      for (let k = 0; k < 4; k++) {
        if (node.outputs[k] && node.outputs[k].value !== bits[k]) {
          node.outputs[k].value = bits[k];
          changed = true;
        }
      }
      break;
    }

    case 'DECADE_COUNTER': {
      // Inputs: [CLK, RST] -> Outputs: [Q0, Q1, Q2, Q3, RCO]
      const clk = node.inputs[0]?.value ?? 0;
      const rst = node.inputs[1]?.value ?? 0;

      if (!node.state) {
        node.state = { counterValue: 0, prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (rst === 1) {
        node.state.counterValue = 0;
      } else if (isRisingEdge || clockTicked) {
        node.state.counterValue = ((node.state.counterValue ?? 0) + 1) % 10;
      }

      const c = node.state.counterValue ?? 0;
      const bits: LogicValue[] = [
        (c & 1) ? 1 : 0,
        (c & 2) ? 1 : 0,
        (c & 4) ? 1 : 0,
        (c & 8) ? 1 : 0,
      ];
      for (let k = 0; k < 4; k++) {
        if (node.outputs[k] && node.outputs[k].value !== bits[k]) {
          node.outputs[k].value = bits[k];
          changed = true;
        }
      }
      const rco: LogicValue = c === 9 ? 1 : 0;
      if (node.outputs[4] && node.outputs[4].value !== rco) {
        node.outputs[4].value = rco;
        changed = true;
      }
      break;
    }

    case 'SHIFT_REG_4BIT': {
      // Inputs: [DIN, CLK, RST] -> Outputs: [Q0, Q1, Q2, Q3]
      const din = node.inputs[0]?.value === 1 ? 1 : 0;
      const clk = node.inputs[1]?.value ?? 0;
      const rst = node.inputs[2]?.value ?? 0;

      if (!node.state) {
        node.state = { regValues: [0, 0, 0, 0], prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (rst === 1) {
        node.state.regValues = [0, 0, 0, 0];
      } else if (isRisingEdge || clockTicked) {
        const cur = node.state.regValues ?? [0, 0, 0, 0];
        node.state.regValues = [din, cur[0], cur[1], cur[2]];
      }

      const regs = node.state.regValues ?? [0, 0, 0, 0];
      for (let k = 0; k < 4; k++) {
        if (node.outputs[k] && node.outputs[k].value !== regs[k]) {
          node.outputs[k].value = regs[k];
          changed = true;
        }
      }
      break;
    }

    case 'REGISTER_4BIT': {
      // Inputs: [D0, D1, D2, D3, CLK, LOAD, RST] -> Outputs: [Q0, Q1, Q2, Q3]
      const d0 = node.inputs[0]?.value === 1 ? 1 : 0;
      const d1 = node.inputs[1]?.value === 1 ? 1 : 0;
      const d2 = node.inputs[2]?.value === 1 ? 1 : 0;
      const d3 = node.inputs[3]?.value === 1 ? 1 : 0;
      const clk = node.inputs[4]?.value ?? 0;
      const load = node.inputs[5] ? (node.inputs[5].value === 1 ? 1 : 0) : 1;
      const rst = node.inputs[6]?.value ?? 0;

      if (!node.state) {
        node.state = { regValues: [0, 0, 0, 0], prevClock: 0 };
      }

      const prevClk = node.state.prevClock ?? 0;
      const isRisingEdge = prevClk === 0 && clk === 1;
      node.state.prevClock = clk;

      if (rst === 1) {
        node.state.regValues = [0, 0, 0, 0];
      } else if (isRisingEdge || clockTicked) {
        if (load === 1) {
          node.state.regValues = [d0, d1, d2, d3];
        }
      }

      const regs = node.state.regValues ?? [0, 0, 0, 0];
      for (let k = 0; k < 4; k++) {
        if (node.outputs[k] && node.outputs[k].value !== regs[k]) {
          node.outputs[k].value = regs[k];
          changed = true;
        }
      }
      break;
    }

    case 'BCD_TO_7SEG': {
      // Inputs: [A, B, C, D] (BCD code: A is bit0, B is bit1, C is bit2, D is bit3)
      // Outputs: [a, b, c, d, e, f, g]
      const a = node.inputs[0]?.value === 1 ? 1 : 0;
      const b = node.inputs[1]?.value === 1 ? 2 : 0;
      const c = node.inputs[2]?.value === 1 ? 4 : 0;
      const d = node.inputs[3]?.value === 1 ? 8 : 0;
      const digit = d + c + b + a;

      const segTable: Record<number, LogicValue[]> = {
        0: [1, 1, 1, 1, 1, 1, 0],
        1: [0, 1, 1, 0, 0, 0, 0],
        2: [1, 1, 0, 1, 1, 0, 1],
        3: [1, 1, 1, 1, 0, 0, 1],
        4: [0, 1, 1, 0, 0, 1, 1],
        5: [1, 0, 1, 1, 0, 1, 1],
        6: [1, 0, 1, 1, 1, 1, 1],
        7: [1, 1, 1, 0, 0, 0, 0],
        8: [1, 1, 1, 1, 1, 1, 1],
        9: [1, 1, 1, 1, 0, 1, 1],
      };

      const segs = segTable[digit] ?? [0, 0, 0, 0, 0, 0, 0];
      for (let k = 0; k < 7; k++) {
        if (node.outputs[k] && node.outputs[k].value !== segs[k]) {
          node.outputs[k].value = segs[k];
          changed = true;
        }
      }
      break;
    }

    case 'RESISTOR':
    case 'CAPACITOR':
    case 'INDUCTOR':
    case 'DIODE':
    case 'ZENER_DIODE': {
      // Pass-through logic state with diode unidirectional constraint
      const inVal = node.inputs[0]?.value ?? 0;
      const outVal: LogicValue = inVal === 1 ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'TRANSISTOR_NPN': {
      // Inputs: Base (0), Collector (1) -> Emitter Output (0)
      const base = node.inputs[0]?.value === 1 ? 1 : 0;
      const collector = node.inputs[1]?.value ?? 0;
      const outVal: LogicValue = base === 1 ? collector : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'MOSFET_N': {
      // Inputs: Gate (0), Drain (1) -> Source Output (0)
      const gate = node.inputs[0]?.value === 1 ? 1 : 0;
      const drain = node.inputs[1]?.value ?? 0;
      const outVal: LogicValue = gate === 1 ? drain : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'POTENTIOMETER': {
      // Inputs: Terminal 1 (0), Terminal 2 (1) -> Wiper Output (0)
      const v1 = node.inputs[0]?.value ?? 0;
      const v2 = node.inputs[1]?.value ?? 0;
      const pot = node.state?.potValue ?? 100;
      const outVal: LogicValue = pot >= 50 ? v1 : v2;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'RELAY': {
      // Inputs: Coil (0), COM (1) -> NO (0), NC (1)
      const coil = node.inputs[0]?.value === 1 ? 1 : 0;
      const com = node.inputs[1]?.value ?? 0;
      const noVal: LogicValue = coil === 1 ? com : 0;
      const ncVal: LogicValue = coil === 0 ? com : 0;
      if (node.outputs[0] && node.outputs[0].value !== noVal) {
        node.outputs[0].value = noVal;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== ncVal) {
        node.outputs[1].value = ncVal;
        changed = true;
      }
      break;
    }

    case 'FUSE': {
      // Inputs: In (0) -> Out (0)
      const inVal = node.inputs[0]?.value ?? 0;
      const isBlown = node.state?.fuseBlown ?? false;
      const outVal: LogicValue = isBlown ? 0 : inVal;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'BATTERY_DC': {
      if (node.outputs[0] && node.outputs[0].value !== 1) {
        node.outputs[0].value = 1;
        changed = true;
      }
      break;
    }

    case 'GND': {
      if (node.outputs[0] && node.outputs[0].value !== 0) {
        node.outputs[0].value = 0;
        changed = true;
      }
      break;
    }

    case 'CRYSTAL_OSC': {
      if (!node.state) node.state = {};
      if (clockTicked) {
        node.state.highValue = !node.state.highValue;
      }
      const clkVal: LogicValue = node.state.highValue ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== clkVal) {
        node.outputs[0].value = clkVal;
        changed = true;
      }
      break;
    }

    case 'TRANSISTOR_PNP': {
      // Inputs: Base (0), Collector (1) -> Emitter Output (0)
      // In PNP BJT: conducts Collector to Emitter when Base is LOW (0)
      const base = node.inputs[0]?.value === 0 ? 0 : 1;
      const collector = node.inputs[1]?.value ?? 0;
      const outVal: LogicValue = base === 0 ? collector : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'MOSFET_P': {
      // Inputs: Gate (0), Drain (1) -> Source Output (0)
      // Active LOW: conducts Drain to Source when Gate is LOW (0)
      const gate = node.inputs[0]?.value === 0 ? 0 : 1;
      const drain = node.inputs[1]?.value ?? 0;
      const outVal: LogicValue = gate === 0 ? drain : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'DIODE_SCHOTTKY': {
      const inVal = node.inputs[0]?.value ?? 0;
      const outVal: LogicValue = inVal === 1 ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'LDR_PHOTORESISTOR': {
      // Inputs: In (0) -> Out (0)
      const inVal = node.inputs[0]?.value ?? 0;
      const light = node.state?.lightLevel ?? 80;
      const outVal: LogicValue = light >= 50 ? inVal : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'OP_AMP': {
      // Inputs: Non-inverting V+ (0), Inverting V- (1) -> Vout (0)
      const vp = node.inputs[0]?.value === 1 ? 1 : 0;
      const vm = node.inputs[1]?.value === 1 ? 1 : 0;
      const outVal: LogicValue = (vp === 1 && vm === 0) ? 1 : 0;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'IC_555': {
      // Inputs: TRIG (0), RST (1) -> OUT (0), DIS (1)
      const trig = node.inputs[0]?.value ?? 1;
      const rst = node.inputs[1] ? (node.inputs[1].value ?? 1) : 1;
      let outVal: LogicValue = 0;
      if (rst === 0) {
        outVal = 0;
      } else if (trig === 0) {
        outVal = 1;
      } else {
        outVal = clockTicked ? 1 : (node.outputs[0]?.value ?? 0);
      }
      const disVal: LogicValue = outVal === 1 ? 0 : 1;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      if (node.outputs[1] && node.outputs[1].value !== disVal) {
        node.outputs[1].value = disVal;
        changed = true;
      }
      break;
    }

    case 'VOLTMETER': {
      // Pass-through probe
      const inVal = node.inputs[0]?.value ?? 0;
      if (node.outputs[0] && node.outputs[0].value !== inVal) {
        node.outputs[0].value = inVal;
        changed = true;
      }
      break;
    }

    case 'SCHMITT_NOT': {
      const inVal = node.inputs[0]?.value ?? 0;
      const outVal: LogicValue = inVal === 1 ? 0 : 1;
      if (node.outputs[0] && node.outputs[0].value !== outVal) {
        node.outputs[0].value = outVal;
        changed = true;
      }
      break;
    }

    case 'RGB_LED': {
      // Visual indicator sink - no output signals
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
