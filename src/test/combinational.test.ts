import { describe, it, expect } from 'vitest';
import { COMBINATIONAL_CIRCUITS } from '../engine/combinational/circuits';

describe('Combinational Circuits Suite', () => {
  it('correctly calculates Half Adder logic', () => {
    const ha = COMBINATIONAL_CIRCUITS.halfAdder;
    expect(ha.evaluate({ a: 0, b: 0 })).toEqual({ sum: 0, carry: 0 });
    expect(ha.evaluate({ a: 1, b: 0 })).toEqual({ sum: 1, carry: 0 });
    expect(ha.evaluate({ a: 0, b: 1 })).toEqual({ sum: 1, carry: 0 });
    expect(ha.evaluate({ a: 1, b: 1 })).toEqual({ sum: 0, carry: 1 });
  });

  it('correctly calculates Full Adder logic with Carry-in', () => {
    const fa = COMBINATIONAL_CIRCUITS.fullAdder;
    expect(fa.evaluate({ a: 1, b: 1, cin: 1 })).toEqual({ sum: 1, cout: 1 });
    expect(fa.evaluate({ a: 1, b: 0, cin: 1 })).toEqual({ sum: 0, cout: 1 });
    expect(fa.evaluate({ a: 0, b: 0, cin: 1 })).toEqual({ sum: 1, cout: 0 });
    expect(fa.evaluate({ a: 0, b: 0, cin: 0 })).toEqual({ sum: 0, cout: 0 });
  });

  it('correctly calculates 4:1 Multiplexer routing', () => {
    const mux = COMBINATIONAL_CIRCUITS.mux4to1;
    // Route I2 (s1=1, s0=0)
    const res = mux.evaluate({ i0: 0, i1: 0, i2: 1, i3: 0, s1: 1, s0: 0 });
    expect(res.y).toBe(1);
    // Route I3 (s1=1, s0=1)
    const res2 = mux.evaluate({ i0: 1, i1: 1, i2: 1, i3: 0, s1: 1, s0: 1 });
    expect(res2.y).toBe(0);
  });

  it('correctly validates 4-to-2 Priority Encoder', () => {
    const enc = COMBINATIONAL_CIRCUITS.encoder4to2;
    // D3 has highest priority
    expect(enc.evaluate({ d0: 1, d1: 1, d2: 1, d3: 1 })).toEqual({ y1: 1, y0: 1, v: 1 });
    // D2 active, D3 inactive
    expect(enc.evaluate({ d0: 1, d1: 1, d2: 1, d3: 0 })).toEqual({ y1: 1, y0: 0, v: 1 });
    // None active
    expect(enc.evaluate({ d0: 0, d1: 0, d2: 0, d3: 0 })).toEqual({ y1: 0, y0: 0, v: 0 });
  });

  it('correctly calculates 2-Bit Magnitude Comparator', () => {
    const comp = COMBINATIONAL_CIRCUITS.comparator2bit;
    // A=2 (10), B=1 (01) -> A > B
    expect(comp.evaluate({ a1: 1, a0: 0, b1: 0, b0: 1 })).toEqual({ gt: 1, eq: 0, lt: 0 });
    // A=3 (11), B=3 (11) -> A = B
    expect(comp.evaluate({ a1: 1, a0: 1, b1: 1, b0: 1 })).toEqual({ gt: 0, eq: 1, lt: 0 });
    // A=0 (00), B=2 (10) -> A < B
    expect(comp.evaluate({ a1: 0, a0: 0, b1: 1, b0: 0 })).toEqual({ gt: 0, eq: 0, lt: 1 });
  });
});
