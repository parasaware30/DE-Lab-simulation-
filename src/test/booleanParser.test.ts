import { describe, it, expect } from 'vitest';
import { parseBooleanExpression, extractVariables } from '../engine/boolean/parser';
import { evaluateAST, simplifyBooleanExpression } from '../engine/boolean/evaluator';

describe('Boolean Algebra Parser & Evaluator', () => {
  it('parses basic expressions with variables and constants', () => {
    const ast = parseBooleanExpression('A + B');
    expect(ast.type).toBe('OR');
    expect(ast.children?.length).toBe(2);
    expect(extractVariables(ast)).toEqual(['A', 'B']);
  });

  it('handles operator precedence correctly: AND before OR', () => {
    // A + B * C should parse as A + (B * C)
    const ast = parseBooleanExpression('A + B * C');
    expect(ast.type).toBe('OR');
    expect(ast.children?.[0].type).toBe('VARIABLE');
    expect(ast.children?.[1].type).toBe('AND');
  });

  it('handles implicit AND and postfix NOT notation', () => {
    // AB' + C should be (A · (B)') + C
    const ast = parseBooleanExpression("AB' + C");
    expect(ast.type).toBe('OR');
    const leftAnd = ast.children?.[0];
    expect(leftAnd?.type).toBe('AND');
    expect(leftAnd?.children?.[1].type).toBe('NOT');
  });

  it('evaluates expression correctly with environment values', () => {
    const ast = parseBooleanExpression('A * B + C');
    expect(evaluateAST(ast, { A: 1, B: 1, C: 0 })).toBe(1);
    expect(evaluateAST(ast, { A: 1, B: 0, C: 0 })).toBe(0);
    expect(evaluateAST(ast, { A: 0, B: 0, C: 1 })).toBe(1);
  });

  it('safely throws on invalid syntax without using eval', () => {
    expect(() => parseBooleanExpression('A + * B')).toThrow();
    expect(() => parseBooleanExpression('((A + B)')).toThrow();
    expect(() => parseBooleanExpression('')).toThrow();
  });

  it('simplifies expressions and proves mathematical equivalence', () => {
    // A + AB = A (Absorption Law)
    const res = simplifyBooleanExpression('A + A * B');
    expect(res.simplified).toBe('A');
    expect(res.isEquivalent).toBe(true);

    // A + A' = 1 (Complement Law)
    const tautology = simplifyBooleanExpression("A + A'");
    expect(tautology.simplified).toBe('1');
    expect(tautology.isEquivalent).toBe(true);
  });
});
