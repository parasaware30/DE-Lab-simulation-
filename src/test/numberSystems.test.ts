import { describe, it, expect } from 'vitest';
import { convertRadix, computeComplements, addBinary } from '../engine/numbers/conversions';

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

  it('calculates 1\'s and 2\'s complement for positive and negative numbers', () => {
    // Positive +5 (8-bit)
    const pos = computeComplements(5, 8);
    expect(pos.magnitudeBinary).toBe('00000101');
    expect(pos.twosComplement).toBe('00000101');
    expect(pos.signBit).toBe(0);

    // Negative -5 (8-bit)
    // 5 = 00000101
    // 1's comp = 11111010
    // 2's comp = 11111011
    const neg = computeComplements(-5, 8);
    expect(neg.onesComplement).toBe('11111010');
    expect(neg.twosComplement).toBe('11111011');
    expect(neg.signBit).toBe(1);
  });

  it('performs binary addition with carry calculation', () => {
    // 1011 (11) + 0101 (5) = 10000 (16)
    const add = addBinary('1011', '0101');
    expect(add.sumBinary).toBe('10000');
    expect(add.sumDecimal).toBe(16);
    expect(add.hasCarryOut).toBe(true);
  });
});
