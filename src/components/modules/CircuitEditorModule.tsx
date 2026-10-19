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
import { saveProject } from '../../engine/storage/projectStore';
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
  FolderOpen
} from 'lucide-react';

interface CircuitEditorProps {
  initialCircuit?: Circuit;
  onSaveToVault?: (circuit: Circuit) => void;
}

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

  // Editor Interaction State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<'SELECT' | 'WIRE'>('SELECT');
  const [wireStart, setWireStart] = useState<{ nodeId: string; portIndex: number; type: 'output' } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Truth Table Modal State
  const [showTruthTableModal, setShowTruthTableModal] = useState<boolean>(false);
  const [truthTableData, setTruthTableData] = useState<ReturnType<typeof generateCircuitTruthTable> | null>(null);

  // Clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Save notification toast
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

    // Check if any output values changed
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
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
        // 2-input gate (AND, OR, NAND, NOR, XOR, XNOR)
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }];
        break;
    }

    // Position node nicely on screen center
    const newNode: CircuitNode = {
      id,
      type,
      label,
      x: 150 - pan.x / zoom,
      y: 120 + (circuit.nodes.length % 5) * 60 - pan.y / zoom,
      inputs,
      outputs,
      state,
    };

    pushHistory({
      ...circuit,
      nodes: [...circuit.nodes, newNode],
    });
    setSelectedNodeId(newNode.id);
  };

  // Delete Selected Node or Wire
  const deleteSelected = () => {
    if (!selectedNodeId) return;
    const nextCircuit = {
      ...circuit,
      nodes: circuit.nodes.filter(n => n.id !== selectedNodeId),
      wires: circuit.wires.filter(w => w.fromNodeId !== selectedNodeId && w.toNodeId !== selectedNodeId),
    };
    pushHistory(nextCircuit);
    setSelectedNodeId(null);
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
  };

  // Handle Port Click to create Wire
  const handlePortClick = (nodeId: string, portIndex: number, type: 'input' | 'output') => {
    if (type === 'output') {
      // Begin wire connection
      setWireStart({ nodeId, portIndex, type });
      setEditorMode('WIRE');
    } else if (type === 'input') {
      // Finish wire connection
      if (!wireStart) {
        setToastMessage('Click an OUTPUT port first, then connect to this input.');
        return;
      }

      // Prevent connecting node to itself directly if unwanted or validate connection
      if (wireStart.nodeId === nodeId) {
        setToastMessage('Warning: Direct feedback connection to same component.');
      }

      // Check if wire already exists to this exact destination port
      const existingIdx = circuit.wires.findIndex(
        w => w.toNodeId === nodeId && w.toPortIndex === portIndex
      );

      const newWire: Wire = {
        id: `w_${Date.now()}`,
        fromNodeId: wireStart.nodeId,
        fromPortIndex: wireStart.portIndex,
        toNodeId: nodeId,
        toPortIndex: portIndex,
        value: 0,
      };

      let updatedWires = [...circuit.wires];
      if (existingIdx >= 0) {
        // Replace existing wire on destination port
        updatedWires[existingIdx] = newWire;
      } else {
        updatedWires.push(newWire);
      }

      pushHistory({
        ...circuit,
        wires: updatedWires,
      });

      setWireStart(null);
      setEditorMode('SELECT');
      setToastMessage('Wire connected successfully!');
    }
  };

  // Canvas Mouse / Touch events for Dragging & Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || editorMode === 'SELECT' && e.target === svgRef.current) {
      // Middle click or canvas background drag initiates panning
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
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

  // Start Node Dragging
  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
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

  // Selected Node Details
  const selectedNode = circuit.nodes.find(n => n.id === selectedNodeId);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-emerald-500/95 text-slate-950 px-4 py-2 text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2 z-20">
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              isSimulating
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
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
            title="Connect Wires (Click output, then click input)"
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
            title="Undo"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
          >
            <Undo2 className="h-4 w-4" />
          </button>

          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            title="Redo"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 disabled:opacity-40"
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
            title="Fit to Screen / Reset View"
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
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600/80 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
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
            onClick={() => setShowClearConfirm(true)}
            title="Clear Entire Circuit"
            className="rounded-lg p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace: Left Component Palette + Center SVG Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Component Palette (Left Panel) */}
        <div className="w-56 border-r border-slate-800 bg-slate-900/90 p-3 overflow-y-auto space-y-4 shrink-0 hidden md:block z-10">
          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Inputs & Clocks
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => addComponent('SWITCH')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              >
                <span className="text-emerald-400 font-bold">SW</span>
                <span className="text-[10px] text-slate-400">Switch</span>
              </button>
              <button
                onClick={() => addComponent('CLOCK')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              >
                <span className="text-cyan-400 font-bold">CLK</span>
                <span className="text-[10px] text-slate-400">Clock</span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Standard Logic Gates
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {(['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER'] as GateType[]).map(gate => (
                <button
                  key={gate}
                  onClick={() => addComponent(gate)}
                  className="flex items-center justify-center py-2 px-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-xs font-bold transition-colors"
                >
                  {gate}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Flip-Flops & Storage
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              {(['D_FF', 'JK_FF', 'T_FF', 'SR_FF'] as GateType[]).map(ff => (
                <button
                  key={ff}
                  onClick={() => addComponent(ff)}
                  className="flex items-center justify-center py-2 px-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-purple-300 border border-slate-700/80 text-xs font-bold transition-colors"
                >
                  {ff.replace('_FF', ' FF')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Output Probes
            </h4>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => addComponent('LED')}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-medium transition-colors"
              >
                <span className="text-amber-400 font-bold">LED</span>
                <span className="text-[10px] text-slate-400">Indicator</span>
              </button>
            </div>
          </div>

          {/* Sample Preset loader shortcut */}
          <div className="pt-2 border-t border-slate-800">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Presets
            </h4>
            <div className="space-y-1">
              {SAMPLE_CIRCUITS.map(sample => (
                <button
                  key={sample.id}
                  onClick={() => pushHistory(sample)}
                  className="w-full text-left truncate px-2 py-1 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded transition-colors"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Central SVG Interactive Canvas */}
        <div 
          className="flex-1 relative h-full circuit-grid overflow-hidden cursor-crosshair select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
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

          {/* Wire Mode Notice */}
          {wireStart && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full bg-emerald-500/90 text-slate-950 font-bold px-4 py-1.5 text-xs shadow-lg flex items-center gap-2">
              <Cable className="h-3.5 w-3.5" />
              <span>Wiring: Click any destination INPUT port to complete wire.</span>
              <button 
                onClick={() => setWireStart(null)}
                className="ml-2 underline text-[10px]"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Main SVG Render Surface */}
          <svg
            ref={svgRef}
            className="w-full h-full"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Wires */}
            {simResult.wires.map(wire => {
              const fromNode = simResult.nodes.find(n => n.id === wire.fromNodeId);
              const toNode = simResult.nodes.find(n => n.id === wire.toNodeId);
              if (!fromNode || !toNode) return null;

              // Output port position
              const x1 = fromNode.x + 90;
              const y1 = fromNode.y + 24 + wire.fromPortIndex * 18;

              // Input port position
              const x2 = toNode.x;
              const y2 = toNode.y + 24 + wire.toPortIndex * 18;

              // Curved Bezier Wire
              const dx = Math.abs(x2 - x1) * 0.5;
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const isHigh = wire.value === 1;
              const isUndefined = wire.value === 'X' || wire.value === 'Z';
              const strokeColor = isHigh ? '#10b981' : isUndefined ? '#eab308' : '#475569';

              return (
                <g key={wire.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth="3.5"
                    strokeDasharray={isUndefined ? '4' : undefined}
                    className={isHigh ? 'wire-high' : undefined}
                  />
                  {/* Signal value bead */}
                  <circle
                    cx={(x1 + x2) / 2}
                    cy={(y1 + y2) / 2}
                    r="4"
                    fill={strokeColor}
                  />
                </g>
              );
            })}

            {/* Nodes */}
            {simResult.nodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isSwitch = node.type === 'SWITCH' || node.type === 'CLOCK';
              const isLed = node.type === 'LED';
              const isFF = node.type.endsWith('_FF');

              const width = isFF ? 110 : 90;
              const height = Math.max(50, Math.max(node.inputs.length, node.outputs.length) * 20 + 28);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => handleNodeDragStart(e, node.id)}
                  className="cursor-move"
                >
                  {/* Node Background Box */}
                  <rect
                    width={width}
                    height={height}
                    rx="8"
                    fill="#1e293b"
                    stroke={isSelected ? '#10b981' : '#334155'}
                    strokeWidth={isSelected ? '2.5' : '1.5'}
                    className="shadow-lg"
                  />

                  {/* Header / Type Label */}
                  <text
                    x={width / 2}
                    y="16"
                    fill="#94a3b8"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    {node.label || node.type}
                  </text>

                  {/* Center Interactive Widget */}
                  {isSwitch && (
                    <g
                      onClick={e => {
                        e.stopPropagation();
                        toggleSwitch(node.id);
                      }}
                      className="cursor-pointer"
                    >
                      <rect
                        x="20"
                        y="22"
                        width="50"
                        height="22"
                        rx="11"
                        fill={node.state?.highValue ? '#10b981' : '#334155'}
                        className="transition-colors"
                      />
                      <circle
                        cx={node.state?.highValue ? '56' : '32'}
                        cy="33"
                        r="8"
                        fill="#ffffff"
                        className="transition-all"
                      />
                      <text
                        x="45"
                        y="58"
                        fill={node.state?.highValue ? '#10b981' : '#64748b'}
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.state?.highValue ? '1 (HIGH)' : '0 (LOW)'}
                      </text>
                    </g>
                  )}

                  {isLed && (
                    <g>
                      <circle
                        cx={width / 2}
                        cy="34"
                        r="12"
                        fill={node.inputs[0]?.value === 1 ? '#10b981' : '#334155'}
                        filter={node.inputs[0]?.value === 1 ? 'drop-shadow(0 0 6px #10b981)' : undefined}
                      />
                      <text
                        x={width / 2}
                        y="38"
                        fill="#ffffff"
                        fontSize="10"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        {node.inputs[0]?.value === 1 ? '1' : '0'}
                      </text>
                    </g>
                  )}

                  {/* Input Ports (Left) */}
                  {node.inputs.map((port, pIdx) => {
                    const py = 24 + pIdx * 18;
                    const pVal = port.value;
                    const pColor = pVal === 1 ? '#10b981' : pVal === 0 ? '#64748b' : '#eab308';

                    return (
                      <g
                        key={port.id}
                        onClick={e => {
                          e.stopPropagation();
                          handlePortClick(node.id, pIdx, 'input');
                        }}
                        className="cursor-pointer group"
                      >
                        <circle
                          cx="0"
                          cy={py}
                          r="5.5"
                          fill={pColor}
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="hover:scale-125 transition-transform"
                        />
                        <text
                          x="8"
                          y={py + 3.5}
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="bold"
                        >
                          {port.name || `In${pIdx + 1}`}
                        </text>
                      </g>
                    );
                  })}

                  {/* Output Ports (Right) */}
                  {node.outputs.map((port, pIdx) => {
                    const py = 24 + pIdx * 18;
                    const pVal = port.value;
                    const pColor = pVal === 1 ? '#10b981' : pVal === 0 ? '#64748b' : '#eab308';

                    return (
                      <g
                        key={port.id}
                        onClick={e => {
                          e.stopPropagation();
                          handlePortClick(node.id, pIdx, 'output');
                        }}
                        className="cursor-pointer group"
                      >
                        <circle
                          cx={width}
                          cy={py}
                          r="5.5"
                          fill={pColor}
                          stroke="#0f172a"
                          strokeWidth="2"
                          className="hover:scale-125 transition-transform"
                        />
                        <text
                          x={width - 8}
                          y={py + 3.5}
                          fill="#64748b"
                          fontSize="9"
                          fontWeight="bold"
                          textAnchor="end"
                        >
                          {port.name || 'Out'}
                        </text>
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
          <div className="w-64 border-l border-slate-800 bg-slate-900/90 p-4 overflow-y-auto space-y-4 shrink-0 z-10">
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
                <span>Inputs / Outputs:</span>
                <span className="font-mono text-slate-300">{selectedNode.inputs.length} in / {selectedNode.outputs.length} out</span>
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
