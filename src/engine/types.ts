export type LogicValue = 0 | 1 | 'Z' | 'X'; // 0: Low, 1: High, Z: High-Z/Disconnected, X: Undefined/Error

export type GateType = 
  // Signal Sources & Constants
  | 'SWITCH'
  | 'PUSH_BUTTON'
  | 'CLOCK'
  | 'CONST_HIGH'
  | 'CONST_LOW'
  // Fundamental & Extended Logic Gates
  | 'AND' 
  | 'OR' 
  | 'NOT' 
  | 'NAND' 
  | 'NOR' 
  | 'XOR' 
  | 'XNOR'
  | 'BUFFER'
  | 'AND3'
  | 'OR3'
  | 'NAND3'
  | 'NOR3'
  | 'XOR3'
  | 'AND4'
  | 'OR4'
  | 'NAND4'
  | 'NOR4'
  | 'TRI_STATE'
  // MSI Combinational Logic ICs
  | 'HALF_ADDER'
  | 'FULL_ADDER'
  | 'HALF_SUB'
  | 'FULL_SUB'
  | 'MUX_2TO1'
  | 'MUX_4TO1'
  | 'MUX_8TO1'
  | 'DEMUX_1TO2'
  | 'DEMUX_1TO4'
  | 'DECODER_2TO4'
  | 'DECODER_3TO8'
  | 'PRIORITY_ENC_4TO2'
  | 'MAG_COMP_2BIT'
  | 'MAG_COMP_4BIT'
  | 'PARITY_GEN'
  | 'ALU_4BIT'
  // Sequential Flip-Flops & Storage
  | 'SR_FF'
  | 'D_FF'
  | 'JK_FF'
  | 'T_FF'
  | 'D_LATCH'
  | 'REGISTER_4BIT'
  | 'COUNTER_4BIT'
  | 'DECADE_COUNTER'
  | 'SHIFT_REG_4BIT'
  // Displays & Measurement Probes
  | 'LED'
  | 'PROBE'
  | 'SEVEN_SEG'
  | 'BCD_TO_7SEG'
  | 'HEX_DISPLAY'
  | 'BAR_GRAPH'
  | 'BUZZER'
  // Discrete & Passive Electronic Components
  | 'RESISTOR'
  | 'CAPACITOR'
  | 'INDUCTOR'
  | 'DIODE'
  | 'ZENER_DIODE'
  | 'TRANSISTOR_NPN'
  | 'MOSFET_N'
  | 'POTENTIOMETER'
  | 'RELAY'
  | 'FUSE'
  // Extended & Mixed-Signal Electronic Components
  | 'TRANSISTOR_PNP'
  | 'MOSFET_P'
  | 'DIODE_SCHOTTKY'
  | 'LDR_PHOTORESISTOR'
  | 'BATTERY_DC'
  | 'GND'
  | 'OP_AMP'
  | 'IC_555'
  | 'VOLTMETER'
  | 'RGB_LED'
  | 'SCHMITT_NOT'
  | 'CRYSTAL_OSC'
  // Documentation
  | 'COMMENT';

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
  color?: string; // Custom background/accent color
  commentText?: string; // Text content for COMMENT boxes
  width?: number;
  height?: number;
  state?: {
    q?: LogicValue;
    qBar?: LogicValue;
    prevClock?: LogicValue;
    frequency?: number; // for clock
    highValue?: boolean; // for switch/button
    counterValue?: number; // for COUNTER_4BIT / DECADE_COUNTER (0-15)
    regValues?: LogicValue[]; // for SHIFT_REG_4BIT / REGISTER_4BIT
    latchValue?: LogicValue; // for D_LATCH
    relayState?: boolean; // for RELAY
    fuseBlown?: boolean; // for FUSE
    potValue?: number; // for POTENTIOMETER (0 to 100)
    lightLevel?: number; // for LDR_PHOTORESISTOR (0 to 100)
    voltage?: number; // for BATTERY_DC / VOLTMETER
  };
}

export interface Wire {
  id: string;
  fromNodeId: string;
  fromPortIndex: number;
  toNodeId: string;
  toPortIndex: number;
  value: LogicValue;
  color?: string; // Custom wire color
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
