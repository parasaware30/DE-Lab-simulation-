export type LogicValue = 0 | 1 | 'Z' | 'X'; // 0: Low, 1: High, Z: High-Z/Disconnected, X: Undefined/Error

export type GateType = 
  | 'AND' 
  | 'OR' 
  | 'NOT' 
  | 'NAND' 
  | 'NOR' 
  | 'XOR' 
  | 'XNOR'
  | 'BUFFER'
  | 'SWITCH'
  | 'CLOCK'
  | 'LED'
  | 'PROBE'
  | 'SR_FF'
  | 'D_FF'
  | 'JK_FF'
  | 'T_FF'
  | 'SEVEN_SEG';

export interface Port {
  id: string;
  name: string;
  type: 'input' | 'output';
  value: LogicValue;
}

export interface CircuitNode {
  id: string;
  type: GateType;
  label: string;
  x: number;
  y: number;
  inputs: Port[];
  outputs: Port[];
  state?: {
    q?: LogicValue;
    qBar?: LogicValue;
    prevClock?: LogicValue;
    frequency?: number; // for clock
    highValue?: boolean; // for switch
  };
}

export interface Wire {
  id: string;
  fromNodeId: string;
  fromPortIndex: number;
  toNodeId: string;
  toPortIndex: number;
  value: LogicValue;
}

export interface Circuit {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  nodes: CircuitNode[];
  wires: Wire[];
}

export interface SimulationResult {
  nodes: CircuitNode[];
  wires: Wire[];
  isValid: boolean;
  errors: string[];
  warnings: string[];
  cyclesDetected: boolean;
}

export interface TruthTableRow {
  inputs: Record<string, 0 | 1>;
  outputs: Record<string, LogicValue>;
}

export interface TruthTableData {
  inputNames: string[];
  outputNames: string[];
  rows: TruthTableRow[];
}
