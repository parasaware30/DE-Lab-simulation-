import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Circuit, 
  CircuitNode, 
  Wire, 
  GateType, 
  LogicValue 
} from '../../engine/types';
import { simulateCircuit, validateCircuit } from '../../engine/simulator';
import { generateCircuitTruthTable, truthTableToCSV } from '../../engine/truthTableGenerator';
import { SAMPLE_CIRCUITS } from '../../engine/sampleCircuits';
import { saveProject, exportProjectAsDigitalXML } from '../../engine/storage/projectStore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Trash2, 
  Copy, 
  Undo2, 
  Redo2, 
  Table, 
  Download, 
  AlertTriangle, 
  Save, 
  Sparkles,
  MousePointer,
  Cable,
  CheckCircle2,
  X
} from 'lucide-react';

interface CircuitEditorProps {
  initialCircuit?: Circuit;
  onSaveToVault?: (circuit: Circuit) => void;
}

/**
 * Calculates uniform dimensions for each component type
 */
export const getNodeDimensions = (node: CircuitNode) => {
  if (node.type.endsWith('_FF')) {
    return { width: 120, height: 96 };
  }
  if (['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(node.type)) {
    const inputCount = Math.max(2, node.inputs.length);
    const height = Math.max(80, inputCount * 28 + 24);
    return { width: 116, height };
  }
  if (node.type === 'SWITCH' || node.type === 'CLOCK') {
    return { width: 104, height: 78 };
  }
  if (node.type === 'LED') {
    return { width: 96, height: 78 };
  }
  const maxPorts = Math.max(node.inputs.length, node.outputs.length);
  return { width: 116, height: Math.max(76, maxPorts * 26 + 24) };
};

/**
 * Calculates exact (x, y) coordinates for any input or output port
 */
export const getPortCoordinates = (node: CircuitNode, portIndex: number, type: 'input' | 'output') => {
  const { width, height } = getNodeDimensions(node);
  const startY = 28;
  const availHeight = height - startY - 12;

  if (type === 'input') {
    const count = node.inputs.length;
    const spacing = count > 1 ? availHeight / (count - 1) : availHeight / 2;
    const y = count === 1 ? startY + availHeight / 2 : startY + portIndex * spacing;
    return { x: node.x, y: node.y + y };
  } else {
    const count = node.outputs.length;
    const spacing = count > 1 ? availHeight / (count - 1) : availHeight / 2;
    const y = count === 1 ? startY + availHeight / 2 : startY + portIndex * spacing;
    return { x: node.x + width, y: node.y + y };
  }
};

/**
 * Standard ANSI / IEEE Logic Gate Schematic Symbol
 */
const GateSymbol: React.FC<{ 
  type: GateType; 
  width: number; 
  height: number; 
  strokeColor?: string;
  inputCount: number;
}> = ({
  type,
  width,
  height,
  strokeColor = '#38bdf8',
  inputCount
}) => {
  const gw = 48;
  const gh = 36;
  const gx = (width - gw) / 2 + 2;
  const gy = (height - gh) / 2 + 8;
  const midY = gy + gh / 2;

  // Compute lead attachment points
  const inY0 = 28;
  const inY1 = inputCount > 1 ? height - 12 : 28 + (height - 40) / 2;

  return (
    <g>
      {/* Internal Lead Lines connecting ports to gate symbol */}
      {inputCount >= 1 && (
        <line x1="0" y1={inY0} x2={gx} y2={inY0} stroke="#64748b" strokeWidth="2" />
      )}
      {inputCount >= 2 && (
        <line x1="0" y1={inY1} x2={gx} y2={inY1} stroke="#64748b" strokeWidth="2" />
      )}
      {/* Output Lead Line from gate symbol tip to right port */}
      <line x1={gx + gw - 4} y1={midY} x2={width} y2={midY} stroke="#64748b" strokeWidth="2" />

      {/* Main ANSI/IEEE Symbol Body */}
      <g transform={`translate(${gx}, ${gy})`}>
        {type === 'AND' && (
          <path
            d="M 2 2 L 22 2 A 16 16 0 0 1 22 34 L 2 34 Z"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {type === 'NAND' && (
          <>
            <path
              d="M 2 2 L 20 2 A 16 16 0 0 1 20 34 L 2 34 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="39.5" cy="18" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          </>
        )}
        {type === 'OR' && (
          <path
            d="M 2 2 Q 13 18 2 34 Q 26 34 44 18 Q 26 2 2 2 Z"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {type === 'NOR' && (
          <>
            <path
              d="M 2 2 Q 13 18 2 34 Q 24 34 38 18 Q 24 2 2 2 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="42" cy="18" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          </>
        )}
        {type === 'XOR' && (
          <>
            <path
              d="M -4 2 Q 7 18 -4 34"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <path
              d="M 2 2 Q 13 18 2 34 Q 26 34 44 18 Q 26 2 2 2 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
          </>
        )}
        {type === 'XNOR' && (
          <>
            <path
              d="M -4 2 Q 7 18 -4 34"
              fill="none"
              stroke={strokeColor}
              strokeWidth="2.5"
            />
            <path
              d="M 2 2 Q 13 18 2 34 Q 24 34 38 18 Q 24 2 2 2 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="42" cy="18" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          </>
        )}
        {type === 'NOT' && (
          <>
            <path
              d="M 4 4 L 32 18 L 4 32 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <circle cx="36" cy="18" r="3.5" fill="#0f172a" stroke={strokeColor} strokeWidth="2" />
          </>
        )}
        {type === 'BUFFER' && (
          <path
            d="M 4 4 L 36 18 L 4 32 Z"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
      </g>
    </g>
  );
};

/**
 * Mini vector icon for toolbox buttons
 */
const MiniGateIcon: React.FC<{ type: GateType }> = ({ type }) => {
  switch (type) {
    case 'AND':
      return <path d="M 4 4 L 18 4 A 10 10 0 0 1 18 24 L 4 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case 'NAND':
      return (
        <>
          <path d="M 3 4 L 16 4 A 10 10 0 0 1 16 24 L 3 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="28" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'OR':
      return <path d="M 4 4 Q 10 14 4 24 Q 20 24 32 14 Q 20 4 4 4 Z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case 'NOR':
      return (
        <>
          <path d="M 3 4 Q 8 14 3 24 Q 16 24 26 14 Q 16 4 3 4 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'XOR':
      return (
        <>
          <path d="M 0 4 Q 5 14 0 24" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M 5 4 Q 11 14 5 24 Q 21 24 33 14 Q 21 4 5 4 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'XNOR':
      return (
        <>
          <path d="M 0 4 Q 5 14 0 24" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M 5 4 Q 10 14 5 24 Q 17 24 26 14 Q 17 4 5 4 Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="30" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'NOT':
      return (
        <>
          <path d="M 4 4 L 22 14 L 4 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="26" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'BUFFER':
      return <path d="M 4 4 L 26 14 L 4 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />;
    default:
      return null;
  }
};

export const CircuitEditorModule: React.FC<CircuitEditorProps> = ({
  initialCircuit,
  onSaveToVault,
}) => {
  // Active Circuit State
  const [circuit, setCircuit] = useState<Circuit>(() => {
    return initialCircuit || SAMPLE_CIRCUITS[0];
  });

  // Undo / Redo History
  const [history, setHistory] = useState<Circuit[]>([]);
  const [redoStack, setRedoStack] = useState<Circuit[]>([]);

  // Selection & Wiring State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<'SELECT' | 'WIRE'>('SELECT');
  
  // Wire creation state
  const [wireStart, setWireStart] = useState<{ nodeId: string; portIndex: number; type: 'input' | 'output' } | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portIndex: number; type: 'input' | 'output' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport & Pan / Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Truth Table Modal State
  const [showTruthTableModal, setShowTruthTableModal] = useState<boolean>(false);
  const [truthTableData, setTruthTableData] = useState<ReturnType<typeof generateCircuitTruthTable> | null>(null);

  // Clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  const pushHistory = useCallback((newCircuit: Circuit) => {
    setHistory(prev => [...prev.slice(-25), circuit]);
    setRedoStack([]);
    setCircuit(newCircuit);
  }, [circuit]);

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [...r, circuit]);
    setHistory(h => h.slice(0, -1));
    setCircuit(prev);
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, circuit]);
    setRedoStack(r => r.slice(0, -1));
    setCircuit(next);
  };

  // Run simulation whenever circuit nodes/wires change or when simulating
  const simResult = React.useMemo(() => {
    if (!isSimulating) return { nodes: circuit.nodes, wires: circuit.wires, isValid: true, errors: [], warnings: [], cyclesDetected: false };
    return simulateCircuit(circuit);
  }, [circuit, isSimulating]);

  // Keep internal circuit synchronized with simulated values
  useEffect(() => {
    if (!isSimulating) return;
    let hasDiff = false;

    for (const resNode of simResult.nodes) {
      const cur = circuit.nodes.find(n => n.id === resNode.id);
      if (cur) {
        for (let i = 0; i < resNode.outputs.length; i++) {
          if (cur.outputs[i]?.value !== resNode.outputs[i]?.value) {
            hasDiff = true;
            break;
          }
        }
      }
      if (hasDiff) break;
    }

    if (hasDiff) {
      setCircuit(prev => ({
        ...prev,
        nodes: simResult.nodes,
        wires: simResult.wires,
      }));
    }
  }, [simResult, isSimulating]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Keyboard shortcuts (Delete, Backspace, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireId) {
          e.preventDefault();
          pushHistory({
            ...circuit,
            wires: circuit.wires.filter(w => w.id !== selectedWireId),
          });
          setSelectedWireId(null);
          setToastMessage('Wire deleted.');
        } else if (selectedNodeId) {
          e.preventDefault();
          deleteSelected();
        }
      } else if (e.key === 'Escape') {
        setWireStart(null);
        setSelectedWireId(null);
        setSelectedNodeId(null);
        setToastMessage('Selection cleared.');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, selectedNodeId, circuit, pushHistory]);

  // Coordinates translation from viewport to canvas
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: clientX, y: clientY };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Handle Switch Toggle
  const toggleSwitch = (nodeId: string) => {
    const nextCircuit = {
      ...circuit,
      nodes: circuit.nodes.map(n => {
        if (n.id === nodeId && (n.type === 'SWITCH' || n.type === 'CLOCK')) {
          const nextVal = !n.state?.highValue;
          return {
            ...n,
            state: { ...n.state, highValue: nextVal },
            outputs: n.outputs.map(p => ({ ...p, value: (nextVal ? 1 : 0) as LogicValue })),
          };
        }
        return n;
      }),
    };
    pushHistory(nextCircuit);
  };

  // Add Component to Canvas
  const addComponent = (type: GateType) => {
    const id = `${type.toLowerCase()}_${Date.now().toString().slice(-4)}`;
    let inputs: CircuitNode['inputs'] = [];
    let outputs: CircuitNode['outputs'] = [];
    let label: string = type;
    let state: CircuitNode['state'] = undefined;

    switch (type) {
      case 'SWITCH':
        label = `SW_${circuit.nodes.filter(n => n.type === 'SWITCH').length + 1}`;
        outputs = [{ id: 'out_0', name: 'Q', type: 'output', value: 0 }];
        state = { highValue: false };
        break;
      case 'CLOCK':
        label = 'CLK';
        outputs = [{ id: 'out_0', name: 'CLK', type: 'output', value: 0 }];
        state = { highValue: false };
        break;
      case 'LED':
        label = `LED_${circuit.nodes.filter(n => n.type === 'LED').length + 1}`;
        inputs = [{ id: 'in_0', name: 'In', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: 'Val', type: 'output', value: 0 }];
        break;
      case 'NOT':
      case 'BUFFER':
        inputs = [{ id: 'in_0', name: 'A', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 1 }];
        break;
      case 'SR_FF':
        label = 'SR Flip-Flop';
        inputs = [
          { id: 'in_0', name: 'S', type: 'input', value: 0 },
          { id: 'in_1', name: 'R', type: 'input', value: 0 },
          { id: 'in_2', name: 'CLK', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q', type: 'output', value: 0 },
          { id: 'out_1', name: "Q'", type: 'output', value: 1 },
        ];
        state = { q: 0, qBar: 1, prevClock: 0 };
        break;
      case 'D_FF':
        label = 'D Flip-Flop';
        inputs = [
          { id: 'in_0', name: 'D', type: 'input', value: 0 },
          { id: 'in_1', name: 'CLK', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q', type: 'output', value: 0 },
          { id: 'out_1', name: "Q'", type: 'output', value: 1 },
        ];
        state = { q: 0, qBar: 1, prevClock: 0 };
        break;
      case 'JK_FF':
        label = 'JK Flip-Flop';
        inputs = [
          { id: 'in_0', name: 'J', type: 'input', value: 0 },
          { id: 'in_1', name: 'K', type: 'input', value: 0 },
          { id: 'in_2', name: 'CLK', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q', type: 'output', value: 0 },
          { id: 'out_1', name: "Q'", type: 'output', value: 1 },
        ];
        state = { q: 0, qBar: 1, prevClock: 0 };
        break;
      default:
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }];
        break;
    }

    const newNode: CircuitNode = {
      id,
      type,
      label,
      x: 180 - pan.x / zoom,
      y: 100 + (circuit.nodes.length % 5) * 60 - pan.y / zoom,
      inputs,
      outputs,
      state,
    };

    pushHistory({
      ...circuit,
      nodes: [...circuit.nodes, newNode],
    });
    setSelectedNodeId(newNode.id);
    setSelectedWireId(null);
    setToastMessage(`Added ${label} to canvas.`);
  };

  // Delete Selected Node
  const deleteSelected = () => {
    if (!selectedNodeId) return;
    const nextCircuit = {
      ...circuit,
      nodes: circuit.nodes.filter(n => n.id !== selectedNodeId),
      wires: circuit.wires.filter(w => w.fromNodeId !== selectedNodeId && w.toNodeId !== selectedNodeId),
    };
    pushHistory(nextCircuit);
    setSelectedNodeId(null);
    setToastMessage('Component deleted.');
  };

  // Duplicate Selected Node
  const duplicateSelected = () => {
    if (!selectedNodeId) return;
    const target = circuit.nodes.find(n => n.id === selectedNodeId);
    if (!target) return;

    const copyNode: CircuitNode = {
      ...target,
      id: `${target.type.toLowerCase()}_${Date.now().toString().slice(-4)}`,
      label: `${target.label} (Copy)`,
      x: target.x + 40,
      y: target.y + 40,
      inputs: target.inputs.map(p => ({ ...p })),
      outputs: target.outputs.map(p => ({ ...p })),
      state: target.state ? { ...target.state } : undefined,
    };

    pushHistory({
      ...circuit,
      nodes: [...circuit.nodes, copyNode],
    });
    setSelectedNodeId(copyNode.id);
    setToastMessage(`Duplicated ${target.label}.`);
  };

  // Bidirectional Port MouseDown: initiates wire connection without dragging parent node
  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, portIndex: number, type: 'input' | 'output') => {
    e.stopPropagation(); // CRITICAL: Stop propagation so component doesn't drag

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (!wireStart) {
      setWireStart({ nodeId, portIndex, type });
      setEditorMode('WIRE');
    }
  };

  // Bidirectional Port MouseUp / Click: completes wire connection
  const handlePortClickOrUp = (e: React.MouseEvent, targetNodeId: string, targetPortIndex: number, targetType: 'input' | 'output') => {
    e.stopPropagation();

    // If no wire started yet, start one from this port!
    if (!wireStart) {
      setWireStart({ nodeId: targetNodeId, portIndex: targetPortIndex, type: targetType });
      setEditorMode('WIRE');
      const startNode = circuit.nodes.find(n => n.id === targetNodeId);
      setToastMessage(`Started wire from ${startNode?.label || targetNodeId}. Click or drop on any ${targetType === 'output' ? 'INPUT' : 'OUTPUT'} pin to connect.`);
      return;
    }

    // Cancel if clicked exact same port
    if (wireStart.nodeId === targetNodeId && wireStart.portIndex === targetPortIndex && wireStart.type === targetType) {
      setWireStart(null);
      setToastMessage('Wiring cancelled.');
      return;
    }

    // Validate: must connect an OUTPUT to an INPUT
    if (wireStart.type === targetType) {
      setToastMessage(`Cannot connect ${targetType.toUpperCase()} to ${targetType.toUpperCase()}. Please connect an OUTPUT pin to an INPUT pin.`);
      return;
    }

    const fromNodeId = wireStart.type === 'output' ? wireStart.nodeId : targetNodeId;
    const fromPortIndex = wireStart.type === 'output' ? wireStart.portIndex : targetPortIndex;
    const toNodeId = wireStart.type === 'input' ? wireStart.nodeId : targetNodeId;
    const toPortIndex = wireStart.type === 'input' ? wireStart.portIndex : targetPortIndex;

    const fromNode = circuit.nodes.find(n => n.id === fromNodeId);
    const toNode = circuit.nodes.find(n => n.id === toNodeId);

    // Replace wire if one already connects to this destination port
    const existingIdx = circuit.wires.findIndex(
      w => w.toNodeId === toNodeId && w.toPortIndex === toPortIndex
    );

    const newWire: Wire = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fromNodeId,
      fromPortIndex,
      toNodeId,
      toPortIndex,
      value: 0,
    };

    let updatedWires = [...circuit.wires];
    if (existingIdx >= 0) {
      updatedWires[existingIdx] = newWire;
    } else {
      updatedWires.push(newWire);
    }

    pushHistory({
      ...circuit,
      wires: updatedWires,
    });

    setWireStart(null);
    setHoveredPort(null);
    setToastMessage(`Wire connected: ${fromNode?.label || 'Out'} → ${toNode?.label || 'In'}`);
  };

  // Canvas Mouse events for Dragging & Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || (editorMode === 'SELECT' && e.target === svgRef.current)) {
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (isPanning) {
      setPan({
        x: e.clientX - startPanMouse.x,
        y: e.clientY - startPanMouse.y,
      });
      return;
    }

    if (draggingNodeId) {
      setCircuit(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => {
          if (n.id === draggingNodeId) {
            return {
              ...n,
              x: Math.max(20, Math.round((e.clientX - dragOffset.x) / 10) * 10),
              y: Math.max(20, Math.round((e.clientY - dragOffset.y) / 10) * 10),
            };
          }
          return n;
        }),
      }));
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushHistory(circuit);
    }
  };

  // Canvas background click clears selection and wire-start
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === svgRef.current) {
      if (wireStart) {
        setWireStart(null);
        setToastMessage('Wiring cancelled.');
      }
      setSelectedNodeId(null);
      setSelectedWireId(null);
    }
  };

  // Start Node Dragging
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedWireId(null);
    const node = circuit.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDraggingNodeId(nodeId);
    setDragOffset({
      x: e.clientX - node.x,
      y: e.clientY - node.y,
    });
  };

  // Save current circuit to storage
  const handleSaveCircuit = () => {
    saveProject(circuit);
    if (onSaveToVault) onSaveToVault(circuit);
    setToastMessage(`Project "${circuit.name}" saved to local storage!`);
  };

  // Clear Canvas
  const handleClearCircuit = () => {
    pushHistory({
      ...circuit,
      nodes: [],
      wires: [],
    });
    setSelectedNodeId(null);
    setSelectedWireId(null);
    setShowClearConfirm(false);
    setToastMessage('Circuit cleared.');
  };

  // Generate Truth Table
  const handleOpenTruthTable = () => {
    const res = generateCircuitTruthTable(circuit);
    setTruthTableData(res);
    setShowTruthTableModal(true);
  };

  // Export SVG
  const handleExportSVG = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${circuit.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToastMessage('Circuit diagram exported as SVG!');
  };

  const selectedNode = circuit.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-xl bg-slate-900 border border-emerald-500/50 text-emerald-400 px-4 py-2.5 text-xs font-bold shadow-2xl flex items-center gap-2.5 backdrop-blur-md animate-in fade-in slide-in-from-top-2">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-1 text-slate-400 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-4 py-2 z-20">
        {/* Left: Circuit Info & Controls */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={circuit.name}
            onChange={e => setCircuit({ ...circuit, name: e.target.value })}
            className="rounded bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-white border border-slate-700 focus:border-emerald-500 focus:outline-none w-44 sm:w-56"
            placeholder="Circuit Name..."
          />

          {/* Simulation Toggle */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              isSimulating
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isSimulating ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{isSimulating ? 'Simulating' : 'Paused'}</span>
          </button>

          {/* Single Step Trigger */}
          <button
            onClick={() => {
              setCircuit(prev => {
                const nextNodes = prev.nodes.map(n => {
                  if (n.type === 'CLOCK') {
                    const nextVal = !n.state?.highValue;
                    return {
                      ...n,
                      state: { ...n.state, highValue: nextVal },
                      outputs: [{ ...n.outputs[0], value: (nextVal ? 1 : 0) as LogicValue }],
                    };
                  }
                  return n;
                });
                return { ...prev, nodes: nextNodes };
              });
            }}
            title="Single Clock Step"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>

        {/* Center: Tools (Select, Wire, Undo, Redo, Zoom) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setEditorMode('SELECT'); setWireStart(null); }}
            title="Select & Move Mode"
            className={`rounded-lg p-2 text-xs transition-colors ${
              editorMode === 'SELECT'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <MousePointer className="h-4 w-4" />
          </button>

          <button
            onClick={() => setEditorMode('WIRE')}
            title="Wire Mode (Click or drag between any output & input pins)"
            className={`rounded-lg p-2 text-xs transition-colors ${
              editorMode === 'WIRE'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Cable className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={undo}
            disabled={history.length === 0}
            title="Undo (Ctrl+Z)"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo (Ctrl+Y)"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-30"
          >
            <Redo2 className="h-4 w-4" />
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1" />

          <button
            onClick={() => setZoom(z => Math.max(0.4, z - 0.1))}
            title="Zoom Out"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[10px] font-mono text-slate-400 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(z => Math.min(2.5, z + 0.1))}
            title="Zoom In"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
            title="Reset Pan & Zoom"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>

        {/* Right: Actions (Truth Table, Save, Export, Clear) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleOpenTruthTable}
            title="Generate Automatic Truth Table"
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-emerald-400 border border-slate-700 transition-colors"
          >
            <Table className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Truth Table</span>
          </button>

          <button
            onClick={handleSaveCircuit}
            title="Save Project to Browser Storage"
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleExportSVG}
            title="Export Vector SVG"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={() => exportProjectAsDigitalXML(circuit)}
            title="Export as HNeemann Digital XML (.dig)"
            className="flex items-center gap-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-2 py-1.5 text-xs font-mono font-bold text-cyan-400 border border-slate-700 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>.dig</span>
          </button>

          <button
            onClick={() => setShowClearConfirm(true)}
            title="Clear Entire Circuit"
            className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Palette + Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Component Palette (Left Panel) */}
        <div className="w-60 border-r border-slate-800 bg-slate-900/95 p-3 overflow-y-auto space-y-4 shrink-0 hidden md:block z-10 shadow-xl">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Inputs & Clock</span>
              <span className="text-[9px] text-slate-600">Signal Sources</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => addComponent('SWITCH')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all hover:border-emerald-500/50"
              >
                <div className="w-5 h-3 rounded-full bg-emerald-500/40 border border-emerald-400 flex items-center px-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold leading-tight">Switch</div>
                  <div className="text-[9px] text-slate-400 leading-tight">Toggle Input</div>
                </div>
              </button>

              <button
                onClick={() => addComponent('CLOCK')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all hover:border-cyan-500/50"
              >
                <div className="w-5 h-3 rounded bg-cyan-500/30 border border-cyan-400 flex items-center justify-center font-mono text-[8px] text-cyan-300 font-bold">
                  ~
                </div>
                <div className="text-left">
                  <div className="text-white font-bold leading-tight">Clock</div>
                  <div className="text-[9px] text-slate-400 leading-tight">Pulse Generator</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Standard Logic Gates</span>
              <span className="text-[9px] text-slate-600">IEEE Symbols</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'] as GateType[]).map(gate => (
                <button
                  key={gate}
                  onClick={() => addComponent(gate)}
                  className="flex items-center gap-2 py-2 px-2.5 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-bold transition-all hover:border-cyan-400/50 group"
                >
                  <svg width="24" height="18" viewBox="0 0 36 28" className="shrink-0 text-cyan-400 group-hover:scale-110 transition-transform">
                    <MiniGateIcon type={gate} />
                  </svg>
                  <span>{gate}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Flip-Flops & Storage</span>
              <span className="text-[9px] text-slate-600">Sequential</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {(['D_FF', 'JK_FF', 'T_FF', 'SR_FF'] as GateType[]).map(ff => (
                <button
                  key={ff}
                  onClick={() => addComponent(ff)}
                  className="flex items-center justify-center py-2 px-1 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-purple-300 border border-slate-700/80 text-xs font-bold transition-all hover:border-purple-400/50"
                >
                  {ff.replace('_FF', ' FF')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Output Probes</span>
              <span className="text-[9px] text-slate-600">Display</span>
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => addComponent('LED')}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-all hover:border-emerald-500/50"
              >
                <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50 shrink-0" />
                <div className="text-left">
                  <div className="text-white font-bold leading-tight">LED</div>
                  <div className="text-[9px] text-slate-400 leading-tight">Probe</div>
                </div>
              </button>
            </div>
          </div>

          {/* Sample Preset Circuits */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Presets
            </h4>
            <div className="space-y-1">
              {SAMPLE_CIRCUITS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => pushHistory(sample)}
                  className="w-full text-left truncate px-2 py-1.5 text-xs text-slate-300 hover:text-emerald-400 hover:bg-slate-800/80 rounded transition-colors"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central SVG Interactive Canvas */}
        <div 
          className="flex-1 relative h-full circuit-grid overflow-hidden select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {/* Diagnostic Warnings Banner */}
          {simResult.warnings.length > 0 && (
            <div className="absolute top-2 left-4 right-4 z-10 rounded-lg bg-amber-500/15 border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300 flex items-center justify-between shadow-lg backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                <span className="truncate">{simResult.warnings[0]}</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 shrink-0">
                {simResult.warnings.length} warning(s)
              </span>
            </div>
          )}

          {/* Wire Mode In-Progress Floating Banner */}
          {wireStart && (
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 rounded-full bg-emerald-500 text-slate-950 font-bold px-5 py-2 text-xs shadow-2xl flex items-center gap-2.5 animate-bounce">
              <Cable className="h-4 w-4" />
              <span>
                Wiring from {circuit.nodes.find(n => n.id === wireStart.nodeId)?.label} ({wireStart.type.toUpperCase()}) — Click or drop on any {wireStart.type === 'output' ? 'INPUT' : 'OUTPUT'} pin
              </span>
              <button 
                onClick={e => {
                  e.stopPropagation();
                  setWireStart(null);
                  setToastMessage('Wiring cancelled.');
                }}
                className="ml-3 px-2 py-0.5 rounded-full bg-slate-900/20 hover:bg-slate-900/40 text-[10px] font-bold text-slate-950"
              >
                Cancel (Esc)
              </button>
            </div>
          )}

          {/* Main SVG Render Surface */}
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Existing Circuit Wires */}
            {simResult.wires.map(wire => {
              const fromNode = simResult.nodes.find(n => n.id === wire.fromNodeId);
              const toNode = simResult.nodes.find(n => n.id === wire.toNodeId);
              if (!fromNode || !toNode) return null;

              const p1 = getPortCoordinates(fromNode, wire.fromPortIndex, 'output');
              const p2 = getPortCoordinates(toNode, wire.toPortIndex, 'input');

              const dx = Math.max(35, Math.abs(p2.x - p1.x) * 0.5);
              const pathD = `M ${p1.x} ${p1.y} C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;

              const isSelected = selectedWireId === wire.id;
              const isHigh = wire.value === 1;
              const isUndefined = wire.value === 'X' || wire.value === 'Z';
              const strokeColor = isSelected
                ? '#f59e0b'
                : isHigh
                ? '#10b981'
                : isUndefined
                ? '#eab308'
                : '#475569';

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g key={wire.id} className="group">
                  {/* Invisible wide stroke for easy clicking/selection */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="20"
                    className="cursor-pointer"
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                      setSelectedNodeId(null);
                      setToastMessage('Wire selected. Press Delete or click (X) to delete.');
                    }}
                  />

                  {/* Wire Glowing Halo */}
                  {(isSelected || isHigh) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={isSelected ? '#f59e0b' : '#10b981'}
                      strokeWidth={isSelected ? '8' : '6'}
                      strokeOpacity={isSelected ? 0.4 : 0.25}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Wire Vector Line */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '4' : '3'}
                    strokeDasharray={isUndefined ? '4' : undefined}
                    strokeLinecap="round"
                    className={isHigh ? 'wire-high' : undefined}
                  />

                  {/* Signal Indicator Bead */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r="4"
                    fill={strokeColor}
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />

                  {/* Red Delete Button on Selected Wire */}
                  {isSelected && (
                    <g
                      transform={`translate(${midX}, ${midY})`}
                      className="cursor-pointer"
                      onClick={e => {
                        e.stopPropagation();
                        pushHistory({
                          ...circuit,
                          wires: circuit.wires.filter(w => w.id !== wire.id),
                        });
                        setSelectedWireId(null);
                        setToastMessage('Wire deleted.');
                      }}
                    >
                      <circle r="10" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        ✕
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Live Animated Rubberband Wire while Connecting */}
            {wireStart && (() => {
              const startNode = simResult.nodes.find(n => n.id === wireStart.nodeId);
              if (!startNode) return null;
              const p1 = getPortCoordinates(startNode, wireStart.portIndex, wireStart.type);

              let targetX = mousePos.x;
              let targetY = mousePos.y;

              if (hoveredPort) {
                const hoverNode = simResult.nodes.find(n => n.id === hoveredPort.nodeId);
                if (hoverNode) {
                  const pTarget = getPortCoordinates(hoverNode, hoveredPort.portIndex, hoveredPort.type);
                  targetX = pTarget.x;
                  targetY = pTarget.y;
                }
              }

              const isOutputStart = wireStart.type === 'output';
              const startX = isOutputStart ? p1.x : targetX;
              const startY = isOutputStart ? p1.y : targetY;
              const endX = isOutputStart ? targetX : p1.x;
              const endY = isOutputStart ? targetY : p1.y;

              const dx = Math.max(30, Math.abs(endX - startX) * 0.5);
              const rubberPath = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;

              return (
                <g className="pointer-events-none">
                  {/* Outer Glow Halo */}
                  <path
                    d={rubberPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                  />
                  {/* Animated Dashed Wire */}
                  <path
                    d={rubberPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  {/* Cursor Bead */}
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r="6.5"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="2"
                  />
                </g>
              );
            })()}

            {/* Circuit Nodes */}
            {simResult.nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isGate = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'].includes(node.type);
              const isSwitch = node.type === 'SWITCH' || node.type === 'CLOCK';
              const isLed = node.type === 'LED';
              const isFF = node.type.endsWith('_FF');
              const { width, height } = getNodeDimensions(node);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => handleNodeDragStart(e, node.id)}
                  className="cursor-move group"
                >
                  {/* Node Background Enclosure */}
                  <rect
                    width={width}
                    height={height}
                    rx="8"
                    fill="#1e293b"
                    stroke={isSelected ? '#10b981' : isFF ? '#6b21a8' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    filter={isSelected ? 'drop-shadow(0 0 10px rgba(16, 185, 129, 0.35))' : undefined}
                    className="transition-colors shadow-xl"
                  />

                  {/* Component Header / Label */}
                  <text
                    x={width / 2}
                    y="16"
                    fill="#94a3b8"
                    fontSize="9.5"
                    fontWeight="bold"
                    textAnchor="middle"
                    className="select-none tracking-wide"
                  >
                    {node.label || node.type}
                  </text>

                  {/* IEEE / ANSI Logic Gate Symbol Rendered in Center */}
                  {isGate && (
                    <GateSymbol
                      type={node.type}
                      width={width}
                      height={height}
                      strokeColor={isSelected ? '#34d399' : '#38bdf8'}
                      inputCount={node.inputs.length}
                    />
                  )}

                  {/* Interactive Switch Widget */}
                  {isSwitch && (
                    <g
                      onClick={e => {
                        e.stopPropagation();
                        toggleSwitch(node.id);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="24"
                        y="26"
                        width="52"
                        height="24"
                        rx="12"
                        fill={node.state?.highValue ? '#10b981' : '#334155'}
                        className="transition-colors"
                      />
                      <circle
                        cx={node.state?.highValue ? '62' : '36'}
                        cy="38"
                        r="9"
                        fill="#ffffff"
                        filter="drop-shadow(0 1px 3px rgba(0,0,0,0.5))"
                        className="transition-all"
                      />
                      <text
                        x="50"
                        y="66"
                        fill={node.state?.highValue ? '#10b981' : '#64748b'}
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.state?.highValue ? '1 (HIGH)' : '0 (LOW)'}
                      </text>
                    </g>
                  )}

                  {/* Interactive LED Indicator Lamp */}
                  {isLed && (
                    <g>
                      <circle
                        cx={width / 2}
                        cy="42"
                        r="16"
                        fill={node.inputs[0]?.value === 1 ? '#10b981' : '#1e293b'}
                        stroke={node.inputs[0]?.value === 1 ? '#34d399' : '#475569'}
                        strokeWidth="3"
                        filter={node.inputs[0]?.value === 1 ? 'drop-shadow(0 0 10px #10b981)' : undefined}
                      />
                      <text
                        x={width / 2}
                        y="46"
                        fill={node.inputs[0]?.value === 1 ? '#ffffff' : '#64748b'}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.inputs[0]?.value === 1 ? '1' : '0'}
                      </text>
                    </g>
                  )}

                  {/* Flip-Flop Clock Wedge Graphic */}
                  {isFF && (
                    <g>
                      {/* Dynamic clock triangle on CLK input pin */}
                      <path d="M 0 66 L 8 70 L 0 74 Z" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
                    </g>
                  )}

                  {/* Input Ports (Left Pins) */}
                  {node.inputs.map((port, pIdx) => {
                    const portCoord = getPortCoordinates(node, pIdx, 'input');
                    const localX = portCoord.x - node.x;
                    const localY = portCoord.y - node.y;
                    const pVal = port.value;
                    const pColor = pVal === 1 ? '#10b981' : pVal === 0 ? '#64748b' : '#eab308';
                    const isHovered = hoveredPort?.nodeId === node.id && hoveredPort?.portIndex === pIdx && hoveredPort?.type === 'input';
                    const isStart = wireStart?.nodeId === node.id && wireStart?.portIndex === pIdx && wireStart?.type === 'input';

                    return (
                      <g key={port.id} className="group">
                        {/* Glowing Aura Ring when hovered or active */}
                        {(isHovered || isStart) && (
                          <circle
                            cx={localX}
                            cy={localY}
                            r="10"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            className="animate-ping opacity-75"
                          />
                        )}

                        {/* Visible Pin Circle */}
                        <circle
                          cx={localX}
                          cy={localY}
                          r={isHovered ? 6 : 4.5}
                          fill={pColor}
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="transition-all"
                        />

                        {/* Port Label */}
                        <text
                          x={localX + 8}
                          y={localY + 3.5}
                          fill="#94a3b8"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          {port.name || `In${pIdx + 1}`}
                        </text>

                        {/* Large Transparent Hit Circle for effortless click / touch */}
                        <circle
                          cx={localX}
                          cy={localY}
                          r="16"
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseDown={e => handlePortMouseDown(e, node.id, pIdx, 'input')}
                          onMouseUp={e => handlePortClickOrUp(e, node.id, pIdx, 'input')}
                          onClick={e => handlePortClickOrUp(e, node.id, pIdx, 'input')}
                          onMouseEnter={() => setHoveredPort({ nodeId: node.id, portIndex: pIdx, type: 'input' })}
                          onMouseLeave={() => setHoveredPort(null)}
                        />
                      </g>
                    );
                  })}

                  {/* Output Ports (Right Pins) */}
                  {node.outputs.map((port, pIdx) => {
                    const portCoord = getPortCoordinates(node, pIdx, 'output');
                    const localX = portCoord.x - node.x;
                    const localY = portCoord.y - node.y;
                    const pVal = port.value;
                    const pColor = pVal === 1 ? '#10b981' : pVal === 0 ? '#64748b' : '#eab308';
                    const isHovered = hoveredPort?.nodeId === node.id && hoveredPort?.portIndex === pIdx && hoveredPort?.type === 'output';
                    const isStart = wireStart?.nodeId === node.id && wireStart?.portIndex === pIdx && wireStart?.type === 'output';

                    return (
                      <g key={port.id} className="group">
                        {/* Glowing Aura Ring when hovered or active */}
                        {(isHovered || isStart) && (
                          <circle
                            cx={localX}
                            cy={localY}
                            r="10"
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            className="animate-ping opacity-75"
                          />
                        )}

                        {/* Visible Pin Circle */}
                        <circle
                          cx={localX}
                          cy={localY}
                          r={isHovered ? 6 : 4.5}
                          fill={pColor}
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="transition-all"
                        />

                        {/* Port Label */}
                        <text
                          x={localX - 8}
                          y={localY + 3.5}
                          fill="#94a3b8"
                          fontSize="8.5"
                          fontFamily="monospace"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {port.name || 'Out'}
                        </text>

                        {/* Large Transparent Hit Circle for effortless click / touch */}
                        <circle
                          cx={localX}
                          cy={localY}
                          r="16"
                          fill="transparent"
                          className="cursor-crosshair"
                          onMouseDown={e => handlePortMouseDown(e, node.id, pIdx, 'output')}
                          onMouseUp={e => handlePortClickOrUp(e, node.id, pIdx, 'output')}
                          onClick={e => handlePortClickOrUp(e, node.id, pIdx, 'output')}
                          onMouseEnter={() => setHoveredPort({ nodeId: node.id, portIndex: pIdx, type: 'output' })}
                          onMouseLeave={() => setHoveredPort(null)}
                        />
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Component Inspector (Right Panel) */}
        {selectedNode && (
          <div className="w-64 border-l border-slate-800 bg-slate-900/95 p-4 overflow-y-auto space-y-4 shrink-0 z-10 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Component Properties
              </h4>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-xs text-slate-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 uppercase font-semibold">Label</label>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={e => {
                    const newLabel = e.target.value;
                    setCircuit(prev => ({
                      ...prev,
                      nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, label: newLabel } : n),
                    }));
                  }}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Type:</span>
                <span className="font-bold text-emerald-400">{selectedNode.type}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Coordinates:</span>
                <span className="font-mono text-slate-300">X: {selectedNode.x}, Y: {selectedNode.y}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Ports:</span>
                <span className="font-mono text-slate-300">{selectedNode.inputs.length} In / {selectedNode.outputs.length} Out</span>
              </div>

              {/* Action Buttons for selected node */}
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                <button
                  onClick={duplicateSelected}
                  className="flex items-center justify-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </button>
                <button
                  onClick={deleteSelected}
                  className="flex items-center justify-center gap-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-1.5 text-xs font-semibold transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Component</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Component Add Drawer (Horizontal bottom bar for mobile screens) */}
      <div className="md:hidden flex items-center gap-2 p-2 border-t border-slate-800 bg-slate-900 overflow-x-auto">
        <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Add:</span>
        {(['SWITCH', 'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'LED'] as GateType[]).map(g => (
          <button
            key={g}
            onClick={() => addComponent(g)}
            className="px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-bold shrink-0 border border-slate-700"
          >
            {g}
          </button>
        ))}
      </div>

      {/* Truth Table Generator Modal */}
      {showTruthTableModal && truthTableData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-2xl w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Table className="h-4 w-4 text-emerald-400" />
                  <span>Automatic Truth Table for "{circuit.name}"</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Evaluated using the live deterministic simulation engine across all 2ⁿ states
                </p>
              </div>
              <button
                onClick={() => setShowTruthTableModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {truthTableData.success && truthTableData.data ? (
              <div className="space-y-4">
                <div className="max-h-80 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-slate-800 text-slate-300 border-b border-slate-700">
                      <tr>
                        {truthTableData.data.inputNames.map(name => (
                          <th key={name} className="p-2.5 text-center">{name}</th>
                        ))}
                        {truthTableData.data.outputNames.map(name => (
                          <th key={name} className="p-2.5 text-center text-emerald-400 font-bold">{name}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {truthTableData.data.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {truthTableData.data!.inputNames.map(name => (
                            <td key={name} className="p-2 text-center text-slate-300">
                              {row.inputs[name]}
                            </td>
                          ))}
                          {truthTableData.data!.outputNames.map(name => (
                            <td key={name} className="p-2 text-center font-bold">
                              <span className={`px-2 py-0.5 rounded ${
                                row.outputs[name] === 1
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                                  : 'text-slate-400'
                              }`}>
                                {row.outputs[name]}
                              </span>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Total: {truthTableData.data.rows.length} rows
                  </span>
                  <button
                    onClick={() => {
                      const csv = truthTableToCSV(truthTableData.data!);
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = `${circuit.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_truthtable.csv`;
                      link.click();
                    }}
                    className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-xs font-bold text-white shadow transition-colors"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-300">
                {truthTableData.error || 'Could not generate truth table. Ensure circuit has input switches and output LEDs.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Clear Circuit Canvas?</h3>
            <p className="text-xs text-slate-300">
              This will remove all components and wires from the current editor. You can still undo this action.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearCircuit}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
              >
                Clear Canvas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
