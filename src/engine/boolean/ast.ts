export type ASTNodeType = 
  | 'CONSTANT'
  | 'VARIABLE'
  | 'NOT'
  | 'AND'
  | 'OR'
  | 'XOR';

export interface ASTNode {
  type: ASTNodeType;
  value?: string | number; // variable name or 0/1
  children?: ASTNode[];
}

export interface SimplificationStep {
  rule: string;
  description: string;
  expression: string;
}

export interface SimplificationResult {
  original: string;
  simplified: string;
  steps: SimplificationStep[];
  isEquivalent: boolean;
  variables: string[];
}
