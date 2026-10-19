import { ASTNode } from './ast';
import { Circuit, CircuitNode, Wire } from '../types';
import { extractVariables } from './parser';

export function astToCircuit(ast: ASTNode, circuitName: string = 'Generated Boolean Circuit'): Circuit {
  const variables = extractVariables(ast);
  const nodes: CircuitNode[] = [];
  const wires: Wire[] = [];

  let nextId = 1;
  const getId = (prefix: string) => `${prefix}_${nextId++}`;

  // 1. Create input switch nodes for each variable
  const varNodeMap = new Map<string, CircuitNode>();
  let switchY = 100;
  for (const v of variables) {
    const swNode: CircuitNode = {
      id: getId('sw'),
      type: 'SWITCH',
      label: v,
      x: 80,
      y: switchY,
      inputs: [],
      outputs: [{ id: 'out_0', name: 'Q', type: 'output', value: 0 }],
      state: { highValue: false },
    };
    nodes.push(swNode);
    varNodeMap.set(v, swNode);
    switchY += 90;
  }

  // 2. Recursively convert AST nodes into gates
  let currentLayerX = 260;

  function buildSubcircuit(node: ASTNode, depth: number): { nodeId: string; portIndex: number } {
    if (node.type === 'VARIABLE') {
      const sw = varNodeMap.get(String(node.value));
      if (!sw) throw new Error(`Unknown variable ${node.value}`);
      return { nodeId: sw.id, portIndex: 0 };
    }

    if (node.type === 'CONSTANT') {
      const constNode: CircuitNode = {
        id: getId('const'),
        type: 'SWITCH',
        label: String(node.value),
        x: 80,
        y: switchY,
        inputs: [],
        outputs: [{ id: 'out_0', name: 'Q', type: 'output', value: node.value === 1 ? 1 : 0 }],
        state: { highValue: node.value === 1 },
      };
      switchY += 80;
      nodes.push(constNode);
      return { nodeId: constNode.id, portIndex: 0 };
    }

    if (node.type === 'NOT') {
      const child = node.children?.[0];
      if (!child) throw new Error('NOT gate missing operand');
      const childPort = buildSubcircuit(child, depth + 1);

      const notGate: CircuitNode = {
        id: getId('not'),
        type: 'NOT',
        label: 'NOT',
        x: currentLayerX + depth * 140,
        y: 120 + depth * 50,
        inputs: [{ id: 'in_0', name: 'A', type: 'input', value: 0 }],
        outputs: [{ id: 'out_0', name: 'Y', type: 'output', value: 1 }],
      };
      nodes.push(notGate);

      wires.push({
        id: getId('w'),
        fromNodeId: childPort.nodeId,
        fromPortIndex: childPort.portIndex,
        toNodeId: notGate.id,
        toPortIndex: 0,
        value: 0,
      });

      return { nodeId: notGate.id, portIndex: 0 };
    }

    // Binary / Multi-ary gate (AND, OR, XOR)
    const childSources = (node.children || []).map(c => buildSubcircuit(c, depth + 1));
    const gateType = node.type === 'AND' ? 'AND' : node.type === 'OR' ? 'OR' : 'XOR';

    const gateNode: CircuitNode = {
      id: getId(gateType.toLowerCase()),
      type: gateType,
      label: gateType,
      x: currentLayerX + depth * 150,
      y: 120 + depth * 60,
      inputs: childSources.map((_, i) => ({
        id: `in_${i}`,
        name: String.fromCharCode(65 + i),
        type: 'input',
        value: 0,
      })),
      outputs: [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }],
    };
    nodes.push(gateNode);

    childSources.forEach((src, idx) => {
      wires.push({
        id: getId('w'),
        fromNodeId: src.nodeId,
        fromPortIndex: src.portIndex,
        toNodeId: gateNode.id,
        toPortIndex: idx,
        value: 0,
      });
    });

    return { nodeId: gateNode.id, portIndex: 0 };
  }

  const finalOutput = buildSubcircuit(ast, 1);

  // 3. Add LED Output indicator
  const ledNode: CircuitNode = {
    id: getId('led'),
    type: 'LED',
    label: 'Output (Y)',
    x: nodes.reduce((max, n) => Math.max(max, n.x), 0) + 160,
    y: 160,
    inputs: [{ id: 'in_0', name: 'In', type: 'input', value: 0 }],
    outputs: [{ id: 'out_0', name: 'Val', type: 'output', value: 0 }],
  };
  nodes.push(ledNode);

  wires.push({
    id: getId('w'),
    fromNodeId: finalOutput.nodeId,
    fromPortIndex: finalOutput.portIndex,
    toNodeId: ledNode.id,
    toPortIndex: 0,
    value: 0,
  });

  return {
    id: `circuit_${Date.now()}`,
    name: circuitName,
    description: 'Auto-synthesized logic circuit from Boolean AST',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    nodes,
    wires,
  };
}
