import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Circuit, 
  CircuitNode, 
  Wire, 
  GateType, 
  LogicValue 
} from '../../engine/types';
import { simulateCircuit } from '../../engine/simulator';
import { generateCircuitTruthTable, truthTableToCSV } from '../../engine/truthTableGenerator';
import { SAMPLE_CIRCUITS } from '../../engine/sampleCircuits';
import { saveProject, exportProjectAsDigitalXML } from '../../engine/storage/projectStore';
import { findWireCrossovers, getJumpArcPath, WireGeometryInput } from '../../engine/wireCrossover';
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
  FileText,
  Check,
  Palette,
  Search,
  Sliders,
  X,
  Cpu,
  Volume2,
  VolumeX,
  Zap
} from 'lucide-react';
import { buzzerSound } from '../../engine/audio/buzzerAudio';

interface CircuitEditorProps {
  initialCircuit?: Circuit;
  onSaveToVault?: (circuit: Circuit) => void;
}

export const NOTE_COLORS = [
  { name: 'Yellow', value: '#eab308' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Slate', value: '#64748b' },
];

export const WIRE_COLORS = [
  { name: 'Auto (State)', value: '' },
  { name: 'Green', value: '#10b981' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Cyan', value: '#06b6d4' },
  { name: 'White', value: '#f8fafc' },
];

/**
 * Calculates uniform dimensions for each component type
 */
export const getNodeDimensions = (node: CircuitNode) => {
  if (node.type === 'COMMENT') {
    return { width: node.width || 200, height: node.height || 130 };
  }
  if (node.type === 'SEVEN_SEG' || node.type === 'HEX_DISPLAY') {
    return { width: 130, height: 170 };
  }
  if (node.type === 'BAR_GRAPH') {
    return { width: 110, height: 130 };
  }
  if (node.type === 'BUZZER') {
    return { width: 104, height: 80 };
  }
  if (node.type === 'BCD_TO_7SEG') {
    return { width: 140, height: 190 };
  }
  if (node.type === 'ALU_4BIT') {
    return { width: 160, height: 260 };
  }
  if (node.type === 'MUX_8TO1' || node.type === 'DECODER_3TO8') {
    return { width: 146, height: 260 };
  }
  if (node.type === 'MAG_COMP_4BIT') {
    return { width: 146, height: 220 };
  }
  if (node.type === 'COUNTER_4BIT' || node.type === 'DECADE_COUNTER' || node.type === 'SHIFT_REG_4BIT' || node.type === 'REGISTER_4BIT') {
    return { width: 136, height: 130 };
  }
  if (['HALF_ADDER', 'FULL_ADDER', 'HALF_SUB', 'FULL_SUB', 'MAG_COMP_2BIT', 'PARITY_GEN'].includes(node.type)) {
    return { width: 130, height: 110 };
  }
  if (['MUX_2TO1', 'MUX_4TO1', 'DEMUX_1TO2', 'DEMUX_1TO4', 'DECODER_2TO4', 'PRIORITY_ENC_4TO2'].includes(node.type)) {
    const maxPorts = Math.max(node.inputs.length, node.outputs.length);
    return { width: 136, height: Math.max(96, maxPorts * 26 + 26) };
  }
  if (node.type.endsWith('_FF') || node.type === 'D_LATCH') {
    return { width: 120, height: 96 };
  }
  if (['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'DIODE', 'ZENER_DIODE', 'FUSE'].includes(node.type)) {
    return { width: 104, height: 76 };
  }
  if (['TRANSISTOR_NPN', 'MOSFET_N', 'POTENTIOMETER'].includes(node.type)) {
    return { width: 116, height: 90 };
  }
  if (node.type === 'RELAY') {
    return { width: 124, height: 96 };
  }
  if (['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'AND3', 'OR3', 'NAND3', 'NOR3', 'XOR3', 'AND4', 'OR4', 'NAND4', 'NOR4', 'TRI_STATE'].includes(node.type)) {
    const inputCount = Math.max(2, node.inputs.length);
    const height = Math.max(80, inputCount * 26 + 26);
    return { width: 116, height };
  }
  if (['SWITCH', 'CLOCK', 'PUSH_BUTTON', 'CONST_HIGH', 'CONST_LOW'].includes(node.type)) {
    return { width: 104, height: 78 };
  }
  if (node.type === 'LED' || node.type === 'PROBE') {
    return { width: 96, height: 78 };
  }
  const maxPorts = Math.max(node.inputs.length, node.outputs.length);
  return { width: 120, height: Math.max(76, maxPorts * 26 + 24) };
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

  const inY0 = 28;
  const inY1 = inputCount > 1 ? height - 12 : 28 + (height - 40) / 2;

  return (
    <g>
      {inputCount === 4 ? (
        <>
          <line x1="0" y1={inY0} x2={gx} y2={inY0} stroke="#64748b" strokeWidth="2" />
          <line x1="0" y1={inY0 + (inY1 - inY0) / 3} x2={gx} y2={inY0 + (inY1 - inY0) / 3} stroke="#64748b" strokeWidth="2" />
          <line x1="0" y1={inY0 + 2 * (inY1 - inY0) / 3} x2={gx} y2={inY0 + 2 * (inY1 - inY0) / 3} stroke="#64748b" strokeWidth="2" />
          <line x1="0" y1={inY1} x2={gx} y2={inY1} stroke="#64748b" strokeWidth="2" />
        </>
      ) : (
        <>
          {inputCount >= 1 && (
            <line x1="0" y1={inY0} x2={gx} y2={inY0} stroke="#64748b" strokeWidth="2" />
          )}
          {inputCount >= 3 && (
            <line x1="0" y1={(inY0 + inY1) / 2} x2={gx} y2={(inY0 + inY1) / 2} stroke="#64748b" strokeWidth="2" />
          )}
          {inputCount >= 2 && (
            <line x1="0" y1={inY1} x2={gx} y2={inY1} stroke="#64748b" strokeWidth="2" />
          )}
        </>
      )}
      <line x1={gx + gw - 4} y1={midY} x2={width} y2={midY} stroke="#64748b" strokeWidth="2" />

      <g transform={`translate(${gx}, ${gy})`}>
        {(type === 'AND' || type === 'AND3' || type === 'AND4') && (
          <path
            d="M 2 2 L 22 2 A 16 16 0 0 1 22 34 L 2 34 Z"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {(type === 'NAND' || type === 'NAND3' || type === 'NAND4') && (
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
        {(type === 'OR' || type === 'OR3' || type === 'OR4') && (
          <path
            d="M 2 2 Q 13 18 2 34 Q 26 34 44 18 Q 26 2 2 2 Z"
            fill="#0f172a"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}
        {(type === 'NOR' || type === 'NOR3' || type === 'NOR4') && (
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
        {(type === 'XOR' || type === 'XOR3') && (
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
        {type === 'TRI_STATE' && (
          <>
            <path
              d="M 4 6 L 36 18 L 4 30 Z"
              fill="#0f172a"
              stroke={strokeColor}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <line x1="20" y1="-2" x2="20" y2="12" stroke="#64748b" strokeWidth="2" />
          </>
        )}
      </g>
    </g>
  );
};

const MiniGateIcon: React.FC<{ type: GateType }> = ({ type }) => {
  switch (type) {
    case 'AND':
    case 'AND3':
    case 'AND4':
      return <path d="M 4 4 L 18 4 A 10 10 0 0 1 18 24 L 4 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case 'NAND':
    case 'NAND3':
    case 'NAND4':
      return (
        <>
          <path d="M 3 4 L 16 4 A 10 10 0 0 1 16 24 L 3 24 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="28" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'OR':
    case 'OR3':
    case 'OR4':
      return <path d="M 4 4 Q 10 14 4 24 Q 20 24 32 14 Q 20 4 4 4 Z" fill="none" stroke="currentColor" strokeWidth="2" />;
    case 'NOR':
    case 'NOR3':
    case 'NOR4':
      return (
        <>
          <path d="M 3 4 Q 8 14 3 24 Q 16 24 26 14 Q 16 4 3 4 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </>
      );
    case 'XOR':
    case 'XOR3':
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
    case 'TRI_STATE':
      return (
        <>
          <path d="M 4 5 L 24 14 L 4 23 Z" fill="none" stroke="currentColor" strokeWidth="2" />
          <line x1="14" y1="2" x2="14" y2="9" stroke="currentColor" strokeWidth="2" />
        </>
      );
    default:
      return null;
  }
};

export const ComponentSymbolIcon: React.FC<{ type: GateType; className?: string }> = ({ type, className = "h-5 w-6 shrink-0" }) => {
  // Logic gates
  if (['AND', 'AND3', 'AND4', 'OR', 'OR3', 'OR4', 'NOT', 'NAND', 'NAND3', 'NAND4', 'NOR', 'NOR3', 'NOR4', 'XOR', 'XOR3', 'XNOR', 'BUFFER', 'TRI_STATE'].includes(type)) {
    return (
      <svg width="24" height="18" viewBox="0 0 36 28" className={`${className} text-cyan-400`}>
        <MiniGateIcon type={type} />
      </svg>
    );
  }

  // Discrete Passives
  if (type === 'RESISTOR') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-amber-400`}>
        <path d="M 2 12 L 6 12 L 9 6 L 15 18 L 21 6 L 27 18 L 30 12 L 34 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'CAPACITOR') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-cyan-400`}>
        <path d="M 2 12 L 14 12 M 14 4 L 14 20 M 20 4 L 20 20 M 20 12 L 32 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'INDUCTOR') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-indigo-400`}>
        <path d="M 2 14 C 4 6 10 6 12 14 C 14 6 20 6 22 14 C 24 6 30 6 32 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'DIODE') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-emerald-400`}>
        <path d="M 2 12 L 10 12 M 10 5 L 24 12 L 10 19 Z M 24 5 L 24 19 M 24 12 L 32 12" fill="currentColor" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === 'ZENER_DIODE') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-teal-400`}>
        <path d="M 2 12 L 10 12 M 10 5 L 24 12 L 10 19 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.8" />
        <path d="M 28 5 L 24 5 L 24 19 L 20 19 M 24 12 L 32 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'TRANSISTOR_NPN') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 28" className={`${className} text-blue-400`}>
        <circle cx="18" cy="14" r="12" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
        <line x1="12" y1="6" x2="12" y2="22" stroke="currentColor" strokeWidth="2.5" />
        <line x1="2" y1="14" x2="12" y2="14" stroke="currentColor" strokeWidth="1.8" />
        <line x1="12" y1="10" x2="24" y2="4" stroke="currentColor" strokeWidth="1.8" />
        <line x1="12" y1="18" x2="24" y2="24" stroke="currentColor" strokeWidth="1.8" />
        <polygon points="20,20 25,25 25,19" fill="currentColor" />
      </svg>
    );
  }
  if (type === 'MOSFET_N') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 28" className={`${className} text-purple-400`}>
        <line x1="8" y1="6" x2="8" y2="22" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="6" x2="14" y2="10" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="12" x2="14" y2="16" stroke="currentColor" strokeWidth="2" />
        <line x1="14" y1="18" x2="14" y2="22" stroke="currentColor" strokeWidth="2" />
        <path d="M 2 14 L 8 14 M 14 8 L 26 8 M 14 20 L 26 20 M 14 14 L 20 14" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <polygon points="15,14 19,12 19,16" fill="currentColor" />
      </svg>
    );
  }
  if (type === 'POTENTIOMETER') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-amber-300`}>
        <path d="M 2 12 L 6 12 L 9 7 L 15 17 L 21 7 L 27 17 L 30 12 L 34 12" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M 18 2 L 18 10 M 15 7 L 18 10 L 21 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'RELAY') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-orange-400`}>
        <rect x="4" y="4" width="28" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 8 12 L 14 12 M 22 10 L 28 8 M 22 16 L 28 16" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  if (type === 'FUSE') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-rose-400`}>
        <rect x="8" y="7" width="20" height="10" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 2 12 L 8 12 M 10 12 Q 18 6 18 12 Q 18 18 26 12 M 28 12 L 34 12" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }

  // Inputs & Power
  if (type === 'SWITCH' || type === 'PUSH_BUTTON') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-emerald-400`}>
        <circle cx="8" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="28" cy="14" r="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="12" x2="24" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'CLOCK') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-cyan-400`}>
        <path d="M 3 17 L 10 17 L 10 7 L 19 7 L 19 17 L 28 17 L 28 7 L 33 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="miter" />
      </svg>
    );
  }
  if (type === 'CONST_HIGH') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-emerald-400 font-bold`}>
        <path d="M 18 20 L 18 7 M 13 12 L 18 6 L 23 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <text x="24" y="16" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">1</text>
      </svg>
    );
  }
  if (type === 'CONST_LOW') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-slate-400`}>
        <line x1="18" y1="4" x2="18" y2="12" stroke="currentColor" strokeWidth="2" />
        <line x1="8" y1="12" x2="28" y2="12" stroke="currentColor" strokeWidth="2" />
        <line x1="12" y1="16" x2="24" y2="16" stroke="currentColor" strokeWidth="2" />
        <line x1="15" y1="20" x2="21" y2="20" stroke="currentColor" strokeWidth="2" />
      </svg>
    );
  }

  // Displays & Indicators
  if (type === 'LED') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-rose-400`}>
        <circle cx="15" cy="12" r="6" fill="#ef4444" fillOpacity="0.4" stroke="currentColor" strokeWidth="2" />
        <path d="M 22 7 L 28 4 M 25 3 L 28 4 L 28 7 M 24 14 L 30 11 M 27 10 L 30 11 L 30 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'SEVEN_SEG') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 28" className={`${className} text-rose-400`}>
        <rect x="2" y="2" width="20" height="24" rx="2" fill="#881337" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5" />
        <path d="M 6 6 L 18 6 M 18 6 L 18 14 M 6 14 L 18 14 M 6 14 L 6 22 M 18 14 L 18 22 M 6 22 L 18 22 M 6 6 L 6 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'HEX_DISPLAY') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 28" className={`${className} text-cyan-400`}>
        <rect x="2" y="2" width="20" height="24" rx="2" fill="#083344" stroke="currentColor" strokeWidth="1.5" />
        <text x="12" y="19" textAnchor="middle" fill="currentColor" fontSize="14" fontFamily="monospace" fontWeight="bold">F</text>
      </svg>
    );
  }
  if (type === 'BAR_GRAPH') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" className={`${className} text-emerald-400`}>
        <rect x="2" y="2" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <line x1="5" y1="6" x2="19" y2="6" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="10" x2="19" y2="10" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="14" x2="19" y2="14" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
        <line x1="5" y1="18" x2="19" y2="18" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'BUZZER') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-amber-400`}>
        <path d="M 6 9 L 12 9 L 18 4 L 18 20 L 12 15 L 6 15 Z" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M 23 7 Q 27 12 23 17 M 27 4 Q 33 12 27 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === 'PROBE') {
    return (
      <svg width="24" height="18" viewBox="0 0 36 24" className={`${className} text-emerald-400`}>
        <circle cx="18" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M 12 15 L 18 8 L 22 13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Flip-Flops & Latches
  if (type.endsWith('_FF') || type.endsWith('_LATCH')) {
    const label = type === 'D_FF' ? 'D' : type === 'JK_FF' ? 'JK' : type === 'T_FF' ? 'T' : 'SR';
    return (
      <svg width="24" height="20" viewBox="0 0 36 28" className={`${className} text-teal-400`}>
        <rect x="4" y="2" width="28" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M 4 11 L 10 14 L 4 17" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <text x="20" y="17" textAnchor="middle" fill="currentColor" fontSize="10" fontFamily="sans-serif" fontWeight="bold">{label}</text>
      </svg>
    );
  }

  // Arithmetic & Adders
  if (['HALF_ADDER', 'FULL_ADDER', 'HALF_SUB', 'FULL_SUB', 'ALU_4BIT'].includes(type)) {
    const sym = type.includes('SUB') ? '−' : type.includes('ALU') ? 'ALU' : 'Σ';
    return (
      <svg width="24" height="20" viewBox="0 0 36 28" className={`${className} text-indigo-400`}>
        <rect x="4" y="2" width="28" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <text x="18" y="18" textAnchor="middle" fill="currentColor" fontSize={type.includes('ALU') ? "9" : "14"} fontFamily="sans-serif" fontWeight="bold">{sym}</text>
      </svg>
    );
  }

  // Multiplexers & Decoders
  if (type.startsWith('MUX') || type.startsWith('DEMUX') || type.startsWith('DECODER') || type.startsWith('PRIORITY') || type === 'BCD_TO_7SEG') {
    const txt = type.startsWith('MUX') ? 'MUX' : type.startsWith('DEMUX') ? 'DMUX' : type.startsWith('DEC') ? 'DEC' : 'IC';
    return (
      <svg width="24" height="20" viewBox="0 0 36 28" className={`${className} text-cyan-400`}>
        <polygon points="6,2 30,6 30,22 6,26" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <text x="18" y="17" textAnchor="middle" fill="currentColor" fontSize="9" fontFamily="sans-serif" fontWeight="bold">{txt}</text>
      </svg>
    );
  }

  // Counters & Registers
  if (type.includes('COUNTER') || type.includes('REG')) {
    return (
      <svg width="24" height="20" viewBox="0 0 36 28" className={`${className} text-purple-400`}>
        <rect x="4" y="2" width="28" height="24" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="10" cy="14" r="1.5" fill="currentColor" />
        <circle cx="15" cy="14" r="1.5" fill="currentColor" />
        <circle cx="20" cy="14" r="1.5" fill="currentColor" />
        <circle cx="25" cy="14" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Note / Comment
  if (type === 'COMMENT') {
    return <FileText className={`${className} text-amber-400`} />;
  }

  // Default IC chip
  return (
    <svg width="24" height="20" viewBox="0 0 36 28" className={`${className} text-cyan-400`}>
      <rect x="6" y="4" width="24" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="2" y1="9" x2="6" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="2" y1="19" x2="6" y2="19" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="9" x2="34" y2="9" stroke="currentColor" strokeWidth="1.5" />
      <line x1="30" y1="19" x2="34" y2="19" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
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
  const [showPropertiesPanel, setShowPropertiesPanel] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [editorMode, setEditorMode] = useState<'SELECT' | 'WIRE'>('SELECT');
  const [wireJumpsEnabled, setWireJumpsEnabled] = useState<boolean>(true);
  const [jumpBridgeSize, setJumpBridgeSize] = useState<number>(8); // Height / amplitude of jump arch
  const [jumpBridgeSpan, setJumpBridgeSpan] = useState<number>(10); // Length / span along wire
  const [showJumpSettings, setShowJumpSettings] = useState<boolean>(false);
  const [showMobilePaletteModal, setShowMobilePaletteModal] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(false);
  const [paletteSearch, setPaletteSearch] = useState<string>('');
  
  // Wire creation state
  const [wireStart, setWireStart] = useState<{ nodeId: string; portIndex: number; type: 'input' | 'output' } | null>(null);
  const [hoveredPort, setHoveredPort] = useState<{ nodeId: string; portIndex: number; type: 'input' | 'output' } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Viewport & Pan / Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPanMouse, setStartPanMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchRef = useRef<{
    initialDist: number;
    initialZoom: number;
    initialPan: { x: number; y: number };
    midX: number;
    midY: number;
  } | null>(null);

  // Node Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Comment Box Resizing State
  const [resizingNodeId, setResizingNodeId] = useState<string | null>(null);
  const [startResizeMouse, setStartResizeMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [startResizeDim, setStartResizeDim] = useState<{ width: number; height: number }>({ width: 200, height: 130 });

  // Truth Table Modal State
  const [showTruthTableModal, setShowTruthTableModal] = useState<boolean>(false);
  const [truthTableData, setTruthTableData] = useState<ReturnType<typeof generateCircuitTruthTable> | null>(null);

  // Clear confirmation modal
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const ignoreNextCanvasClickRef = useRef<boolean>(false);

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

  // Calculate Wire Crossing (Jump / Crossover) Bridges
  const wireCrossovers = React.useMemo(() => {
    if (!wireJumpsEnabled || simResult.wires.length < 2) return [];

    const geometryInputs: WireGeometryInput[] = [];
    for (const wire of simResult.wires) {
      const fromNode = simResult.nodes.find(n => n.id === wire.fromNodeId);
      const toNode = simResult.nodes.find(n => n.id === wire.toNodeId);
      if (!fromNode || !toNode) continue;

      const p1 = getPortCoordinates(fromNode, wire.fromPortIndex, 'output');
      const p2 = getPortCoordinates(toNode, wire.toPortIndex, 'input');
      geometryInputs.push({
        id: wire.id,
        p1,
        p2,
        color: wire.color,
        value: wire.value,
      });
    }

    return findWireCrossovers(geometryInputs);
  }, [simResult.wires, simResult.nodes, wireJumpsEnabled]);

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

  // Real Buzzer Sound: activates Web Audio oscillator when any BUZZER receives logic 1
  useEffect(() => {
    if (!isSimulating) {
      buzzerSound.stop();
      return;
    }

    const hasActiveBuzzer = simResult.nodes.some(
      n => n.type === 'BUZZER' && n.inputs[0]?.value === 1
    );

    if (hasActiveBuzzer) {
      buzzerSound.start();
    } else {
      buzzerSound.stop();
    }

    return () => {
      buzzerSound.stop();
    };
  }, [simResult.nodes, isSimulating]);

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
        setResizingNodeId(null);
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
        if (n.id === nodeId && (n.type === 'SWITCH' || n.type === 'CLOCK' || n.type === 'PUSH_BUTTON')) {
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
    let color: string | undefined = undefined;
    let commentText: string | undefined = undefined;
    let width: number | undefined = undefined;
    let height: number | undefined = undefined;

    switch (type) {
      case 'COMMENT':
        label = 'Note';
        color = '#eab308';
        commentText = 'Type notes or explanations here... Drag bottom-right corner to resize.';
        width = 220;
        height = 140;
        break;
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
      case 'CONST_HIGH':
        label = 'VCC (1)';
        outputs = [{ id: 'out_0', name: '1', type: 'output', value: 1 }];
        break;
      case 'CONST_LOW':
        label = 'GND (0)';
        outputs = [{ id: 'out_0', name: '0', type: 'output', value: 0 }];
        break;
      case 'PUSH_BUTTON':
        label = `PB_${circuit.nodes.filter(n => n.type === 'PUSH_BUTTON').length + 1}`;
        outputs = [{ id: 'out_0', name: 'Q', type: 'output', value: 0 }];
        state = { highValue: false };
        break;
      case 'PROBE':
        label = `PROBE_${circuit.nodes.filter(n => n.type === 'PROBE').length + 1}`;
        inputs = [{ id: 'in_0', name: 'In', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: 'Val', type: 'output', value: 0 }];
        break;
      case 'AND3':
      case 'OR3':
      case 'NAND3':
      case 'NOR3':
      case 'XOR3':
        label = type;
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'C', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: (type === 'NAND3' || type === 'NOR3') ? 1 : 0 }];
        break;
      case 'AND4':
      case 'OR4':
      case 'NAND4':
      case 'NOR4':
        label = type;
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'C', type: 'input', value: 0 },
          { id: 'in_3', name: 'D', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: (type === 'NAND4' || type === 'NOR4') ? 1 : 0 }];
        break;
      case 'TRI_STATE':
        label = 'Tri-State';
        inputs = [
          { id: 'in_0', name: 'In', type: 'input', value: 0 },
          { id: 'in_1', name: 'EN', type: 'input', value: 1 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }];
        break;
      case 'HALF_ADDER':
        label = 'Half Adder';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Sum', type: 'output', value: 0 },
          { id: 'out_1', name: 'Carry', type: 'output', value: 0 },
        ];
        break;
      case 'FULL_ADDER':
        label = 'Full Adder';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'Cin', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Sum', type: 'output', value: 0 },
          { id: 'out_1', name: 'Cout', type: 'output', value: 0 },
        ];
        break;
      case 'HALF_SUB':
        label = 'Half Subtractor';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Diff', type: 'output', value: 0 },
          { id: 'out_1', name: 'Borrow', type: 'output', value: 0 },
        ];
        break;
      case 'FULL_SUB':
        label = 'Full Subtractor';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'Bin', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Diff', type: 'output', value: 0 },
          { id: 'out_1', name: 'Bout', type: 'output', value: 0 },
        ];
        break;
      case 'MUX_2TO1':
        label = '2:1 MUX';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'S', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }];
        break;
      case 'MUX_4TO1':
        label = '4:1 MUX';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
          { id: 'in_4', name: 'S0', type: 'input', value: 0 },
          { id: 'in_5', name: 'S1', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'Y', type: 'output', value: 0 }];
        break;
      case 'DEMUX_1TO2':
        label = '1:2 DEMUX';
        inputs = [
          { id: 'in_0', name: 'In', type: 'input', value: 0 },
          { id: 'in_1', name: 'S', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Y0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Y1', type: 'output', value: 0 },
        ];
        break;
      case 'DEMUX_1TO4':
        label = '1:4 DEMUX';
        inputs = [
          { id: 'in_0', name: 'In', type: 'input', value: 0 },
          { id: 'in_1', name: 'S0', type: 'input', value: 0 },
          { id: 'in_2', name: 'S1', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Y0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Y1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Y2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Y3', type: 'output', value: 0 },
        ];
        break;
      case 'DECODER_2TO4':
        label = '2-to-4 Decoder';
        inputs = [
          { id: 'in_0', name: 'A0', type: 'input', value: 0 },
          { id: 'in_1', name: 'A1', type: 'input', value: 0 },
          { id: 'in_2', name: 'EN', type: 'input', value: 1 },
        ];
        outputs = [
          { id: 'out_0', name: 'Y0', type: 'output', value: 1 },
          { id: 'out_1', name: 'Y1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Y2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Y3', type: 'output', value: 0 },
        ];
        break;
      case 'PRIORITY_ENC_4TO2':
        label = '4:2 Priority Enc';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'A0', type: 'output', value: 0 },
          { id: 'out_1', name: 'A1', type: 'output', value: 0 },
          { id: 'out_2', name: 'V', type: 'output', value: 0 },
        ];
        break;
      case 'MAG_COMP_2BIT':
        label = 'Comparator';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'A>B', type: 'output', value: 0 },
          { id: 'out_1', name: 'A=B', type: 'output', value: 1 },
          { id: 'out_2', name: 'A<B', type: 'output', value: 0 },
        ];
        break;
      case 'T_FF':
        label = 'T Flip-Flop';
        inputs = [
          { id: 'in_0', name: 'T', type: 'input', value: 0 },
          { id: 'in_1', name: 'CLK', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q', type: 'output', value: 0 },
          { id: 'out_1', name: "Q'", type: 'output', value: 1 },
        ];
        state = { q: 0, qBar: 1, prevClock: 0 };
        break;
      case 'COUNTER_4BIT':
        label = '4-Bit Counter';
        inputs = [
          { id: 'in_0', name: 'CLK', type: 'input', value: 0 },
          { id: 'in_1', name: 'RST', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Q1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Q2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Q3', type: 'output', value: 0 },
        ];
        state = { counterValue: 0, prevClock: 0 };
        break;
      case 'SHIFT_REG_4BIT':
        label = '4-Bit Shift Reg';
        inputs = [
          { id: 'in_0', name: 'DIN', type: 'input', value: 0 },
          { id: 'in_1', name: 'CLK', type: 'input', value: 0 },
          { id: 'in_2', name: 'RST', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Q1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Q2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Q3', type: 'output', value: 0 },
        ];
        state = { regValues: [0, 0, 0, 0], prevClock: 0 };
        break;
      case 'SEVEN_SEG':
        label = '7-Segment Display';
        inputs = [
          { id: 'in_0', name: 'a', type: 'input', value: 0 },
          { id: 'in_1', name: 'b', type: 'input', value: 0 },
          { id: 'in_2', name: 'c', type: 'input', value: 0 },
          { id: 'in_3', name: 'd', type: 'input', value: 0 },
          { id: 'in_4', name: 'e', type: 'input', value: 0 },
          { id: 'in_5', name: 'f', type: 'input', value: 0 },
          { id: 'in_6', name: 'g', type: 'input', value: 0 },
        ];
        outputs = [];
        break;
      case 'BCD_TO_7SEG':
        label = 'BCD to 7-Seg';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'C', type: 'input', value: 0 },
          { id: 'in_3', name: 'D', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'a', type: 'output', value: 1 },
          { id: 'out_1', name: 'b', type: 'output', value: 1 },
          { id: 'out_2', name: 'c', type: 'output', value: 1 },
          { id: 'out_3', name: 'd', type: 'output', value: 1 },
          { id: 'out_4', name: 'e', type: 'output', value: 1 },
          { id: 'out_5', name: 'f', type: 'output', value: 1 },
          { id: 'out_6', name: 'g', type: 'output', value: 0 },
        ];
        break;
      case 'D_LATCH':
        label = 'D Latch (7475)';
        inputs = [
          { id: 'in_0', name: 'D', type: 'input', value: 0 },
          { id: 'in_1', name: 'EN', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q', type: 'output', value: 0 },
          { id: 'out_1', name: "Q'", type: 'output', value: 1 },
        ];
        state = { q: 0, qBar: 1 };
        break;
      case 'MUX_8TO1':
        label = '8:1 MUX (74151)';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
          { id: 'in_4', name: 'D4', type: 'input', value: 0 },
          { id: 'in_5', name: 'D5', type: 'input', value: 0 },
          { id: 'in_6', name: 'D6', type: 'input', value: 0 },
          { id: 'in_7', name: 'D7', type: 'input', value: 0 },
          { id: 'in_8', name: 'S0', type: 'input', value: 0 },
          { id: 'in_9', name: 'S1', type: 'input', value: 0 },
          { id: 'in_10', name: 'S2', type: 'input', value: 0 },
          { id: 'in_11', name: 'EN', type: 'input', value: 1 },
        ];
        outputs = [
          { id: 'out_0', name: 'Y', type: 'output', value: 0 },
          { id: 'out_1', name: 'W', type: 'output', value: 1 },
        ];
        break;
      case 'DECODER_3TO8':
        label = '3:8 Decoder (74138)';
        inputs = [
          { id: 'in_0', name: 'A', type: 'input', value: 0 },
          { id: 'in_1', name: 'B', type: 'input', value: 0 },
          { id: 'in_2', name: 'C', type: 'input', value: 0 },
          { id: 'in_3', name: 'EN', type: 'input', value: 1 },
        ];
        outputs = [
          { id: 'out_0', name: 'Y0', type: 'output', value: 1 },
          { id: 'out_1', name: 'Y1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Y2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Y3', type: 'output', value: 0 },
          { id: 'out_4', name: 'Y4', type: 'output', value: 0 },
          { id: 'out_5', name: 'Y5', type: 'output', value: 0 },
          { id: 'out_6', name: 'Y6', type: 'output', value: 0 },
          { id: 'out_7', name: 'Y7', type: 'output', value: 0 },
        ];
        break;
      case 'MAG_COMP_4BIT':
        label = '4-Bit Comparator';
        inputs = [
          { id: 'in_0', name: 'A0', type: 'input', value: 0 },
          { id: 'in_1', name: 'A1', type: 'input', value: 0 },
          { id: 'in_2', name: 'A2', type: 'input', value: 0 },
          { id: 'in_3', name: 'A3', type: 'input', value: 0 },
          { id: 'in_4', name: 'B0', type: 'input', value: 0 },
          { id: 'in_5', name: 'B1', type: 'input', value: 0 },
          { id: 'in_6', name: 'B2', type: 'input', value: 0 },
          { id: 'in_7', name: 'B3', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'A>B', type: 'output', value: 0 },
          { id: 'out_1', name: 'A=B', type: 'output', value: 1 },
          { id: 'out_2', name: 'A<B', type: 'output', value: 0 },
        ];
        break;
      case 'PARITY_GEN':
        label = 'Parity Gen (4-Bit)';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'PEVEN', type: 'output', value: 1 },
          { id: 'out_1', name: 'PODD', type: 'output', value: 0 },
        ];
        break;
      case 'ALU_4BIT':
        label = '4-Bit ALU (74181)';
        inputs = [
          { id: 'in_0', name: 'A0', type: 'input', value: 0 },
          { id: 'in_1', name: 'A1', type: 'input', value: 0 },
          { id: 'in_2', name: 'A2', type: 'input', value: 0 },
          { id: 'in_3', name: 'A3', type: 'input', value: 0 },
          { id: 'in_4', name: 'B0', type: 'input', value: 0 },
          { id: 'in_5', name: 'B1', type: 'input', value: 0 },
          { id: 'in_6', name: 'B2', type: 'input', value: 0 },
          { id: 'in_7', name: 'B3', type: 'input', value: 0 },
          { id: 'in_8', name: 'S0', type: 'input', value: 0 },
          { id: 'in_9', name: 'S1', type: 'input', value: 0 },
          { id: 'in_10', name: 'Cin', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'F0', type: 'output', value: 0 },
          { id: 'out_1', name: 'F1', type: 'output', value: 0 },
          { id: 'out_2', name: 'F2', type: 'output', value: 0 },
          { id: 'out_3', name: 'F3', type: 'output', value: 0 },
          { id: 'out_4', name: 'Cout', type: 'output', value: 0 },
          { id: 'out_5', name: 'Zero', type: 'output', value: 1 },
        ];
        break;
      case 'DECADE_COUNTER':
        label = 'Decade BCD Counter';
        inputs = [
          { id: 'in_0', name: 'CLK', type: 'input', value: 0 },
          { id: 'in_1', name: 'RST', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Q1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Q2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Q3', type: 'output', value: 0 },
          { id: 'out_4', name: 'RCO', type: 'output', value: 0 },
        ];
        state = { counterValue: 0, prevClock: 0 };
        break;
      case 'REGISTER_4BIT':
        label = '4-Bit Register (74173)';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
          { id: 'in_4', name: 'CLK', type: 'input', value: 0 },
          { id: 'in_5', name: 'LD', type: 'input', value: 1 },
          { id: 'in_6', name: 'CLR', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'Q0', type: 'output', value: 0 },
          { id: 'out_1', name: 'Q1', type: 'output', value: 0 },
          { id: 'out_2', name: 'Q2', type: 'output', value: 0 },
          { id: 'out_3', name: 'Q3', type: 'output', value: 0 },
        ];
        state = { regValues: [0, 0, 0, 0], prevClock: 0 };
        break;
      case 'HEX_DISPLAY':
        label = 'Hex Display';
        inputs = [
          { id: 'in_0', name: 'D0', type: 'input', value: 0 },
          { id: 'in_1', name: 'D1', type: 'input', value: 0 },
          { id: 'in_2', name: 'D2', type: 'input', value: 0 },
          { id: 'in_3', name: 'D3', type: 'input', value: 0 },
        ];
        outputs = [];
        break;
      case 'BAR_GRAPH':
        label = '4-Bar Indicator';
        inputs = [
          { id: 'in_0', name: 'B0', type: 'input', value: 0 },
          { id: 'in_1', name: 'B1', type: 'input', value: 0 },
          { id: 'in_2', name: 'B2', type: 'input', value: 0 },
          { id: 'in_3', name: 'B3', type: 'input', value: 0 },
        ];
        outputs = [];
        break;
      case 'BUZZER':
        label = 'Buzzer';
        inputs = [
          { id: 'in_0', name: 'In', type: 'input', value: 0 },
        ];
        outputs = [];
        break;
      case 'RESISTOR':
        label = 'Resistor (1kΩ)';
        inputs = [{ id: 'in_0', name: '1', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: '2', type: 'output', value: 0 }];
        break;
      case 'CAPACITOR':
        label = 'Capacitor (10µF)';
        inputs = [{ id: 'in_0', name: '+', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: '-', type: 'output', value: 0 }];
        break;
      case 'INDUCTOR':
        label = 'Inductor (10mH)';
        inputs = [{ id: 'in_0', name: '1', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: '2', type: 'output', value: 0 }];
        break;
      case 'DIODE':
        label = 'Diode (1N4148)';
        inputs = [{ id: 'in_0', name: 'A', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: 'K', type: 'output', value: 0 }];
        break;
      case 'ZENER_DIODE':
        label = 'Zener Diode (5.1V)';
        inputs = [{ id: 'in_0', name: 'A', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: 'K', type: 'output', value: 0 }];
        break;
      case 'TRANSISTOR_NPN':
        label = 'NPN BJT (2N3904)';
        inputs = [
          { id: 'in_0', name: 'B', type: 'input', value: 0 },
          { id: 'in_1', name: 'C', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'E', type: 'output', value: 0 }];
        break;
      case 'MOSFET_N':
        label = 'N-Ch MOSFET';
        inputs = [
          { id: 'in_0', name: 'G', type: 'input', value: 0 },
          { id: 'in_1', name: 'D', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'S', type: 'output', value: 0 }];
        break;
      case 'POTENTIOMETER':
        label = 'Potentiometer';
        inputs = [
          { id: 'in_0', name: 'T1', type: 'input', value: 0 },
          { id: 'in_1', name: 'T2', type: 'input', value: 0 },
        ];
        outputs = [{ id: 'out_0', name: 'W', type: 'output', value: 0 }];
        state = { potValue: 100 };
        break;
      case 'RELAY':
        label = 'SPDT Relay';
        inputs = [
          { id: 'in_0', name: 'Coil', type: 'input', value: 0 },
          { id: 'in_1', name: 'COM', type: 'input', value: 0 },
        ];
        outputs = [
          { id: 'out_0', name: 'NO', type: 'output', value: 0 },
          { id: 'out_1', name: 'NC', type: 'output', value: 0 },
        ];
        break;
      case 'FUSE':
        label = 'Fuse (500mA)';
        inputs = [{ id: 'in_0', name: '1', type: 'input', value: 0 }];
        outputs = [{ id: 'out_0', name: '2', type: 'output', value: 0 }];
        state = { fuseBlown: false };
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
      color,
      commentText,
      width,
      height,
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
      color: target.color,
      commentText: target.commentText,
      width: target.width,
      height: target.height,
    };

    pushHistory({
      ...circuit,
      nodes: [...circuit.nodes, copyNode],
    });
    setSelectedNodeId(copyNode.id);
    setToastMessage(`Duplicated ${target.label}.`);
  };

  // Start Resizing Comment Box
  const handleResizeMouseDown = (e: React.MouseEvent, nodeId: string, currentWidth: number, currentHeight: number) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedWireId(null);
    setResizingNodeId(nodeId);
    setStartResizeMouse({ x: e.clientX, y: e.clientY });
    setStartResizeDim({ width: currentWidth, height: currentHeight });
  };

  const handleResizeTouchStart = (e: React.TouchEvent, nodeId: string, currentWidth: number, currentHeight: number) => {
    if (e.touches.length !== 1) return;
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedWireId(null);
    setResizingNodeId(nodeId);
    const touch = e.touches[0];
    setStartResizeMouse({ x: touch.clientX, y: touch.clientY });
    setStartResizeDim({ width: currentWidth, height: currentHeight });
  };

  // Unified Port Connection Execution for Mouse & Mobile Touch
  const executePortConnection = (targetNodeId: string, targetPortIndex: number, targetType: 'input' | 'output') => {
    if (!wireStart) {
      setWireStart({ nodeId: targetNodeId, portIndex: targetPortIndex, type: targetType });
      setEditorMode('WIRE');
      const startNode = circuit.nodes.find(n => n.id === targetNodeId);
      try { navigator.vibrate?.(25); } catch {}
      setToastMessage(`Started wire from ${startNode?.label || targetNodeId} (${targetType.toUpperCase()}). Tap any ${targetType === 'output' ? 'INPUT (left)' : 'OUTPUT (right)'} pin to connect.`);
      return;
    }

    // Tapping the same pin cancels wiring
    if (wireStart.nodeId === targetNodeId && wireStart.portIndex === targetPortIndex && wireStart.type === targetType) {
      setWireStart(null);
      setHoveredPort(null);
      setToastMessage('Wiring cancelled.');
      return;
    }

    // Invalid port pairing: input to input, or output to output
    if (wireStart.type === targetType) {
      try { navigator.vibrate?.([40, 60, 40]); } catch {}
      setToastMessage(`Cannot connect ${targetType.toUpperCase()} to ${targetType.toUpperCase()}. Please connect an OUTPUT pin to an INPUT pin.`);
      return;
    }

    const fromNodeId = wireStart.type === 'output' ? wireStart.nodeId : targetNodeId;
    const fromPortIndex = wireStart.type === 'output' ? wireStart.portIndex : targetPortIndex;
    const toNodeId = wireStart.type === 'input' ? wireStart.nodeId : targetNodeId;
    const toPortIndex = wireStart.type === 'input' ? wireStart.portIndex : targetPortIndex;

    const fromNode = circuit.nodes.find(n => n.id === fromNodeId);
    const toNode = circuit.nodes.find(n => n.id === toNodeId);

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

    try { navigator.vibrate?.([30, 40, 30]); } catch {}
    setWireStart(null);
    setHoveredPort(null);
    setToastMessage(`Wire connected: ${fromNode?.label || 'Out'} → ${toNode?.label || 'In'}`);
  };

  // Bidirectional Port MouseDown: initiates wire connection without dragging parent node
  const handlePortMouseDown = (e: React.MouseEvent, nodeId: string, portIndex: number, type: 'input' | 'output') => {
    e.stopPropagation();

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    if (!wireStart) {
      executePortConnection(nodeId, portIndex, type);
    }
  };

  // Bidirectional Port MouseUp / Click: completes wire connection
  const handlePortClickOrUp = (e: React.MouseEvent, targetNodeId: string, targetPortIndex: number, targetType: 'input' | 'output') => {
    e.stopPropagation();
    executePortConnection(targetNodeId, targetPortIndex, targetType);
  };

  // Mobile Port TouchStart: dedicated mobile touch handler
  const handlePortTouchStart = (e: React.TouchEvent, nodeId: string, portIndex: number, type: 'input' | 'output') => {
    e.stopPropagation();
    if (e.cancelable) e.preventDefault();

    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    setMousePos(coords);

    executePortConnection(nodeId, portIndex, type);
  };

  // Mobile Port TouchEnd: for drag-and-drop wire release directly onto target port
  const handlePortTouchEnd = (e: React.TouchEvent, nodeId: string, portIndex: number, type: 'input' | 'output') => {
    e.stopPropagation();
    if (wireStart && (wireStart.nodeId !== nodeId || wireStart.portIndex !== portIndex || wireStart.type !== type)) {
      executePortConnection(nodeId, portIndex, type);
    }
  };

  // Zoom and Viewport Actions
  const handleZoomIn = () => setZoom(z => Math.min(3.0, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom(z => Math.max(0.3, Number((z - 0.1).toFixed(2))));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setToastMessage('Zoom reset to 100%');
  };

  const handleFitToScreen = () => {
    if (circuit.nodes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setToastMessage('View reset to 100%');
      return;
    }

    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const containerW = rect.width || 800;
    const containerH = rect.height || 600;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    circuit.nodes.forEach(n => {
      const w = n.width || 120;
      const h = n.height || 70;
      minX = Math.min(minX, n.x - 30);
      minY = Math.min(minY, n.y - 30);
      maxX = Math.max(maxX, n.x + w + 30);
      maxY = Math.max(maxY, n.y + h + 30);
    });

    const circuitW = maxX - minX;
    const circuitH = maxY - minY;

    if (circuitW <= 0 || circuitH <= 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const padding = 40;
    const scaleX = (containerW - padding * 2) / circuitW;
    const scaleY = (containerH - padding * 2) / circuitH;
    const optimalZoom = Math.max(0.35, Math.min(1.5, Math.min(scaleX, scaleY)));

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const newPanX = containerW / 2 - centerX * optimalZoom;
    const newPanY = containerH / 2 - centerY * optimalZoom;

    setZoom(Number(optimalZoom.toFixed(2)));
    setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
    setToastMessage(`Fitted to screen (${Math.round(optimalZoom * 100)}%)`);
  };

  // Canvas Mouse events for Dragging, Resizing & Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || (editorMode === 'SELECT' && e.target === svgRef.current)) {
      setIsPanning(true);
      setStartPanMouse({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    setMousePos(coords);

    // Handle Comment Box Resizing
    if (resizingNodeId) {
      const dx = (e.clientX - startResizeMouse.x) / zoom;
      const dy = (e.clientY - startResizeMouse.y) / zoom;
      const newWidth = Math.max(140, Math.min(800, Math.round((startResizeDim.width + dx) / 5) * 5));
      const newHeight = Math.max(80, Math.min(600, Math.round((startResizeDim.height + dy) / 5) * 5));

      setCircuit(prev => ({
        ...prev,
        nodes: prev.nodes.map(n => n.id === resizingNodeId ? { ...n, width: newWidth, height: newHeight } : n),
      }));
      return;
    }

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
              x: Math.max(20, Math.round((coords.x - dragOffset.x) / 10) * 10),
              y: Math.max(20, Math.round((coords.y - dragOffset.y) / 10) * 10),
            };
          }
          return n;
        }),
      }));
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      setMousePos(coords);

      if (e.target === svgRef.current) {
        setIsPanning(true);
        setStartPanMouse({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
      }
    } else if (e.touches.length === 2) {
      // Two-Finger Pinch-to-Zoom Gesture Initialization
      setDraggingNodeId(null);
      setIsPanning(true);
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;

      pinchRef.current = {
        initialDist: dist,
        initialZoom: zoom,
        initialPan: { x: pan.x, y: pan.y },
        midX,
        midY,
      };
      setStartPanMouse({ x: midX - pan.x, y: midY - pan.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Two-Finger Pinch-to-Zoom & Pan Gesture
    if (e.touches.length === 2) {
      if (pinchRef.current && svgRef.current) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const currentMidX = (touch1.clientX + touch2.clientX) / 2;
        const currentMidY = (touch1.clientY + touch2.clientY) / 2;

        const { initialDist, initialZoom, initialPan, midX: startMidX, midY: startMidY } = pinchRef.current;
        if (initialDist > 8) {
          const scale = currentDist / initialDist;
          const newZoom = Math.max(0.25, Math.min(3.0, Number((initialZoom * scale).toFixed(3))));

          const rect = svgRef.current.getBoundingClientRect();
          const cx = startMidX - rect.left;
          const cy = startMidY - rect.top;

          const newPanX = cx - (cx - initialPan.x) * (newZoom / initialZoom) + (currentMidX - startMidX);
          const newPanY = cy - (cy - initialPan.y) * (newZoom / initialZoom) + (currentMidY - startMidY);

          setZoom(newZoom);
          setPan({ x: Math.round(newPanX), y: Math.round(newPanY) });
        }
      }
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      setMousePos(coords);

      // If dragging a wire on mobile touch, check what element is underneath finger
      if (wireStart) {
        const elem = document.elementFromPoint(touch.clientX, touch.clientY);
        const portElem = elem?.closest?.('[data-is-port="true"]');
        if (portElem) {
          const hoverNodeId = portElem.getAttribute('data-node-id');
          const hoverPortIndex = parseInt(portElem.getAttribute('data-port-index') || '0', 10);
          const hoverType = portElem.getAttribute('data-port-type') as 'input' | 'output';
          if (hoverNodeId && hoverType) {
            setHoveredPort({ nodeId: hoverNodeId, portIndex: hoverPortIndex, type: hoverType });
          }
        } else {
          setHoveredPort(null);
        }
        return;
      }

      if (resizingNodeId) {
        const dx = (touch.clientX - startResizeMouse.x) / zoom;
        const dy = (touch.clientY - startResizeMouse.y) / zoom;
        const newWidth = Math.max(140, Math.min(800, Math.round((startResizeDim.width + dx) / 5) * 5));
        const newHeight = Math.max(80, Math.min(600, Math.round((startResizeDim.height + dy) / 5) * 5));

        setCircuit(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => n.id === resizingNodeId ? { ...n, width: newWidth, height: newHeight } : n),
        }));
        return;
      }

      if (draggingNodeId) {
        setCircuit(prev => ({
          ...prev,
          nodes: prev.nodes.map(n => {
            if (n.id === draggingNodeId) {
              return {
                ...n,
                x: Math.max(20, Math.round((coords.x - dragOffset.x) / 10) * 10),
                y: Math.max(20, Math.round((coords.y - dragOffset.y) / 10) * 10),
              };
            }
            return n;
          }),
        }));
        return;
      }

      if (isPanning) {
        setPan({
          x: touch.clientX - startPanMouse.x,
          y: touch.clientY - startPanMouse.y,
        });
        return;
      }
    }
  };

  const handleTouchEnd = (e?: React.TouchEvent) => {
    if (!e || e.touches.length < 2) {
      pinchRef.current = null;
    }
    if (e && e.touches.length === 1) {
      const touch = e.touches[0];
      setStartPanMouse({ x: touch.clientX - pan.x, y: touch.clientY - pan.y });
    }
    // If user dragged a wire and released over a destination port, connect immediately!
    if (wireStart && hoveredPort) {
      if (hoveredPort.nodeId !== wireStart.nodeId || hoveredPort.portIndex !== wireStart.portIndex || hoveredPort.type !== wireStart.type) {
        executePortConnection(hoveredPort.nodeId, hoveredPort.portIndex, hoveredPort.type);
        return;
      }
    }
    if (!e || e.touches.length === 0) {
      handleMouseUp();
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    if (resizingNodeId) {
      setResizingNodeId(null);
      pushHistory(circuit);
      setToastMessage('Note resized.');
      return;
    }
    if (draggingNodeId) {
      setDraggingNodeId(null);
      pushHistory(circuit);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (ignoreNextCanvasClickRef.current) {
      ignoreNextCanvasClickRef.current = false;
      return;
    }
    if (e.target === svgRef.current) {
      if (wireStart) {
        setWireStart(null);
        setHoveredPort(null);
        setToastMessage('Wiring cancelled.');
      }
      setSelectedNodeId(null);
      setSelectedWireId(null);
    }
  };

  const handleNodeDragStart = (e: React.MouseEvent, nodeId: string) => {
    if (wireStart) return;
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedWireId(null);
    const node = circuit.nodes.find(n => n.id === nodeId);
    if (!node) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: coords.x - node.x,
      y: coords.y - node.y,
    });
  };

  const handleNodeTouchStart = (e: React.TouchEvent, nodeId: string) => {
    if (e.touches.length !== 1) return;
    const node = circuit.nodes.find(n => n.id === nodeId);
    if (!node) return;

    // While wiring is in progress, do not drag the node!
    // Check if user tapped near any compatible port of this node to auto-connect!
    if (wireStart) {
      e.stopPropagation();
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      const compatibleType = wireStart.type === 'output' ? 'input' : 'output';
      const ports = compatibleType === 'input' ? node.inputs : node.outputs;
      if (ports.length > 0 && node.id !== wireStart.nodeId) {
        let closestIdx = 0;
        let minDist = Infinity;
        ports.forEach((_, idx) => {
          const pCoord = getPortCoordinates(node, idx, compatibleType);
          const dist = Math.hypot(coords.x - pCoord.x, coords.y - pCoord.y);
          if (dist < minDist) {
            minDist = dist;
            closestIdx = idx;
          }
        });
        if (minDist < 90) {
          executePortConnection(node.id, closestIdx, compatibleType);
          return;
        }
      }
      return;
    }

    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setSelectedWireId(null);

    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY);
    setDraggingNodeId(nodeId);
    setDragOffset({
      x: coords.x - node.x,
      y: coords.y - node.y,
    });
  };

  const handleSaveCircuit = () => {
    saveProject(circuit);
    if (onSaveToVault) onSaveToVault(circuit);
    setToastMessage(`Project "${circuit.name}" saved to local storage!`);
  };

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

  const handleOpenTruthTable = () => {
    const res = generateCircuitTruthTable(circuit);
    setTruthTableData(res);
    setShowTruthTableModal(true);
  };

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
  const selectedWire = circuit.wires.find(w => w.id === selectedWireId);

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100vh-4rem)] bg-slate-950 overflow-hidden relative select-none">
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
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-1.5 border-b border-slate-800 bg-slate-900/95 px-3 py-1.5 z-20 shadow-sm">
        {/* Left: Circuit Info & Controls (Full width on mobile, inline on desktop) */}
        <div className="flex items-center justify-between md:justify-start gap-1.5 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-1.5 flex-1 md:flex-initial min-w-0">
            <input
              type="text"
              value={circuit.name}
              onChange={e => setCircuit({ ...circuit, name: e.target.value })}
              className="rounded bg-slate-800/80 px-2 py-1 text-xs font-bold text-white border border-slate-700 focus:border-emerald-500 focus:outline-none w-32 sm:w-52 truncate"
              placeholder="Circuit Name..."
            />

            {/* Simulation Toggle */}
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-bold transition-all shrink-0 ${
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
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800 shrink-0"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mobile Component Menu Button */}
          <button
            onClick={() => setShowMobilePaletteModal(true)}
            className="md:hidden flex items-center gap-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white border border-cyan-400/50 px-2.5 py-1 text-xs font-bold transition-all active:scale-95 shadow-sm shrink-0"
            title="Open Component Box / Add Components"
          >
            <Cpu className="h-3.5 w-3.5 text-cyan-200" />
            <span>+ Components</span>
          </button>
        </div>

        {/* Selected Wire Color Palette Quick Bar (Shown in Toolbar when a wire is selected) */}
        {selectedWireId && selectedWire && (
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/90 px-3 py-1 border border-amber-500/40 shadow-sm animate-in fade-in">
            <Cable className="h-3.5 w-3.5 text-amber-400 shrink-0" />
            <span className="text-[11px] font-bold text-slate-200">Wire Color:</span>
            <div className="flex items-center gap-1.5">
              {WIRE_COLORS.map(wc => (
                <button
                  key={wc.name}
                  onClick={() => {
                    pushHistory({
                      ...circuit,
                      wires: circuit.wires.map(w => w.id === selectedWire.id ? { ...w, color: wc.value || undefined } : w),
                    });
                    setToastMessage(`Wire color: ${wc.name}`);
                  }}
                  className={`w-4 h-4 rounded-full border transition-all hover:scale-125 ${
                    (selectedWire.color || '') === wc.value ? 'ring-2 ring-white scale-110 shadow-md' : 'border-slate-900'
                  }`}
                  style={{ backgroundColor: wc.value || '#64748b' }}
                  title={wc.name}
                />
              ))}
            </div>
            <button
              onClick={() => {
                pushHistory({
                  ...circuit,
                  wires: circuit.wires.filter(w => w.id !== selectedWire.id),
                });
                setSelectedWireId(null);
                setToastMessage('Wire deleted.');
              }}
              title="Delete Wire"
              className="ml-2 text-rose-400 hover:text-rose-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* User-Controlled Properties Panel Toggle Button */}
        {(selectedNode || (selectedWireId && selectedWire)) && (
          <button
            onClick={() => setShowPropertiesPanel(prev => !prev)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              showPropertiesPanel
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-1 ring-amber-300'
                : 'bg-slate-800 text-amber-400 border-amber-500/40 hover:bg-slate-750'
            }`}
            title="Toggle Component / Wire Properties Panel"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Properties</span>
            {showPropertiesPanel && <span className="text-[10px] bg-slate-950/40 text-amber-200 px-1 rounded">Open</span>}
          </button>
        )}

        {/* Center: Tools (Select, Wire, Undo, Redo, Zoom) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full md:w-auto py-0.5 shrink-0">
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

          {/* Wire Crossing (Jump / Crossover) Toggle & Customizer */}
          <div className="relative flex items-center">
            <button
              onClick={() => {
                setWireJumpsEnabled(prev => !prev);
                setToastMessage(`Wire Crossover Jumps: ${!wireJumpsEnabled ? 'Enabled' : 'Disabled'}`);
              }}
              title={`Wire Crossing (Jump / Crossover): ${wireJumpsEnabled ? 'ON' : 'OFF'} (Click to toggle)`}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-l-lg text-xs font-semibold transition-all border ${
                wireJumpsEnabled
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 border-slate-700/60'
              }`}
            >
              <span className="text-sm font-bold leading-none select-none">⌒</span>
              <span className="hidden md:inline">Jump</span>
              <span className={`text-[9px] px-1 py-0.5 rounded font-mono font-bold ${
                wireJumpsEnabled ? 'bg-amber-400/20 text-amber-200' : 'bg-slate-700 text-slate-400'
              }`}>
                {wireJumpsEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
            <button
              onClick={() => setShowJumpSettings(s => !s)}
              title="Adjust Jump Bridge Size & Length"
              className={`px-2 py-1 rounded-r-lg text-xs font-bold transition-all border-y border-r flex items-center gap-1 ${
                showJumpSettings
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : wireJumpsEnabled
                    ? 'bg-amber-500/30 text-amber-200 border-amber-500/40 hover:bg-amber-500/40'
                    : 'text-slate-500 hover:bg-slate-800 border-slate-700/60'
              }`}
            >
              <span className="text-[10px] font-mono hidden sm:inline">H:{jumpBridgeSize} L:{jumpBridgeSpan * 2}</span>
              <span>⚙</span>
            </button>

            {/* Jump Bridge Dimensions Customizer Popover */}
            {showJumpSettings && (
              <div 
                className="fixed inset-x-4 top-16 md:absolute md:inset-x-auto md:top-9 md:left-0 z-50 bg-slate-900/98 border border-amber-500/60 rounded-xl shadow-2xl p-3.5 min-w-[270px] max-w-[340px] backdrop-blur-md animate-in fade-in zoom-in-95"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2.5">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-amber-400">
                    <span className="text-base font-mono leading-none">⌒</span>
                    <span>Bridge Size & Length</span>
                  </div>
                  <button 
                    onClick={() => setShowJumpSettings(false)}
                    className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Live Mini Preview */}
                <div className="h-12 bg-slate-950/80 rounded-lg border border-slate-800 flex items-center justify-center mb-2.5 relative overflow-hidden">
                  <svg width="160" height="40" viewBox="0 0 160 40" className="overflow-visible">
                    <line x1="15" y1="20" x2="145" y2="20" stroke="#64748b" strokeWidth="2.5" />
                    <line x1="80" y1="5" x2="80" y2="35" stroke="#10b981" strokeWidth="2.5" />
                    <circle cx="80" cy="20" r={Math.max(4, Math.min(jumpBridgeSpan, jumpBridgeSize) - 1.5)} fill="#020617" stroke="#1e293b" strokeWidth="1" />
                    {(() => {
                      const { arcPath } = getJumpArcPath(80, 20, Math.PI / 2, { height: jumpBridgeSize, span: jumpBridgeSpan });
                      return (
                        <>
                          <path d={arcPath} fill="none" stroke="#10b981" strokeWidth="6" strokeOpacity="0.4" strokeLinecap="round" />
                          <path d={arcPath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Height / Size Slider */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold text-[11px]">Arch Height (Size):</span>
                    <span className="font-mono text-amber-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {jumpBridgeSize}px
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setJumpBridgeSize(s => Math.max(4, s - 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="4"
                      max="22"
                      step="1"
                      value={jumpBridgeSize}
                      onChange={e => setJumpBridgeSize(Number(e.target.value))}
                      className="flex-1 accent-amber-500 cursor-pointer h-1.5"
                    />
                    <button 
                      onClick={() => setJumpBridgeSize(s => Math.min(22, s + 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Span / Length Slider */}
                <div className="space-y-1 mb-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-semibold text-[11px]">Bridge Length (Span):</span>
                    <span className="font-mono text-cyan-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">
                      {jumpBridgeSpan * 2}px
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setJumpBridgeSpan(s => Math.max(6, s - 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="range"
                      min="6"
                      max="26"
                      step="1"
                      value={jumpBridgeSpan}
                      onChange={e => setJumpBridgeSpan(Number(e.target.value))}
                      className="flex-1 accent-cyan-500 cursor-pointer h-1.5"
                    />
                    <button 
                      onClick={() => setJumpBridgeSpan(s => Math.min(26, s + 1))}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center border border-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Presets */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-[9px] text-slate-400 font-bold uppercase mb-1">Presets:</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { name: 'Small', h: 6, s: 7 },
                      { name: 'Normal', h: 8, s: 10 },
                      { name: 'Wide', h: 12, s: 15 },
                      { name: 'Large', h: 16, s: 20 },
                    ].map(p => (
                      <button
                        key={p.name}
                        onClick={() => {
                          setJumpBridgeSize(p.h);
                          setJumpBridgeSpan(p.s);
                          setToastMessage(`Jump Bridge: ${p.name}`);
                        }}
                        className={`px-1 py-0.5 rounded text-[10px] font-bold border transition-colors ${
                          jumpBridgeSize === p.h && jumpBridgeSpan === p.s
                            ? 'bg-amber-500 text-slate-950 border-amber-400'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Buzzer Audio Mute / Unmute Toggle */}
            <button
              onClick={() => {
                const nextMuted = !isAudioMuted;
                buzzerSound.setMuted(nextMuted);
                setIsAudioMuted(nextMuted);
                setToastMessage(nextMuted ? 'Buzzer audio muted' : 'Buzzer audio sound enabled');
              }}
              title={isAudioMuted ? 'Unmute Buzzer Sound' : 'Mute Buzzer Sound'}
              className={`p-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isAudioMuted
                  ? 'text-slate-500 hover:text-slate-300 border-slate-700/60 bg-slate-800/40'
                  : 'text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20'
              }`}
            >
              {isAudioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

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

          {/* Zoom Controller in Toolbar (Image 1 Style: [-] 100% [+] [⤢]) */}
          <div className="flex items-center gap-0.5 rounded-lg bg-slate-950/80 border border-slate-700/80 px-1 py-0.5 shrink-0">
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom to 100%"
              className="text-[11px] font-mono font-bold text-sky-400 hover:text-sky-300 px-1.5 py-0.5 rounded hover:bg-slate-800/60 text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleFitToScreen}
              title="Fit to Screen"
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 mx-1 shrink-0" />

          {/* Right: Actions (Truth Table, Save, Export, Clear) */}
          <div className="flex items-center gap-1.5 shrink-0">
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
      </div>

      {/* Main Workspace: Left Palette + Canvas + Right Inspector */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Component Palette (Left Panel) */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/95 p-3 overflow-y-auto space-y-4 shrink-0 hidden md:block z-10 shadow-xl">
          {/* Search & Filter Component Palette */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={paletteSearch}
              onChange={e => setPaletteSearch(e.target.value)}
              placeholder="Search components..."
              className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-800 text-xs text-slate-200 border border-slate-700/80 focus:border-cyan-500 focus:outline-none placeholder:text-slate-500"
            />
            {paletteSearch && (
              <button
                onClick={() => setPaletteSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Component Categories */}
          {(() => {
            const q = paletteSearch.toLowerCase().trim();
            const matches = (type: string, label: string, sub: string) => {
              if (!q) return true;
              return type.toLowerCase().includes(q) || label.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
            };

            const sections = [
              {
                title: 'Documentation & Notes',
                badge: 'Resizable',
                badgeColor: 'text-amber-400',
                items: [
                  { type: 'COMMENT' as GateType, label: 'Comment Box', sub: 'Drag & resize note' },
                ],
              },
              {
                title: 'Inputs & Power Sources',
                badge: 'Signals',
                badgeColor: 'text-emerald-400',
                items: [
                  { type: 'SWITCH' as GateType, label: 'Switch', sub: '0 / 1 Toggle' },
                  { type: 'PUSH_BUTTON' as GateType, label: 'Push Button', sub: 'Tactile Click' },
                  { type: 'CLOCK' as GateType, label: 'Clock', sub: '1 Hz Pulse' },
                  { type: 'CONST_HIGH' as GateType, label: '+5V (VCC)', sub: 'Constant 1' },
                  { type: 'CONST_LOW' as GateType, label: 'GND (0V)', sub: 'Constant 0' },
                ],
              },
              {
                title: 'Standard Logic Gates',
                badge: 'IEEE',
                badgeColor: 'text-cyan-400',
                items: [
                  { type: 'AND' as GateType, label: 'AND', sub: '2-Input' },
                  { type: 'OR' as GateType, label: 'OR', sub: '2-Input' },
                  { type: 'NOT' as GateType, label: 'NOT', sub: 'Inverter' },
                  { type: 'NAND' as GateType, label: 'NAND', sub: '2-Input' },
                  { type: 'NOR' as GateType, label: 'NOR', sub: '2-Input' },
                  { type: 'XOR' as GateType, label: 'XOR', sub: '2-Input' },
                  { type: 'XNOR' as GateType, label: 'XNOR', sub: '2-Input' },
                  { type: 'BUFFER' as GateType, label: 'Buffer', sub: 'Driver' },
                  { type: 'AND3' as GateType, label: 'AND-3', sub: '3-Input' },
                  { type: 'OR3' as GateType, label: 'OR-3', sub: '3-Input' },
                  { type: 'NAND3' as GateType, label: 'NAND-3', sub: '3-Input' },
                  { type: 'NOR3' as GateType, label: 'NOR-3', sub: '3-Input' },
                  { type: 'XOR3' as GateType, label: 'XOR-3', sub: '3-Input' },
                  { type: 'AND4' as GateType, label: 'AND-4', sub: '4-Input' },
                  { type: 'OR4' as GateType, label: 'OR-4', sub: '4-Input' },
                  { type: 'NAND4' as GateType, label: 'NAND-4', sub: '4-Input' },
                  { type: 'NOR4' as GateType, label: 'NOR-4', sub: '4-Input' },
                  { type: 'TRI_STATE' as GateType, label: 'Tri-State', sub: 'w/ Enable' },
                ],
              },
              {
                title: 'Arithmetic & ALU',
                badge: 'MSI',
                badgeColor: 'text-sky-400',
                items: [
                  { type: 'HALF_ADDER' as GateType, label: 'Half Adder', sub: 'A, B -> S, C' },
                  { type: 'FULL_ADDER' as GateType, label: 'Full Adder', sub: 'A, B, Cin' },
                  { type: 'HALF_SUB' as GateType, label: 'Half Sub', sub: 'A, B -> D, B' },
                  { type: 'FULL_SUB' as GateType, label: 'Full Sub', sub: 'A, B, Bin' },
                  { type: 'MAG_COMP_2BIT' as GateType, label: '2b Comp', sub: 'A>B, =, <' },
                  { type: 'MAG_COMP_4BIT' as GateType, label: '4b Comp', sub: '7485 4-Bit' },
                  { type: 'PARITY_GEN' as GateType, label: 'Parity Gen', sub: '74180 Even/Odd' },
                  { type: 'ALU_4BIT' as GateType, label: '4-Bit ALU', sub: '74181 Arithmetic' },
                ],
              },
              {
                title: 'Multiplexers & Decoders',
                badge: 'Routing',
                badgeColor: 'text-teal-400',
                items: [
                  { type: 'MUX_2TO1' as GateType, label: '2:1 MUX', sub: '2 Data, 1 Sel' },
                  { type: 'MUX_4TO1' as GateType, label: '4:1 MUX', sub: '4 Data, 2 Sel' },
                  { type: 'MUX_8TO1' as GateType, label: '8:1 MUX', sub: '74151 8 Data, 3 Sel' },
                  { type: 'DEMUX_1TO2' as GateType, label: '1:2 DEMUX', sub: '1-to-2 Switch' },
                  { type: 'DEMUX_1TO4' as GateType, label: '1:4 DEMUX', sub: '1-to-4 Switch' },
                  { type: 'DECODER_2TO4' as GateType, label: '2:4 Decoder', sub: 'Active-High' },
                  { type: 'DECODER_3TO8' as GateType, label: '3:8 Decoder', sub: '74138 Active-High' },
                  { type: 'PRIORITY_ENC_4TO2' as GateType, label: 'Priority Enc', sub: '4:2 w/ Valid' },
                ],
              },
              {
                title: 'Sequential & Latches',
                badge: 'Storage',
                badgeColor: 'text-purple-400',
                items: [
                  { type: 'D_LATCH' as GateType, label: 'D Latch', sub: '7475 Transparent' },
                  { type: 'D_FF' as GateType, label: 'D Flip-Flop', sub: 'Edge Triggered' },
                  { type: 'JK_FF' as GateType, label: 'JK Flip-Flop', sub: 'Universal' },
                  { type: 'T_FF' as GateType, label: 'T Flip-Flop', sub: 'Toggle Latch' },
                  { type: 'SR_FF' as GateType, label: 'SR Flip-Flop', sub: 'Set / Reset' },
                  { type: 'REGISTER_4BIT' as GateType, label: '4-Bit Reg', sub: '74173 Parallel' },
                  { type: 'COUNTER_4BIT' as GateType, label: '4-Bit Counter', sub: '0-15 Binary' },
                  { type: 'DECADE_COUNTER' as GateType, label: 'BCD Counter', sub: '7490 Mod-10' },
                  { type: 'SHIFT_REG_4BIT' as GateType, label: 'Shift Register', sub: '4-Bit SIPO' },
                ],
              },
              {
                title: 'Displays & Indicators',
                badge: 'Output',
                badgeColor: 'text-rose-400',
                items: [
                  { type: 'LED' as GateType, label: 'LED Lamp', sub: 'Logic Probe' },
                  { type: 'PROBE' as GateType, label: 'Digital Probe', sub: '0 / 1 / Z Readout' },
                  { type: 'SEVEN_SEG' as GateType, label: '7-Segment LED', sub: 'a..g Numerals' },
                  { type: 'HEX_DISPLAY' as GateType, label: 'Hex Display', sub: '0-F Digital' },
                  { type: 'BAR_GRAPH' as GateType, label: 'Bar Graph', sub: '4-Level Lit' },
                  { type: 'BUZZER' as GateType, label: 'Buzzer', sub: 'Sound / Tone' },
                  { type: 'BCD_TO_7SEG' as GateType, label: 'BCD to 7-Seg', sub: '4-Bit Decoder' },
                ],
              },
              {
                title: 'Discrete & Passive Electronics',
                badge: 'Analog/Discrete',
                badgeColor: 'text-amber-400',
                items: [
                  { type: 'RESISTOR' as GateType, label: 'Resistor', sub: '1kΩ Current Limit' },
                  { type: 'CAPACITOR' as GateType, label: 'Capacitor', sub: '10µF Filter/Tank' },
                  { type: 'INDUCTOR' as GateType, label: 'Inductor', sub: '10mH Choke' },
                  { type: 'DIODE' as GateType, label: 'Diode', sub: '1N4148 Rectifier' },
                  { type: 'ZENER_DIODE' as GateType, label: 'Zener Diode', sub: '5.1V Clamp' },
                  { type: 'TRANSISTOR_NPN' as GateType, label: 'NPN Transistor', sub: '2N3904 Switch' },
                  { type: 'MOSFET_N' as GateType, label: 'N-Ch MOSFET', sub: 'Switching FET' },
                  { type: 'POTENTIOMETER' as GateType, label: 'Potentiometer', sub: 'Variable Divider' },
                  { type: 'RELAY' as GateType, label: 'SPDT Relay', sub: 'Isolated Switch' },
                  { type: 'FUSE' as GateType, label: 'Fuse', sub: 'Overcurrent Protection' },
                ],
              },
            ];

            const renderedSections = sections
              .map(sec => ({
                ...sec,
                filteredItems: sec.items.filter(item => matches(item.type, item.label, item.sub)),
              }))
              .filter(sec => sec.filteredItems.length > 0);

            if (renderedSections.length === 0) {
              return (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No components matching &quot;{paletteSearch}&quot;
                </div>
              );
            }

            return renderedSections.map(sec => (
              <div key={sec.title} className="space-y-1.5">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>{sec.title}</span>
                  <span className={`text-[9px] font-bold ${sec.badgeColor}`}>{sec.badge}</span>
                </h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {sec.filteredItems.map(item => {
                    const isGate = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'AND3', 'OR3', 'NAND3', 'NOR3', 'XOR3', 'AND4', 'OR4', 'NAND4', 'NOR4', 'TRI_STATE'].includes(item.type);
                    return (
                      <button
                        key={item.type}
                        onClick={() => addComponent(item.type)}
                        title={`Add ${item.label} to circuit canvas`}
                        className="flex flex-col items-start p-2 rounded-lg bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs font-semibold transition-all hover:border-cyan-400/50 group text-left"
                      >
                        <div className="flex items-center gap-1.5 w-full mb-0.5">
                          <ComponentSymbolIcon type={item.type} className="h-4 w-5 shrink-0" />
                          <span className="truncate text-white font-bold text-[11px] leading-tight">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 truncate w-full leading-none font-normal">
                          {item.sub}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

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
          className="flex-1 relative h-full circuit-grid overflow-hidden select-none touch-none"
          style={{ touchAction: 'none' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleCanvasClick}
        >
          {/* Floating Canvas Zoom & View Controls (Image 1 replica: [-] 100% [+] [⤢]) */}
          <div 
            className="absolute bottom-5 right-4 z-30 flex items-center gap-1 rounded-xl bg-slate-900/95 border border-slate-700/80 px-2 py-1 shadow-2xl backdrop-blur-md select-none"
            onClick={e => e.stopPropagation()}
            onTouchStart={e => e.stopPropagation()}
          >
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={handleResetZoom}
              title="Reset Zoom (100%)"
              className="px-2 py-0.5 text-xs font-mono font-bold text-sky-400 hover:text-sky-300 rounded hover:bg-slate-800/80 active:scale-95 transition-all"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <div className="h-3.5 w-[1px] bg-slate-700 mx-0.5" />
            <button
              onClick={handleFitToScreen}
              title="Fit All Circuit Components to Screen"
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>

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
            <div className="absolute top-3 md:bottom-5 md:top-auto left-1/2 -translate-x-1/2 z-40 max-w-[94vw] rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white font-bold px-4 py-2 text-xs shadow-2xl flex items-center justify-between gap-3 border border-emerald-400/40 backdrop-blur-md">
              <div className="flex items-center gap-2 truncate">
                <Cable className="h-4 w-4 shrink-0 text-emerald-200 animate-pulse" />
                <span className="truncate">
                  Connecting <span className="text-emerald-100 font-extrabold underline">{circuit.nodes.find(n => n.id === wireStart.nodeId)?.label || 'Node'}</span> ({wireStart.type.toUpperCase()}) → Tap glowing <span className="text-amber-200 uppercase">{wireStart.type === 'output' ? 'INPUT' : 'OUTPUT'}</span> pin
                </span>
              </div>
              <button 
                onClick={e => {
                  e.stopPropagation();
                  setWireStart(null);
                  setHoveredPort(null);
                  setToastMessage('Wiring cancelled.');
                }}
                onTouchStart={e => {
                  e.stopPropagation();
                  setWireStart(null);
                  setHoveredPort(null);
                  setToastMessage('Wiring cancelled.');
                }}
                className="shrink-0 px-3 py-1 rounded-full bg-slate-950/80 hover:bg-slate-950 text-white text-[11px] font-bold border border-slate-700/60 active:scale-95 transition-all shadow"
              >
                ✕ Cancel
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

              // User-selected custom wire color vs default state color
              let strokeColor: string;
              let glowColor: string;

              if (isSelected) {
                strokeColor = '#f59e0b';
                glowColor = '#f59e0b';
              } else if (wire.color) {
                strokeColor = wire.color;
                glowColor = wire.color;
              } else {
                strokeColor = isHigh ? '#10b981' : isUndefined ? '#eab308' : '#64748b';
                glowColor = isHigh ? '#10b981' : '#eab308';
              }

              const midX = (p1.x + p2.x) / 2;
              const midY = (p1.y + p2.y) / 2;

              return (
                <g 
                  key={wire.id} 
                  className="group cursor-pointer"
                  onMouseDown={e => {
                    e.stopPropagation();
                  }}
                  onClick={e => {
                    e.stopPropagation();
                    ignoreNextCanvasClickRef.current = true;
                    setSelectedWireId(wire.id);
                    setSelectedNodeId(null);
                    setToastMessage('Wire selected. Color plate opened.');
                  }}
                >
                  {/* Invisible wide stroke for guaranteed single-click selection */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity="0.001"
                    strokeWidth="32"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  />

                  {/* Wire Glowing Halo */}
                  {(isSelected || isHigh || (wire.color && isHigh)) && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke={glowColor}
                      strokeWidth={isSelected ? '8' : '6'}
                      strokeOpacity={isSelected ? 0.6 : 0.25}
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
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  />

                  {/* Signal Indicator Bead */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r={isSelected ? 6 : 4.5}
                    fill={strokeColor}
                    stroke={isSelected ? '#f59e0b' : '#0f172a'}
                    strokeWidth={isSelected ? 2 : 1.5}
                    style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  />
                </g>
              );
            })}

            {/* Wire Crossing (Jump / Crossover) Bridges */}
            {wireJumpsEnabled && wireCrossovers.map(jump => {
              const jumpWire = simResult.wires.find(w => w.id === jump.jumpingWireId);
              const isSelected = selectedWireId === jump.jumpingWireId;
              const isHigh = jumpWire?.value === 1;
              const isUndefined = jumpWire?.value === 'X' || jumpWire?.value === 'Z';

              let strokeColor: string;
              let glowColor: string;
              if (isSelected) {
                strokeColor = '#f59e0b';
                glowColor = '#f59e0b';
              } else if (jumpWire?.color) {
                strokeColor = jumpWire.color;
                glowColor = jumpWire.color;
              } else {
                strokeColor = isHigh ? '#10b981' : isUndefined ? '#eab308' : '#64748b';
                glowColor = isHigh ? '#10b981' : '#eab308';
              }

              const { arcPath, maskCircle } = getJumpArcPath(jump.x, jump.y, jump.jumpAngle, { height: jumpBridgeSize, span: jumpBridgeSpan });

              return (
                <g 
                  key={jump.id}
                  className="cursor-pointer group"
                  onClick={e => {
                    e.stopPropagation();
                    ignoreNextCanvasClickRef.current = true;
                    setSelectedWireId(jump.jumpingWireId);
                    setSelectedNodeId(null);
                    setToastMessage('Crossover Jump selected (Jumping Wire).');
                  }}
                >
                  {/* Background clearance mask to block out the under-wire at crossing */}
                  <circle
                    cx={maskCircle.cx}
                    cy={maskCircle.cy}
                    r={maskCircle.r}
                    fill="#0f172a"
                    stroke="#1e293b"
                    strokeWidth="1"
                  />

                  {/* Glowing halo for the jump arch */}
                  {(isSelected || isHigh || (jumpWire?.color && isHigh)) && (
                    <path
                      d={arcPath}
                      fill="none"
                      stroke={glowColor}
                      strokeWidth={isSelected ? '8' : '6'}
                      strokeOpacity={isSelected ? 0.6 : 0.3}
                      strokeLinecap="round"
                    />
                  )}

                  {/* Main Jump Arch Path */}
                  <path
                    d={arcPath}
                    fill="none"
                    stroke={strokeColor}
                    strokeWidth={isSelected ? '4' : '3'}
                    strokeLinecap="round"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  />
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
                  <path
                    d={rubberPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="8"
                    strokeOpacity="0.3"
                    strokeLinecap="round"
                  />
                  <path
                    d={rubberPath}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeDasharray="6 4"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
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
              const isComment = node.type === 'COMMENT';
              const isGate = ['AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR', 'BUFFER', 'AND3', 'OR3', 'NAND3', 'NOR3', 'XOR3', 'AND4', 'OR4', 'NAND4', 'NOR4', 'TRI_STATE'].includes(node.type);
              const isSwitch = node.type === 'SWITCH' || node.type === 'CLOCK';
              const isPushButton = node.type === 'PUSH_BUTTON';
              const isConst = node.type === 'CONST_HIGH' || node.type === 'CONST_LOW';
              const isProbe = node.type === 'PROBE';
              const isSevenSeg = node.type === 'SEVEN_SEG';
              const isHexDisplay = node.type === 'HEX_DISPLAY';
              const isBarGraph = node.type === 'BAR_GRAPH';
              const isBuzzer = node.type === 'BUZZER';
              const isCounter = node.type === 'COUNTER_4BIT' || node.type === 'DECADE_COUNTER';
              const isShiftReg = node.type === 'SHIFT_REG_4BIT';
              const isRegister = node.type === 'REGISTER_4BIT';
              const isLed = node.type === 'LED';
              const isFF = node.type.endsWith('_FF') || node.type === 'D_LATCH';
              const isDiscrete = ['RESISTOR', 'CAPACITOR', 'INDUCTOR', 'DIODE', 'ZENER_DIODE', 'TRANSISTOR_NPN', 'MOSFET_N', 'POTENTIOMETER', 'RELAY', 'FUSE'].includes(node.type);
              const isMsi = [
                'HALF_ADDER', 'FULL_ADDER', 'HALF_SUB', 'FULL_SUB',
                'MUX_2TO1', 'MUX_4TO1', 'MUX_8TO1', 'DEMUX_1TO2', 'DEMUX_1TO4',
                'DECODER_2TO4', 'DECODER_3TO8', 'PRIORITY_ENC_4TO2', 'MAG_COMP_2BIT', 'MAG_COMP_4BIT', 'PARITY_GEN', 'ALU_4BIT', 'BCD_TO_7SEG'
              ].includes(node.type);
              const { width, height } = getNodeDimensions(node);

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onMouseDown={e => handleNodeDragStart(e, node.id)}
                  onTouchStart={e => handleNodeTouchStart(e, node.id)}
                  style={{ touchAction: 'none' }}
                  className="cursor-move group"
                >
                  {/* Comment Box / Note Annotation Rendering */}
                  {isComment ? (
                    <g>
                      {/* Background Note Card */}
                      <rect
                        width={width}
                        height={height}
                        rx="8"
                        fill={node.color ? `${node.color}18` : '#eab30818'}
                        stroke={isSelected ? '#10b981' : node.color || '#eab308'}
                        strokeWidth={isSelected ? '2.5' : '1.5'}
                        strokeDasharray={isSelected ? undefined : '4 2'}
                        filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"
                      />
                      {/* Header bar */}
                      <rect
                        width={width}
                        height="26"
                        rx="8"
                        fill={node.color ? `${node.color}30` : '#eab30830'}
                      />
                      <rect
                        y="18"
                        width={width}
                        height="8"
                        fill={node.color ? `${node.color}30` : '#eab30830'}
                      />
                      <text
                        x="10"
                        y="17"
                        fill={node.color || '#eab308'}
                        fontSize="10"
                        fontWeight="bold"
                        className="select-none tracking-wide"
                      >
                        📌 {node.label || 'Note'}
                      </text>

                      {/* Editable Textarea inside foreignObject */}
                      <foreignObject x="8" y="30" width={width - 16} height={height - 40}>
                        <textarea
                          value={node.commentText || ''}
                          onChange={e => {
                            const newText = e.target.value;
                            setCircuit(prev => ({
                              ...prev,
                              nodes: prev.nodes.map(n => n.id === node.id ? { ...n, commentText: newText } : n),
                            }));
                          }}
                          onMouseDown={e => e.stopPropagation()}
                          placeholder="Type notes, formulas or pin descriptions here..."
                          className="w-full h-full bg-transparent text-slate-100 text-xs resize-none outline-none font-sans leading-relaxed p-1"
                          style={{ color: '#f8fafc' }}
                        />
                      </foreignObject>

                      {/* Interactive Bottom-Right Corner Resize Grip Handle */}
                      <g
                        transform={`translate(${width - 16}, ${height - 16})`}
                        className="cursor-se-resize"
                        onMouseDown={e => handleResizeMouseDown(e, node.id, width, height)}
                        onTouchStart={e => handleResizeTouchStart(e, node.id, width, height)}
                        onClick={e => e.stopPropagation()}
                        style={{ touchAction: 'none' }}
                      >
                        {/* Invisible large touch hit area */}
                        <rect
                          x="-8"
                          y="-8"
                          width="24"
                          height="24"
                          fill="transparent"
                          className="cursor-se-resize"
                        />
                        {/* Diagonal grip stripes */}
                        <line x1="12" y1="2" x2="2" y2="12" stroke={node.color || '#eab308'} strokeWidth="2" strokeLinecap="round" className="opacity-70 group-hover:opacity-100" />
                        <line x1="12" y1="7" x2="7" y2="12" stroke={node.color || '#eab308'} strokeWidth="2" strokeLinecap="round" className="opacity-70 group-hover:opacity-100" />
                      </g>
                    </g>
                  ) : (
                    <>
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

                      {/* Interactive Switch / Clock Widget */}
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

                      {/* Interactive Push Button Widget */}
                      {isPushButton && (
                        <g
                          onClick={e => {
                            e.stopPropagation();
                            toggleSwitch(node.id);
                          }}
                          className="cursor-pointer group"
                        >
                          <circle
                            cx={width / 2}
                            cy="38"
                            r="18"
                            fill="#0f172a"
                            stroke={node.state?.highValue ? '#10b981' : '#475569'}
                            strokeWidth="2.5"
                          />
                          <circle
                            cx={width / 2}
                            cy="38"
                            r={node.state?.highValue ? '13' : '15'}
                            fill={node.state?.highValue ? '#10b981' : '#334155'}
                            filter={node.state?.highValue ? 'drop-shadow(0 0 8px #10b981)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))'}
                            className="transition-all"
                          />
                          <text
                            x={width / 2}
                            y="67"
                            fill={node.state?.highValue ? '#10b981' : '#94a3b8'}
                            fontSize="9"
                            fontWeight="bold"
                            textAnchor="middle"
                          >
                            {node.state?.highValue ? 'PRESS (1)' : 'PRESS (0)'}
                          </text>
                        </g>
                      )}

                      {/* Constant Power (+5V) or Ground (GND) Source */}
                      {isConst && (
                        <g className="select-none">
                          {node.type === 'CONST_HIGH' ? (
                            <>
                              <circle cx={width / 2} cy="36" r="14" fill="#10b98120" stroke="#10b981" strokeWidth="2" />
                              <path d={`M ${width / 2} 27 L ${width / 2} 45 M ${width / 2 - 9} 36 L ${width / 2 + 9} 36`} stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
                              <text x={width / 2} y="65" fill="#10b981" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                +5V (1)
                              </text>
                            </>
                          ) : (
                            <>
                              <circle cx={width / 2} cy="34" r="14" fill="#64748b20" stroke="#64748b" strokeWidth="2" />
                              <line x1={width / 2 - 9} y1="31" x2={width / 2 + 9} y2="31" stroke="#94a3b8" strokeWidth="2.5" />
                              <line x1={width / 2 - 6} y1="36" x2={width / 2 + 6} y2="36" stroke="#94a3b8" strokeWidth="2" />
                              <line x1={width / 2 - 3} y1="41" x2={width / 2 + 3} y2="41" stroke="#94a3b8" strokeWidth="1.5" />
                              <text x={width / 2} y="65" fill="#94a3b8" fontSize="9.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                GND (0)
                              </text>
                            </>
                          )}
                        </g>
                      )}

                      {/* Digital Logic Probe */}
                      {isProbe && (() => {
                        const pVal = node.inputs[0]?.value;
                        const isHigh = pVal === 1;
                        const isLow = pVal === 0;
                        const isZ = pVal === 'Z';
                        const valColor = isHigh ? '#10b981' : isLow ? '#64748b' : isZ ? '#38bdf8' : '#eab308';
                        const valText = isHigh ? '1' : isLow ? '0' : isZ ? 'Z' : '?';

                        return (
                          <g className="select-none">
                            <rect x="22" y="24" width="52" height="34" rx="6" fill="#020617" stroke={valColor} strokeWidth="2" />
                            <text
                              x="48"
                              y="48"
                              fill={valColor}
                              fontSize="20"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                              filter={isHigh ? 'drop-shadow(0 0 6px #10b981)' : undefined}
                            >
                              {valText}
                            </text>
                            <text x="48" y="68" fill={valColor} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {isHigh ? 'HIGH' : isLow ? 'LOW' : isZ ? 'HI-Z' : 'FLOAT'}
                            </text>
                          </g>
                        );
                      })()}

                      {/* 7-Segment LED Display Module */}
                      {isSevenSeg && (() => {
                        const segA = node.inputs[0]?.value === 1;
                        const segB = node.inputs[1]?.value === 1;
                        const segC = node.inputs[2]?.value === 1;
                        const segD = node.inputs[3]?.value === 1;
                        const segE = node.inputs[4]?.value === 1;
                        const segF = node.inputs[5]?.value === 1;
                        const segG = node.inputs[6]?.value === 1;

                        const segPattern = [segA, segB, segC, segD, segE, segF, segG].map(v => v ? '1' : '0').join('');
                        const DIGIT_MAP: Record<string, string> = {
                          '1111110': '0',
                          '0110000': '1',
                          '1101101': '2',
                          '1111001': '3',
                          '0110011': '4',
                          '1011011': '5',
                          '1011111': '6',
                          '1110000': '7',
                          '1111111': '8',
                          '1111011': '9',
                          '1110111': 'A',
                          '0011111': 'b',
                          '1001110': 'C',
                          '0111101': 'd',
                          '1001111': 'E',
                          '1000111': 'F',
                        };
                        const decodedChar = DIGIT_MAP[segPattern];

                        return (
                          <g className="select-none">
                            <rect x="58" y="26" width="60" height="96" rx="6" fill="#020617" stroke="#334155" strokeWidth="1.5" />
                            {/* Segment a (top) */}
                            <rect x="70" y="34" width="36" height="6" rx="2" fill={segA ? '#ef4444' : '#33415530'} filter={segA ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment b (top right) */}
                            <rect x="104" y="40" width="6" height="30" rx="2" fill={segB ? '#ef4444' : '#33415530'} filter={segB ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment c (bottom right) */}
                            <rect x="104" y="74" width="6" height="30" rx="2" fill={segC ? '#ef4444' : '#33415530'} filter={segC ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment d (bottom) */}
                            <rect x="70" y="104" width="36" height="6" rx="2" fill={segD ? '#ef4444' : '#33415530'} filter={segD ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment e (bottom left) */}
                            <rect x="66" y="74" width="6" height="30" rx="2" fill={segE ? '#ef4444' : '#33415530'} filter={segE ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment f (top left) */}
                            <rect x="66" y="40" width="6" height="30" rx="2" fill={segF ? '#ef4444' : '#33415530'} filter={segF ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Segment g (center) */}
                            <rect x="70" y="69" width="36" height="6" rx="2" fill={segG ? '#ef4444' : '#33415530'} filter={segG ? 'drop-shadow(0 0 6px #ef4444)' : undefined} />
                            {/* Decoded Character Status */}
                            <text x="88" y="138" fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle">
                              {decodedChar ? `NUM: ${decodedChar}` : '7-SEG'}
                            </text>
                          </g>
                        );
                      })()}

                      {/* 4-Bit Binary Counter Live Readout */}
                      {isCounter && (() => {
                        const count = node.state?.counterValue ?? 0;
                        return (
                          <g className="select-none">
                            <rect x={width / 2 - 28} y="26" width="56" height="34" rx="5" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" />
                            <text x={width / 2} y="49" fill="#60a5fa" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                              {count}
                            </text>
                            <text x={width / 2} y="70" fill="#94a3b8" fontSize="8" textAnchor="middle">
                              HEX: {count.toString(16).toUpperCase()}
                            </text>
                            {[0, 1, 2, 3].map(bit => {
                              const bitVal = (count >> bit) & 1;
                              return (
                                <g key={bit} transform={`translate(${width / 2 - 24 + bit * 16}, 84)`}>
                                  <circle cx="0" cy="0" r="4.5" fill={bitVal ? '#10b981' : '#334155'} filter={bitVal ? 'drop-shadow(0 0 4px #10b981)' : undefined} />
                                  <text x="0" y="10" fill="#94a3b8" fontSize="6.5" textAnchor="middle">Q{bit}</text>
                                </g>
                              );
                            })}
                          </g>
                        );
                      })()}

                      {/* 4-Bit Shift Register Live Cells */}
                      {isShiftReg && (
                        <g className="select-none">
                          <rect x={width / 2 - 38} y="34" width="76" height="34" rx="4" fill="#020617" stroke="#a855f7" strokeWidth="1.5" />
                          {[0, 1, 2, 3].map(i => {
                            const v = node.state?.regValues?.[i] ?? 0;
                            return (
                              <g key={i} transform={`translate(${width / 2 - 34 + i * 18}, 37)`}>
                                <rect width="16" height="28" rx="2" fill={v === 1 ? '#a855f730' : '#1e293b'} stroke={v === 1 ? '#c084fc' : '#334155'} strokeWidth="1" />
                                <text x="8" y="18" fill={v === 1 ? '#f3e8ff' : '#64748b'} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{v}</text>
                              </g>
                            );
                          })}
                          <text x={width / 2} y="82" fill="#c084fc" fontSize="8" fontWeight="bold" textAnchor="middle">
                            [Q0 Q1 Q2 Q3]
                          </text>
                        </g>
                      )}

                      {/* 4-Bit Parallel Register Live Cells */}
                      {isRegister && (
                        <g className="select-none">
                          <rect x={width / 2 - 42} y="44" width="84" height="34" rx="4" fill="#020617" stroke="#3b82f6" strokeWidth="1.5" />
                          {[0, 1, 2, 3].map(i => {
                            const v = node.state?.regValues?.[i] ?? 0;
                            return (
                              <g key={i} transform={`translate(${width / 2 - 38 + i * 20}, 47)`}>
                                <rect width="17" height="28" rx="2" fill={v === 1 ? '#3b82f630' : '#1e293b'} stroke={v === 1 ? '#60a5fa' : '#334155'} strokeWidth="1" />
                                <text x="8.5" y="18" fill={v === 1 ? '#93c5fd' : '#64748b'} fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="monospace">{v}</text>
                              </g>
                            );
                          })}
                          <text x={width / 2} y="90" fill="#60a5fa" fontSize="8" fontWeight="bold" textAnchor="middle">
                            {'[D -> Q0 Q1 Q2 Q3]'}
                          </text>
                        </g>
                      )}

                      {/* Hexadecimal 7-Segment / Digit Display */}
                      {isHexDisplay && (() => {
                        const d0 = node.inputs[0]?.value === 1 ? 1 : 0;
                        const d1 = node.inputs[1]?.value === 1 ? 2 : 0;
                        const d2 = node.inputs[2]?.value === 1 ? 4 : 0;
                        const d3 = node.inputs[3]?.value === 1 ? 8 : 0;
                        const hexNum = d3 + d2 + d1 + d0;
                        const hexChar = hexNum.toString(16).toUpperCase();

                        return (
                          <g className="select-none">
                            <rect x={width / 2 - 24} y="24" width="48" height="52" rx="6" fill="#020617" stroke="#06b6d4" strokeWidth="2" />
                            <text
                              x={width / 2}
                              y="62"
                              fill="#22d3ee"
                              fontSize="32"
                              fontWeight="bold"
                              fontFamily="monospace"
                              textAnchor="middle"
                              filter="drop-shadow(0 0 10px #06b6d4)"
                            >
                              {hexChar}
                            </text>
                            <text x={width / 2} y="88" fill="#94a3b8" fontSize="8" fontWeight="bold" textAnchor="middle">
                              DEC: {hexNum}
                            </text>
                          </g>
                        );
                      })()}

                      {/* 4-Bar LED Level Indicator */}
                      {isBarGraph && (
                        <g className="select-none">
                          <rect x={width / 2 - 22} y="24" width="44" height="60" rx="4" fill="#020617" stroke="#334155" strokeWidth="1.5" />
                          {[0, 1, 2, 3].map(i => {
                            const lit = node.inputs[i]?.value === 1;
                            const colors = ['#10b981', '#84cc16', '#f59e0b', '#ef4444'];
                            const barColor = colors[i];
                            return (
                              <rect
                                key={i}
                                x={width / 2 - 18}
                                y={66 - i * 13}
                                width="36"
                                height="9"
                                rx="2"
                                fill={lit ? barColor : '#1e293b'}
                                stroke={lit ? '#ffffff' : '#334155'}
                                strokeWidth="0.8"
                                filter={lit ? `drop-shadow(0 0 6px ${barColor})` : undefined}
                              />
                            );
                          })}
                          <text x={width / 2} y="94" fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                            BARS 0-3
                          </text>
                        </g>
                      )}

                      {/* Audio / Logic Buzzer Indicator */}
                      {isBuzzer && (() => {
                        const active = node.inputs[0]?.value === 1;
                        return (
                          <g className="select-none">
                            <circle
                              cx={width / 2}
                              cy="44"
                              r="18"
                              fill={active ? '#f59e0b25' : '#0f172a'}
                              stroke={active ? '#f59e0b' : '#475569'}
                              strokeWidth="2"
                              filter={active ? 'drop-shadow(0 0 10px #f59e0b)' : undefined}
                            />
                            {/* Speaker Icon */}
                            <path
                              d={`M ${width / 2 - 8} 40 L ${width / 2 - 4} 40 L ${width / 2 + 2} 33 L ${width / 2 + 2} 55 L ${width / 2 - 4} 48 L ${width / 2 - 8} 48 Z`}
                              fill={active ? '#fbbf24' : '#64748b'}
                            />
                            {active && (
                              <>
                                <path d={`M ${width / 2 + 6} 39 A 6 6 0 0 1 ${width / 2 + 6} 49`} fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
                                <path d={`M ${width / 2 + 10} 35 A 11 11 0 0 1 ${width / 2 + 10} 53`} fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" />
                              </>
                            )}
                            <text x={width / 2} y="74" fill={active ? '#fbbf24' : '#94a3b8'} fontSize="8" fontWeight="bold" textAnchor="middle">
                              {active ? '🔊 SOUND' : 'MUTED'}
                            </text>
                          </g>
                        );
                      })()}

                      {/* MSI Combinational ICs (Adders, Subtractors, MUX, Decoders, Comparators) */}
                      {isMsi && (
                        <g className="select-none pointer-events-none">
                          <path
                            d={`M ${width / 2 - 8} 0 A 8 8 0 0 0 ${width / 2 + 8} 0`}
                            fill="#0f172a"
                            stroke={isSelected ? '#10b981' : '#475569'}
                            strokeWidth="1.5"
                          />
                          <rect
                            x={width / 2 - 28}
                            y={height / 2 - 12}
                            width="56"
                            height="24"
                            rx="4"
                            fill="#0f172a80"
                            stroke="#334155"
                            strokeWidth="1"
                          />
                          <text
                            x={width / 2}
                            y={height / 2 + 4}
                            fill="#38bdf8"
                            fontSize="9"
                            fontWeight="bold"
                            fontFamily="monospace"
                            textAnchor="middle"
                          >
                            {node.type.replace('_', ' ')}
                          </text>
                        </g>
                      )}

                      {/* Discrete & Passive Electronic Components Schematic Graphics */}
                      {isDiscrete && (() => {
                        switch (node.type) {
                          case 'RESISTOR':
                            return (
                              <g className="select-none pointer-events-none">
                                <path d="M 16 40 L 26 40 L 32 30 L 40 50 L 48 30 L 56 50 L 64 30 L 72 50 L 78 40 L 88 40" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                <text x={width / 2} y="66" fill="#f59e0b" fontSize="9" fontWeight="bold" textAnchor="middle">1 kΩ</text>
                              </g>
                            );
                          case 'CAPACITOR':
                            return (
                              <g className="select-none pointer-events-none">
                                <path d="M 16 40 L 44 40 M 44 26 L 44 54 M 58 26 L 58 54 M 58 40 L 88 40" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                                <text x={width / 2} y="66" fill="#38bdf8" fontSize="9" fontWeight="bold" textAnchor="middle">10 µF</text>
                              </g>
                            );
                          case 'INDUCTOR':
                            return (
                              <g className="select-none pointer-events-none">
                                <path d="M 14 42 L 24 42 A 7 7 0 0 1 38 42 A 7 7 0 0 1 52 42 A 7 7 0 0 1 66 42 A 7 7 0 0 1 80 42 L 90 42" fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                                <text x={width / 2} y="66" fill="#a855f7" fontSize="9" fontWeight="bold" textAnchor="middle">10 mH</text>
                              </g>
                            );
                          case 'DIODE':
                            return (
                              <g className="select-none pointer-events-none">
                                <path d="M 16 40 L 40 40 M 64 40 L 88 40" stroke="#10b981" strokeWidth="2" />
                                <polygon points="40,28 64,40 40,52" fill="#10b98130" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" />
                                <line x1="64" y1="28" x2="64" y2="52" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
                                <text x={width / 2} y="66" fill="#10b981" fontSize="8.5" fontWeight="bold" textAnchor="middle">1N4148</text>
                              </g>
                            );
                          case 'ZENER_DIODE':
                            return (
                              <g className="select-none pointer-events-none">
                                <path d="M 16 40 L 40 40 M 64 40 L 88 40" stroke="#06b6d4" strokeWidth="2" />
                                <polygon points="40,28 64,40 40,52" fill="#06b6d430" stroke="#06b6d4" strokeWidth="2" strokeLinejoin="round" />
                                <path d="M 60 26 L 64 28 L 64 52 L 68 54" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
                                <text x={width / 2} y="66" fill="#06b6d4" fontSize="8.5" fontWeight="bold" textAnchor="middle">5.1V Zener</text>
                              </g>
                            );
                          case 'TRANSISTOR_NPN':
                            return (
                              <g className="select-none pointer-events-none">
                                <line x1="45" y1="30" x2="45" y2="60" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                                <line x1="16" y1="45" x2="45" y2="45" stroke="#f43f5e" strokeWidth="2" />
                                <line x1="45" y1="36" x2="72" y2="24" stroke="#f43f5e" strokeWidth="2" />
                                <line x1="72" y1="24" x2="98" y2="24" stroke="#f43f5e" strokeWidth="2" />
                                <line x1="45" y1="54" x2="72" y2="66" stroke="#f43f5e" strokeWidth="2" />
                                <line x1="72" y1="66" x2="98" y2="66" stroke="#f43f5e" strokeWidth="2" />
                                <polygon points="66,61 74,67 63,67" fill="#f43f5e" />
                                <text x={width / 2} y="80" fill="#f43f5e" fontSize="8" fontWeight="bold" textAnchor="middle">2N3904 (NPN)</text>
                              </g>
                            );
                          case 'MOSFET_N':
                            return (
                              <g className="select-none pointer-events-none">
                                <line x1="16" y1="45" x2="40" y2="45" stroke="#3b82f6" strokeWidth="2" />
                                <line x1="40" y1="28" x2="40" y2="62" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
                                <line x1="48" y1="28" x2="48" y2="62" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6,4" strokeLinecap="round" />
                                <line x1="48" y1="34" x2="72" y2="24" stroke="#3b82f6" strokeWidth="2" />
                                <line x1="72" y1="24" x2="98" y2="24" stroke="#3b82f6" strokeWidth="2" />
                                <line x1="48" y1="56" x2="72" y2="66" stroke="#3b82f6" strokeWidth="2" />
                                <line x1="72" y1="66" x2="98" y2="66" stroke="#3b82f6" strokeWidth="2" />
                                <polygon points="56,53 48,56 56,59" fill="#3b82f6" />
                                <text x={width / 2} y="80" fill="#3b82f6" fontSize="8" fontWeight="bold" textAnchor="middle">N-MOSFET</text>
                              </g>
                            );
                          case 'POTENTIOMETER':
                            return (
                              <g className="select-none">
                                <path d="M 18 36 L 28 36 L 33 28 L 41 44 L 49 28 L 57 44 L 65 28 L 73 44 L 78 36 L 88 36" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M 53 62 L 53 46 M 50 49 L 53 44 L 56 49" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <text x={width / 2} y="78" fill="#eab308" fontSize="8.5" fontWeight="bold" textAnchor="middle">{node.state?.potValue ?? 100}% (10kΩ)</text>
                              </g>
                            );
                          case 'RELAY': {
                            const isEnergized = Boolean(node.state?.relayState);
                            return (
                              <g className="select-none pointer-events-none">
                                <rect x="20" y="32" width="22" height="34" rx="3" fill="#334155" stroke={isEnergized ? '#10b981' : '#64748b'} strokeWidth="1.5" />
                                <path d="M 23 37 Q 31 32 39 37 Q 23 46 39 46 Q 23 55 39 55 Q 23 63 39 63" fill="none" stroke={isEnergized ? '#10b981' : '#94a3b8'} strokeWidth="1.5" />
                                <circle cx="60" cy="50" r="3" fill="#cbd5e1" />
                                <circle cx="92" cy="36" r="3" fill="#cbd5e1" />
                                <circle cx="92" cy="62" r="3" fill="#cbd5e1" />
                                <line x1="60" y1="50" x2="90" y2={isEnergized ? 37 : 61} stroke={isEnergized ? '#10b981' : '#f59e0b'} strokeWidth="2" strokeLinecap="round" />
                                <text x="74" y="38" fill="#94a3b8" fontSize="7" fontWeight="bold">NO</text>
                                <text x="74" y="65" fill="#94a3b8" fontSize="7" fontWeight="bold">NC</text>
                                <text x={width / 2} y="85" fill={isEnergized ? '#10b981' : '#94a3b8'} fontSize="8" fontWeight="bold" textAnchor="middle">
                                  {isEnergized ? '⚡ ENERGIZED' : 'DE-ENERGIZED'}
                                </text>
                              </g>
                            );
                          }
                          case 'FUSE': {
                            const isBlown = Boolean(node.state?.fuseBlown);
                            return (
                              <g className="select-none pointer-events-none">
                                <rect x="24" y="30" width="56" height="20" rx="4" fill="#020617" stroke={isBlown ? '#ef4444' : '#10b981'} strokeWidth="1.5" />
                                <rect x="24" y="30" width="8" height="20" rx="2" fill="#64748b" />
                                <rect x="72" y="30" width="8" height="20" rx="2" fill="#64748b" />
                                {isBlown ? (
                                  <path d="M 32 40 L 44 40 M 60 40 L 72 40" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                                ) : (
                                  <path d="M 32 40 Q 42 34 52 40 T 72 40" fill="none" stroke="#10b981" strokeWidth="2" />
                                )}
                                <text x={width / 2} y="64" fill={isBlown ? '#ef4444' : '#10b981'} fontSize="8" fontWeight="bold" textAnchor="middle">
                                  {isBlown ? '💥 BLOWN' : '2A FUSE'}
                                </text>
                              </g>
                            );
                          }
                          default:
                            return null;
                        }
                      })()}

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
                        const isValidTarget = wireStart && wireStart.type === 'output' && wireStart.nodeId !== node.id;

                        return (
                          <g key={port.id} className="group">
                            {/* Glowing Target Beacon when this input can receive the active wire */}
                            {isValidTarget && (
                              <circle
                                cx={localX}
                                cy={localY}
                                r="16"
                                fill="#10b981"
                                fillOpacity="0.25"
                                stroke="#10b981"
                                strokeWidth="2.5"
                                strokeDasharray="3 2"
                                className="animate-pulse pointer-events-none"
                              />
                            )}

                            {(isHovered || isStart) && (
                              <circle
                                cx={localX}
                                cy={localY}
                                r="14"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                className="animate-ping opacity-85 pointer-events-none"
                              />
                            )}

                            <circle
                              cx={localX}
                              cy={localY}
                              r={isHovered || isStart ? 6.5 : isValidTarget ? 5.5 : 4.5}
                              fill={isStart ? '#38bdf8' : isValidTarget ? '#34d399' : pColor}
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="transition-all"
                            />

                            <text
                              x={localX + 8}
                              y={localY + 3.5}
                              fill={isValidTarget ? '#34d399' : '#94a3b8'}
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight={isValidTarget ? 'bold' : 'normal'}
                            >
                              {port.name || `In${pIdx + 1}`}
                            </text>

                            {/* Generous Hit Circle for Mobile Touch & Mouse (48px diameter) */}
                            <circle
                              cx={localX}
                              cy={localY}
                              r="24"
                              fill="transparent"
                              className="cursor-crosshair"
                              data-is-port="true"
                              data-node-id={node.id}
                              data-port-index={pIdx}
                              data-port-type="input"
                              style={{ pointerEvents: 'all', touchAction: 'none' }}
                              onMouseDown={e => handlePortMouseDown(e, node.id, pIdx, 'input')}
                              onMouseUp={e => handlePortClickOrUp(e, node.id, pIdx, 'input')}
                              onClick={e => handlePortClickOrUp(e, node.id, pIdx, 'input')}
                              onTouchStart={e => handlePortTouchStart(e, node.id, pIdx, 'input')}
                              onTouchEnd={e => handlePortTouchEnd(e, node.id, pIdx, 'input')}
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
                        const isValidTarget = wireStart && wireStart.type === 'input' && wireStart.nodeId !== node.id;

                        return (
                          <g key={port.id} className="group">
                            {/* Glowing Target Beacon when this output can connect to the active input wire */}
                            {isValidTarget && (
                              <circle
                                cx={localX}
                                cy={localY}
                                r="16"
                                fill="#38bdf8"
                                fillOpacity="0.25"
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                strokeDasharray="3 2"
                                className="animate-pulse pointer-events-none"
                              />
                            )}

                            {(isHovered || isStart) && (
                              <circle
                                cx={localX}
                                cy={localY}
                                r="14"
                                fill="none"
                                stroke="#38bdf8"
                                strokeWidth="2.5"
                                className="animate-ping opacity-85 pointer-events-none"
                              />
                            )}

                            <circle
                              cx={localX}
                              cy={localY}
                              r={isHovered || isStart ? 6.5 : isValidTarget ? 5.5 : 4.5}
                              fill={isStart ? '#38bdf8' : isValidTarget ? '#38bdf8' : pColor}
                              stroke="#0f172a"
                              strokeWidth="2"
                              className="transition-all"
                            />

                            <text
                              x={localX - 8}
                              y={localY + 3.5}
                              fill={isValidTarget ? '#38bdf8' : '#94a3b8'}
                              fontSize="8.5"
                              fontFamily="monospace"
                              fontWeight={isValidTarget ? 'bold' : 'normal'}
                              textAnchor="end"
                            >
                              {port.name || 'Out'}
                            </text>

                            {/* Generous Hit Circle for Mobile Touch & Mouse (48px diameter) */}
                            <circle
                              cx={localX}
                              cy={localY}
                              r="24"
                              fill="transparent"
                              className="cursor-crosshair"
                              data-is-port="true"
                              data-node-id={node.id}
                              data-port-index={pIdx}
                              data-port-type="output"
                              style={{ pointerEvents: 'all', touchAction: 'none' }}
                              onMouseDown={e => handlePortMouseDown(e, node.id, pIdx, 'output')}
                              onMouseUp={e => handlePortClickOrUp(e, node.id, pIdx, 'output')}
                              onClick={e => handlePortClickOrUp(e, node.id, pIdx, 'output')}
                              onTouchStart={e => handlePortTouchStart(e, node.id, pIdx, 'output')}
                              onTouchEnd={e => handlePortTouchEnd(e, node.id, pIdx, 'output')}
                              onMouseEnter={() => setHoveredPort({ nodeId: node.id, portIndex: pIdx, type: 'output' })}
                              onMouseLeave={() => setHoveredPort(null)}
                            />
                          </g>
                        );
                      })}
                    </>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Component / Wire Inspector (Floating Overlay Right Drawer - User Controlled) */}
        {showPropertiesPanel && (selectedNode || (selectedWireId && selectedWire)) && (
          <div className="absolute top-0 right-0 bottom-0 z-40 w-72 max-w-[85vw] border-l border-slate-800 bg-slate-900/98 shadow-2xl p-4 overflow-y-auto backdrop-blur-md animate-in slide-in-from-right duration-150 space-y-4">
            {selectedNode ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-amber-400" />
                    <span>{selectedNode.type === 'COMMENT' ? 'Comment Box' : 'Component Properties'}</span>
                  </h4>
                  <button
                    onClick={() => setShowPropertiesPanel(false)}
                    className="text-xs text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                    title="Close Properties Panel"
                  >
                    ✕
                  </button>
                </div>

                {selectedNode.type === 'COMMENT' ? (
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Title</label>
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

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">Comment Content</label>
                      <textarea
                        value={selectedNode.commentText || ''}
                        onChange={e => {
                          const newText = e.target.value;
                          setCircuit(prev => ({
                            ...prev,
                            nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, commentText: newText } : n),
                          }));
                        }}
                        rows={4}
                        placeholder="Type note or explanation here..."
                        className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">Box Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {NOTE_COLORS.map(nc => (
                          <button
                            key={nc.name}
                            onClick={() => {
                              pushHistory({
                                ...circuit,
                                nodes: circuit.nodes.map(n => n.id === selectedNode.id ? { ...n, color: nc.value } : n),
                              });
                              setToastMessage(`Note color: ${nc.name}`);
                            }}
                            className={`h-7 rounded flex items-center justify-center border transition-all ${
                              selectedNode.color === nc.value ? 'ring-2 ring-white border-transparent scale-105' : 'border-slate-700/60'
                            }`}
                            style={{ backgroundColor: nc.value }}
                            title={nc.name}
                          >
                            {selectedNode.color === nc.value && <Check className="h-3.5 w-3.5 text-slate-950 font-bold" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Box Size Control Quick Presets */}
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">
                        Dimensions (or drag bottom-right corner)
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { label: 'Compact', w: 160, h: 100 },
                          { label: 'Medium', w: 220, h: 140 },
                          { label: 'Large', w: 320, h: 200 }
                        ].map(sz => (
                          <button
                            key={sz.label}
                            onClick={() => {
                              setCircuit(prev => ({
                                ...prev,
                                nodes: prev.nodes.map(n => n.id === selectedNode.id ? { ...n, width: sz.w, height: sz.h } : n),
                              }));
                              setToastMessage(`Note size: ${sz.label}`);
                            }}
                            className="py-1 rounded bg-slate-800 hover:bg-slate-750 text-[10px] font-bold text-slate-300 border border-slate-700"
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Width: {selectedNode.width || 200}px</span>
                        <span>Height: {selectedNode.height || 130}px</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                      <button
                        onClick={duplicateSelected}
                        className="flex items-center justify-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Duplicate Note</span>
                      </button>
                      <button
                        onClick={() => {
                          deleteSelected();
                          setShowPropertiesPanel(false);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Note</span>
                      </button>
                    </div>
                  </div>
                ) : (
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

                    <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
                      <button
                        onClick={duplicateSelected}
                        className="flex items-center justify-center gap-1.5 rounded bg-slate-800 hover:bg-slate-700 py-1.5 text-xs font-semibold text-slate-200 transition-colors"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Duplicate</span>
                      </button>
                      <button
                        onClick={() => {
                          deleteSelected();
                          setShowPropertiesPanel(false);
                        }}
                        className="flex items-center justify-center gap-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Component</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : selectedWire && (() => {
              const fromNode = circuit.nodes.find(n => n.id === selectedWire.fromNodeId);
              const toNode = circuit.nodes.find(n => n.id === selectedWire.toNodeId);

              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Cable className="h-3.5 w-3.5 text-amber-400" />
                      <span>Wire Properties</span>
                    </h4>
                    <button
                      onClick={() => setShowPropertiesPanel(false)}
                      className="text-xs text-slate-500 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors"
                      title="Close Properties Panel"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>From:</span>
                      <span className="font-bold text-slate-200">{fromNode?.label || 'Source'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>To:</span>
                      <span className="font-bold text-slate-200">{toNode?.label || 'Target'}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-400">
                      <span>Signal State:</span>
                      <span className={`font-mono font-bold ${selectedWire.value === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {selectedWire.value === 1 ? '1 (HIGH)' : '0 (LOW)'}
                      </span>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold mb-1.5 block">Wire Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {WIRE_COLORS.map(wc => (
                          <button
                            key={wc.name}
                            onClick={() => {
                              pushHistory({
                                ...circuit,
                                wires: circuit.wires.map(w => w.id === selectedWire.id ? { ...w, color: wc.value || undefined } : w),
                              });
                              setToastMessage(`Wire color: ${wc.name}`);
                            }}
                            className={`h-7 rounded flex items-center justify-center border transition-all ${
                              (selectedWire.color || '') === wc.value ? 'ring-2 ring-white border-transparent scale-105' : 'border-slate-700/60'
                            }`}
                            style={{ backgroundColor: wc.value || '#475569' }}
                            title={wc.name}
                          >
                            {(selectedWire.color || '') === wc.value && <Check className="h-3.5 w-3.5 text-slate-950 font-bold" />}
                          </button>
                        ))}
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-1">Select custom color to tag Power (Red), Data (Blue), Clock (Amber), etc.</span>
                    </div>

                    {/* Wire Crossing Jump Bridge Settings */}
                    <div className="pt-3 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] text-amber-400 uppercase font-semibold flex items-center gap-1">
                          <span className="text-sm font-bold leading-none">⌒</span>
                          <span>Wire Jump Crossover</span>
                        </label>
                        <button
                          onClick={() => setWireJumpsEnabled(prev => !prev)}
                          className={`text-[9px] px-2 py-0.5 rounded font-bold border transition-colors ${
                            wireJumpsEnabled
                              ? 'bg-amber-500 text-slate-950 border-amber-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {wireJumpsEnabled ? 'ENABLED' : 'DISABLED'}
                        </button>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Bridge Height (Size):</span>
                          <span className="font-mono text-amber-400 font-bold bg-slate-800 px-1 rounded">{jumpBridgeSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="4"
                          max="22"
                          value={jumpBridgeSize}
                          onChange={e => setJumpBridgeSize(Number(e.target.value))}
                          className="w-full accent-amber-500 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-slate-400">Bridge Span (Length):</span>
                          <span className="font-mono text-cyan-400 font-bold bg-slate-800 px-1 rounded">{jumpBridgeSpan * 2}px</span>
                        </div>
                        <input
                          type="range"
                          min="6"
                          max="26"
                          value={jumpBridgeSpan}
                          onChange={e => setJumpBridgeSpan(Number(e.target.value))}
                          className="w-full accent-cyan-500 cursor-pointer h-1.5"
                        />
                      </div>

                      <div className="grid grid-cols-4 gap-1 pt-1">
                        {[
                          { name: 'Small', h: 6, s: 7 },
                          { name: 'Normal', h: 8, s: 10 },
                          { name: 'Wide', h: 12, s: 15 },
                          { name: 'Large', h: 16, s: 20 },
                        ].map(p => (
                          <button
                            key={p.name}
                            onClick={() => {
                              setJumpBridgeSize(p.h);
                              setJumpBridgeSpan(p.s);
                              setToastMessage(`Jump Bridge: ${p.name}`);
                            }}
                            className={`py-0.5 rounded text-[9px] font-bold border transition-colors ${
                              jumpBridgeSize === p.h && jumpBridgeSpan === p.s
                                ? 'bg-amber-500 text-slate-950 border-amber-400'
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <button
                        onClick={() => {
                          pushHistory({
                            ...circuit,
                            wires: circuit.wires.filter(w => w.id !== selectedWire.id),
                          });
                          setSelectedWireId(null);
                          setShowPropertiesPanel(false);
                          setToastMessage('Wire deleted.');
                        }}
                        className="w-full flex items-center justify-center gap-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 py-1.5 text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete Wire</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Mobile Component Add Drawer */}
      <div className="md:hidden flex items-center gap-2 px-3 py-2 border-t border-slate-800 bg-slate-900 overflow-x-auto no-scrollbar scroll-smooth shrink-0 z-20 pr-8 shadow-inner">
        {(selectedNode || (selectedWireId && selectedWire)) && (
          <button
            onClick={() => setShowPropertiesPanel(p => !p)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold shrink-0 border transition-all ${
              showPropertiesPanel
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>{showPropertiesPanel ? 'Hide Props' : 'Properties'}</span>
          </button>
        )}
        <button
          onClick={() => setShowJumpSettings(s => !s)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-bold shrink-0 border transition-all ${
            showJumpSettings
              ? 'bg-amber-500 text-slate-950 border-amber-400'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}
          title="Adjust wire jump bridge height & length"
        >
          <span className="text-sm font-bold leading-none">⌒</span>
          <span>Bridge ({jumpBridgeSize}×{jumpBridgeSpan * 2})</span>
        </button>
        <button
          onClick={() => setShowMobilePaletteModal(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-600/30 text-cyan-300 text-xs font-bold shrink-0 border border-cyan-500/50"
        >
          <span>+ All Components (47)</span>
        </button>
        <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Quick:</span>
        <button
          onClick={() => addComponent('COMMENT')}
          className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 text-xs font-bold shrink-0 border border-amber-500/40"
        >
          <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span>Note</span>
        </button>
        {(['SWITCH', 'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'LED'] as GateType[]).map(g => (
          <button
            key={g}
            onClick={() => addComponent(g)}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-slate-200 text-xs font-bold shrink-0 border border-slate-700 active:bg-cyan-950"
          >
            <ComponentSymbolIcon type={g} className="h-3.5 w-4 shrink-0" />
            <span>{g}</span>
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

      {/* Mobile All-Components Picker Modal */}
      {showMobilePaletteModal && (
        <div 
          onClick={() => setShowMobilePaletteModal(false)}
          className="fixed inset-0 z-50 flex flex-col justify-end md:hidden bg-black/70 backdrop-blur-sm"
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-slate-900 border-t border-slate-700 rounded-t-2xl max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Component Box &amp; Electronics</h3>
              </div>
              <button
                onClick={() => setShowMobilePaletteModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
                placeholder="Search gates, ICs, flip-flops, displays..."
                className="w-full px-3 py-1.5 rounded-lg bg-slate-800 text-xs text-white border border-slate-700 focus:border-cyan-500 focus:outline-none placeholder:text-slate-500"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {(() => {
                const q = paletteSearch.toLowerCase().trim();
                const matches = (type: string, label: string, sub: string) => {
                  if (!q) return true;
                  return type.toLowerCase().includes(q) || label.toLowerCase().includes(q) || sub.toLowerCase().includes(q);
                };

                const mobileSections = [
                  {
                    title: 'Documentation & Notes',
                    items: [
                      { type: 'COMMENT' as GateType, label: 'Comment Box', sub: 'Drag & resize note' },
                    ],
                  },
                  {
                    title: 'Inputs & Power Sources',
                    items: [
                      { type: 'SWITCH' as GateType, label: 'Switch', sub: '0 / 1 Toggle' },
                      { type: 'PUSH_BUTTON' as GateType, label: 'Push Button', sub: 'Tactile Click' },
                      { type: 'CLOCK' as GateType, label: 'Clock', sub: '1 Hz Pulse' },
                      { type: 'CONST_HIGH' as GateType, label: '+5V (VCC)', sub: 'Constant 1' },
                      { type: 'CONST_LOW' as GateType, label: 'GND (0V)', sub: 'Constant 0' },
                    ],
                  },
                  {
                    title: 'Standard Logic Gates',
                    items: [
                      { type: 'AND' as GateType, label: 'AND', sub: '2-Input' },
                      { type: 'OR' as GateType, label: 'OR', sub: '2-Input' },
                      { type: 'NOT' as GateType, label: 'NOT', sub: 'Inverter' },
                      { type: 'NAND' as GateType, label: 'NAND', sub: '2-Input' },
                      { type: 'NOR' as GateType, label: 'NOR', sub: '2-Input' },
                      { type: 'XOR' as GateType, label: 'XOR', sub: '2-Input' },
                      { type: 'XNOR' as GateType, label: 'XNOR', sub: '2-Input' },
                      { type: 'BUFFER' as GateType, label: 'Buffer', sub: 'Driver' },
                      { type: 'AND3' as GateType, label: 'AND-3', sub: '3-Input' },
                      { type: 'OR3' as GateType, label: 'OR-3', sub: '3-Input' },
                      { type: 'NAND3' as GateType, label: 'NAND-3', sub: '3-Input' },
                      { type: 'NOR3' as GateType, label: 'NOR-3', sub: '3-Input' },
                      { type: 'XOR3' as GateType, label: 'XOR-3', sub: '3-Input' },
                      { type: 'AND4' as GateType, label: 'AND-4', sub: '4-Input' },
                      { type: 'OR4' as GateType, label: 'OR-4', sub: '4-Input' },
                      { type: 'NAND4' as GateType, label: 'NAND-4', sub: '4-Input' },
                      { type: 'NOR4' as GateType, label: 'NOR-4', sub: '4-Input' },
                      { type: 'TRI_STATE' as GateType, label: 'Tri-State', sub: 'w/ Enable' },
                    ],
                  },
                  {
                    title: 'Arithmetic & ALU',
                    items: [
                      { type: 'HALF_ADDER' as GateType, label: 'Half Adder', sub: 'A, B -> S, C' },
                      { type: 'FULL_ADDER' as GateType, label: 'Full Adder', sub: 'A, B, Cin' },
                      { type: 'HALF_SUB' as GateType, label: 'Half Sub', sub: 'A, B -> D, B' },
                      { type: 'FULL_SUB' as GateType, label: 'Full Sub', sub: 'A, B, Bin' },
                      { type: 'MAG_COMP_2BIT' as GateType, label: '2b Comp', sub: 'A>B, =, <' },
                      { type: 'MAG_COMP_4BIT' as GateType, label: '4b Comp', sub: '7485 4-Bit' },
                      { type: 'PARITY_GEN' as GateType, label: 'Parity Gen', sub: '74180 Even/Odd' },
                      { type: 'ALU_4BIT' as GateType, label: '4-Bit ALU', sub: '74181 Arithmetic' },
                    ],
                  },
                  {
                    title: 'Multiplexers & Decoders',
                    items: [
                      { type: 'MUX_2TO1' as GateType, label: '2:1 MUX', sub: '2 Data, 1 Sel' },
                      { type: 'MUX_4TO1' as GateType, label: '4:1 MUX', sub: '4 Data, 2 Sel' },
                      { type: 'MUX_8TO1' as GateType, label: '8:1 MUX', sub: '74151 8 Data, 3 Sel' },
                      { type: 'DEMUX_1TO2' as GateType, label: '1:2 DEMUX', sub: '1-to-2 Switch' },
                      { type: 'DEMUX_1TO4' as GateType, label: '1:4 DEMUX', sub: '1-to-4 Switch' },
                      { type: 'DECODER_2TO4' as GateType, label: '2:4 Decoder', sub: 'Active-High' },
                      { type: 'DECODER_3TO8' as GateType, label: '3:8 Decoder', sub: '74138 Active-High' },
                      { type: 'PRIORITY_ENC_4TO2' as GateType, label: 'Priority Enc', sub: '4:2 w/ Valid' },
                    ],
                  },
                  {
                    title: 'Sequential & Latches',
                    items: [
                      { type: 'D_LATCH' as GateType, label: 'D Latch', sub: '7475 Transparent' },
                      { type: 'D_FF' as GateType, label: 'D Flip-Flop', sub: 'Edge Triggered' },
                      { type: 'JK_FF' as GateType, label: 'JK Flip-Flop', sub: 'Universal' },
                      { type: 'T_FF' as GateType, label: 'T Flip-Flop', sub: 'Toggle Latch' },
                      { type: 'SR_FF' as GateType, label: 'SR Flip-Flop', sub: 'Set / Reset' },
                      { type: 'REGISTER_4BIT' as GateType, label: '4-Bit Reg', sub: '74173 Parallel' },
                      { type: 'COUNTER_4BIT' as GateType, label: '4-Bit Counter', sub: '0-15 Binary' },
                      { type: 'DECADE_COUNTER' as GateType, label: 'BCD Counter', sub: '7490 Mod-10' },
                      { type: 'SHIFT_REG_4BIT' as GateType, label: 'Shift Register', sub: '4-Bit SIPO' },
                    ],
                  },
                  {
                    title: 'Displays & Indicators',
                    items: [
                      { type: 'LED' as GateType, label: 'LED Lamp', sub: 'Logic Probe' },
                      { type: 'PROBE' as GateType, label: 'Digital Probe', sub: '0 / 1 / Z Readout' },
                      { type: 'SEVEN_SEG' as GateType, label: '7-Segment LED', sub: 'a..g Numerals' },
                      { type: 'HEX_DISPLAY' as GateType, label: 'Hex Display', sub: '0-F Digital' },
                      { type: 'BAR_GRAPH' as GateType, label: 'Bar Graph', sub: '4-Level Lit' },
                      { type: 'BUZZER' as GateType, label: 'Buzzer', sub: 'Sound / Tone' },
                      { type: 'BCD_TO_7SEG' as GateType, label: 'BCD to 7-Seg', sub: '4-Bit Decoder' },
                    ],
                  },
                  {
                    title: 'Discrete & Passive Electronics',
                    items: [
                      { type: 'RESISTOR' as GateType, label: 'Resistor', sub: '1kΩ Current Limit' },
                      { type: 'CAPACITOR' as GateType, label: 'Capacitor', sub: '10µF Filter/Tank' },
                      { type: 'INDUCTOR' as GateType, label: 'Inductor', sub: '10mH Choke' },
                      { type: 'DIODE' as GateType, label: 'Diode', sub: '1N4148 Rectifier' },
                      { type: 'ZENER_DIODE' as GateType, label: 'Zener Diode', sub: '5.1V Clamp' },
                      { type: 'TRANSISTOR_NPN' as GateType, label: 'NPN Transistor', sub: '2N3904 Switch' },
                      { type: 'MOSFET_N' as GateType, label: 'N-Ch MOSFET', sub: 'Switching FET' },
                      { type: 'POTENTIOMETER' as GateType, label: 'Potentiometer', sub: 'Variable Divider' },
                      { type: 'RELAY' as GateType, label: 'SPDT Relay', sub: 'Isolated Switch' },
                      { type: 'FUSE' as GateType, label: 'Fuse', sub: 'Overcurrent Protection' },
                    ],
                  },
                ];

                return mobileSections.map(sec => {
                  const filtered = sec.items.filter(item => matches(item.type, item.label, item.sub));
                  if (filtered.length === 0) return null;
                  return (
                    <div key={sec.title} className="space-y-1.5">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{sec.title}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {filtered.map(item => (
                          <button
                            key={item.type}
                            onClick={() => {
                              addComponent(item.type);
                              setShowMobilePaletteModal(false);
                            }}
                            className="p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-left border border-slate-700/80 active:bg-cyan-950 transition-all flex items-center gap-2.5 shadow-sm active:scale-98"
                          >
                            <div className="flex h-9 w-10 items-center justify-center rounded-lg bg-slate-900 border border-slate-700/60 shrink-0 shadow-inner">
                              <ComponentSymbolIcon type={item.type} className="h-5 w-6 shrink-0" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-white truncate">{item.label}</div>
                              <div className="text-[10px] text-slate-400 truncate">{item.sub}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
