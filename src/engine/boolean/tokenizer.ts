export type TokenType = 
  | 'VARIABLE' 
  | 'CONSTANT' 
  | 'NOT' 
  | 'AND' 
  | 'OR' 
  | 'XOR' 
  | 'LPAREN' 
  | 'RPAREN' 
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const s = input.trim();

  while (i < s.length) {
    const ch = s[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(', pos: i });
      i++;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')', pos: i });
      i++;
      continue;
    }

    if (ch === '0' || ch === '1') {
      tokens.push({ type: 'CONSTANT', value: ch, pos: i });
      i++;
      continue;
    }

    if (ch === '+' || ch === '|') {
      tokens.push({ type: 'OR', value: '+', pos: i });
      i++;
      continue;
    }

    if (ch === '*' || ch === '&' || ch === '·' || ch === '•') {
      tokens.push({ type: 'AND', value: '*', pos: i });
      i++;
      continue;
    }

    if (ch === '^' || ch === '⊕') {
      tokens.push({ type: 'XOR', value: '^', pos: i });
      i++;
      continue;
    }

    if (ch === '!' || ch === '~') {
      tokens.push({ type: 'NOT', value: '!', pos: i });
      i++;
      continue;
    }

    if (ch === "'") {
      // Postfix NOT marker
      tokens.push({ type: 'NOT', value: "'", pos: i });
      i++;
      continue;
    }

    // Alphabetic variable or keyword (AND, OR, NOT, XOR)
    if (/[a-zA-Z]/.test(ch)) {
      let word = '';
      const startPos = i;
      while (i < s.length && /[a-zA-Z0-9_]/.test(s[i])) {
        word += s[i];
        i++;
      }
      const upper = word.toUpperCase();
      if (upper === 'AND') {
        tokens.push({ type: 'AND', value: '*', pos: startPos });
      } else if (upper === 'OR') {
        tokens.push({ type: 'OR', value: '+', pos: startPos });
      } else if (upper === 'NOT') {
        tokens.push({ type: 'NOT', value: '!', pos: startPos });
      } else if (upper === 'XOR') {
        tokens.push({ type: 'XOR', value: '^', pos: startPos });
      } else {
        // Break multiple letters into distinct variables (e.g. AB -> A, B or A1B -> A1, B)
        const parts = upper.match(/[A-Z][0-9]*/g) || [upper];
        let offset = 0;
        for (const p of parts) {
          tokens.push({ type: 'VARIABLE', value: p, pos: startPos + offset });
          offset += p.length;
        }
      }
      continue;
    }

    throw new Error(`Unexpected character '${ch}' at index ${i}`);
  }

  // Insert implicit AND tokens where appropriate
  // e.g.:
  // VARIABLE VARIABLE (A B -> A * B)
  // VARIABLE LPAREN (A(B) -> A * (B))
  // RPAREN LPAREN ((A)(B) -> (A) * (B))
  // RPAREN VARIABLE ((A)B -> (A) * B)
  // POSTFIX_NOT VARIABLE (A'B -> A' * B)
  // POSTFIX_NOT LPAREN (A'(B) -> A' * (B))
  // CONSTANT VARIABLE (1A -> 1 * A)
  const normalized: Token[] = [];
  for (let j = 0; j < tokens.length; j++) {
    const cur = tokens[j];
    normalized.push(cur);

    if (j < tokens.length - 1) {
      const next = tokens[j + 1];
      const isCurOperandOrPost = 
        cur.type === 'VARIABLE' || 
        cur.type === 'CONSTANT' || 
        cur.type === 'RPAREN' || 
        (cur.type === 'NOT' && cur.value === "'");

      const isNextOperandOrPre = 
        next.type === 'VARIABLE' || 
        next.type === 'CONSTANT' || 
        next.type === 'LPAREN' || 
        (next.type === 'NOT' && next.value !== "'");

      if (isCurOperandOrPost && isNextOperandOrPre) {
        normalized.push({ type: 'AND', value: '*', pos: cur.pos });
      }
    }
  }

  normalized.push({ type: 'EOF', value: '', pos: s.length });
  return normalized;
}
