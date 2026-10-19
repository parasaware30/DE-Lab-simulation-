import { Token, tokenize } from './tokenizer';
import { ASTNode } from './ast';

export class BooleanParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    return this.tokens[this.current] || { type: 'EOF', value: '', pos: 0 };
  }

  private match(...types: string[]): boolean {
    const cur = this.peek();
    return types.includes(cur.type);
  }

  private advance(): Token {
    const cur = this.peek();
    if (cur.type !== 'EOF') {
      this.current++;
    }
    return cur;
  }

  private consume(type: string, message: string): Token {
    const cur = this.peek();
    if (cur.type === type) {
      return this.advance();
    }
    throw new Error(`${message} Found '${cur.value}' instead at index ${cur.pos}`);
  }

  public parse(): ASTNode {
    if (this.peek().type === 'EOF') {
      throw new Error('Empty Boolean expression.');
    }
    const node = this.parseOr();
    if (this.peek().type !== 'EOF') {
      throw new Error(`Unexpected token '${this.peek().value}' at index ${this.peek().pos}`);
    }
    return node;
  }

  // OR has lowest precedence: A + B
  private parseOr(): ASTNode {
    let expr = this.parseXor();

    while (this.match('OR')) {
      this.advance();
      const right = this.parseXor();
      expr = {
        type: 'OR',
        children: [expr, right],
      };
    }

    return expr;
  }

  // XOR precedence: A ^ B
  private parseXor(): ASTNode {
    let expr = this.parseAnd();

    while (this.match('XOR')) {
      this.advance();
      const right = this.parseAnd();
      expr = {
        type: 'XOR',
        children: [expr, right],
      };
    }

    return expr;
  }

  // AND precedence: A * B
  private parseAnd(): ASTNode {
    let expr = this.parseNot();

    while (this.match('AND')) {
      this.advance();
      const right = this.parseNot();
      expr = {
        type: 'AND',
        children: [expr, right],
      };
    }

    return expr;
  }

  // NOT precedence (prefix '!' or '~')
  private parseNot(): ASTNode {
    if (this.match('NOT') && this.peek().value !== "'") {
      this.advance();
      const operand = this.parseNot(); // handles multiple prefix NOTs: !!A
      return {
        type: 'NOT',
        children: [operand],
      };
    }

    return this.parsePostfixNot();
  }

  // Postfix NOT (e.g. A', (A + B)')
  private parsePostfixNot(): ASTNode {
    let expr = this.parsePrimary();

    while (this.match('NOT') && this.peek().value === "'") {
      this.advance();
      expr = {
        type: 'NOT',
        children: [expr],
      };
    }

    return expr;
  }

  // Primary: VARIABLE, CONSTANT, (EXPRESSION)
  private parsePrimary(): ASTNode {
    const token = this.peek();

    if (token.type === 'VARIABLE') {
      this.advance();
      return {
        type: 'VARIABLE',
        value: token.value,
      };
    }

    if (token.type === 'CONSTANT') {
      this.advance();
      return {
        type: 'CONSTANT',
        value: parseInt(token.value, 10),
      };
    }

    if (token.type === 'LPAREN') {
      this.advance();
      const expr = this.parseOr();
      this.consume('RPAREN', "Expected closing parenthesis ')'");
      return expr;
    }

    throw new Error(`Syntax error: Unexpected token '${token.value || 'EOF'}' at position ${token.pos}`);
  }
}

export function parseBooleanExpression(input: string): ASTNode {
  const tokens = tokenize(input);
  const parser = new BooleanParser(tokens);
  return parser.parse();
}

/**
 * Extracts unique variables in alphabetical order from AST
 */
export function extractVariables(ast: ASTNode): string[] {
  const vars = new Set<string>();

  function traverse(node: ASTNode) {
    if (node.type === 'VARIABLE' && typeof node.value === 'string') {
      vars.add(node.value);
    }
    if (node.children) {
      node.children.forEach(traverse);
    }
  }

  traverse(ast);
  return Array.from(vars).sort();
}
