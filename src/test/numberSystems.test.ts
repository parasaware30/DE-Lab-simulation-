import { describe, it, expect } from 'vitest';
import { 
  convertRadix, 
  computeComplements, 
  addBinary,
  subtractBinary,
  multiplyBinary,
  divideBinary
} from '../engine/numbers/conversions';

describe('Number Systems Calculations', () => {
  it('correctly converts decimal 42 across all radices', () => {
    const res = convertRadix('42', 10);
    expect(res.isValid).toBe(true);
    expect(res.binary).toBe('101010');
    expect(res.octal).toBe('52');
    expect(res.hex).toBe('2A');
  });

  it('correctly converts binary 1101 to decimal and hex', () => {
    const res = convertRadix('1101', 2);
    expect(res.isValid).toBe(true);
    expect(res.decimal).toBe('13');
    expect(res.hex).toBe('D');
  });

  it('correctly converts fractional numbers across radices', () => {
    const res = convertRadix('101.11', 2);
    expect(res.isValid).toBe(true);
    expect(res.decimal).toBe('5.75');
    expect(res.isFractional).toBe(true);
  });

  it('calculates 1\'s and 2\'s complement for positive and negative numbers', () => {
    // Positive +5 (8-bit)
    const pos = computeComplements(5, 8);
    expect(pos.magnitudeBinary).toBe('00000101');
    expect(pos.twosComplement).toBe('00000101');
    expect(pos.bitwiseInversion).toBe('11111010');
    expect(pos.bitwiseTwos).toBe('11111011');
    expect(pos.signBit).toBe(0);

    // Negative -5 (8-bit)
    // 5 = 00000101
    // 1's comp = 11111010
    // 2's comp = 11111011
    const neg = computeComplements(-5, 8);
    expect(neg.onesComplement).toBe('11111010');
    expect(neg.twosComplement).toBe('11111011');
    expect(neg.bitwiseInversion).toBe('11111010');
    expect(neg.bitwiseTwos).toBe('11111011');
    expect(neg.signBit).toBe(1);
  });

  it('performs binary addition with carry calculation', () => {
    // 1011 (11) + 0101 (5) = 10000 (16)
    const add = addBinary('1011', '0101');
    expect(add.sumBinary).toBe('10000');
    expect(add.sumDecimal).toBe(16);
    expect(add.hasCarryOut).toBe(true);
  });

  it('performs binary 2\'s complement subtraction', () => {
    // 1100 (12) - 0101 (5) = 0111 (7)
    const sub = subtractBinary('1100', '0101', 8);
    expect(sub.diffDecimal).toBe(7);
    expect(sub.diffBinary).toBe('111');
    expect(sub.isNegative).toBe(false);

    // 0101 (5) - 1100 (12) = -7
    const subNeg = subtractBinary('0101', '1100', 8);
    expect(subNeg.diffDecimal).toBe(-7);
    expect(subNeg.diffBinary).toBe('-111');
    expect(subNeg.isNegative).toBe(true);
  });

  it('performs binary multiplication and division', () => {
    // 1010 (10) * 0011 (3) = 30 (11110)
    const mul = multiplyBinary('1010', '0011');
    expect(mul.productDecimal).toBe(30);
    expect(mul.productBinary).toBe('11110');

    // 1001 (9) / 0010 (2) = Q: 4 (100), R: 1 (1)
    const div = divideBinary('1001', '0010');
    expect(div.quotientDecimal).toBe(4);
    expect(div.quotientBinary).toBe('100');
    expect(div.remainderDecimal).toBe(1);
    expect(div.remainderBinary).toBe('1');
  });
});
