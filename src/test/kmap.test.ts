import { describe, it, expect } from 'vitest';
import { solveKMap, createEmptyKMap } from '../engine/kmap/kmap';

describe('K-Map Solver Engine', () => {
  it('solves 2-variable K-Map for OR function (m1, m2, m3) in SOP and POS', () => {
    const kmap = createEmptyKMap(2);
    // r0,c0=0 (m0=0); r0,c1=1 (m1=1); r1,c0=2 (m2=1); r1,c1=3 (m3=1)
    kmap.grid[0][1] = 1; // m1: A'B
    kmap.grid[1][0] = 1; // m2: AB'
    kmap.grid[1][1] = 1; // m3: AB
    const res = solveKMap(2, kmap.grid);
    expect(res.sop).toContain('A');
    expect(res.sop).toContain('B');

    // For POS: only m0 is 0. Group of 1 maxterm {0} where A=0, B=0 -> (A + B)
    expect(res.pos).toBe('(A + B)');
    expect(res.maxterms).toEqual([0]);
    expect(res.canonicalPOS).toContain('ΠM(0)');
  });

  it('handles 4-corner toroidal wrap-around group in 4-variable K-Map', () => {
    // 4 corners of 4-variable K-Map: minterms 0 (0,0), 2 (0,3), 8 (3,0), 10 (3,3)
    const kmap = createEmptyKMap(4);
    kmap.grid[0][0] = 1; // m0: 00 00 -> B'D'
    kmap.grid[0][3] = 1; // m2: 00 10
    kmap.grid[3][0] = 1; // m8: 10 00
    kmap.grid[3][3] = 1; // m10: 10 10

    const res = solveKMap(4, kmap.grid);
    // Corners group eliminates A and C, leaving B'D'
    expect(res.sop).toBe("B'D'");
    expect(res.groups.length).toBe(1);
    expect(res.groups[0].cells.sort((a,b)=>a-b)).toEqual([0, 2, 8, 10]);
  });

  it('correctly utilizes don\'t-cares (X) to enlarge groups', () => {
    const kmap = createEmptyKMap(2);
    kmap.grid[0][0] = 1; // m0
    kmap.grid[0][1] = 'X'; // m1 (don't care)
    const res = solveKMap(2, kmap.grid);
    // m0 and m1 combine to form group of 2 -> A'
    expect(res.sop).toBe("A'");
  });

  it('solves 3-variable 8-cell K-Map in POS mode', () => {
    const kmap = createEmptyKMap(3);
    // Let maxterms be 0, 1, 2, 3 (where A=0) -> A=0 group of 4 maxterms simplifies to A
    for (let c = 0; c < 4; c++) {
      kmap.grid[0][c] = 0; // m0, m1, m3, m2
      kmap.grid[1][c] = 1; // m4, m5, m7, m6
    }
    const res = solveKMap(3, kmap.grid);
    expect(res.pos).toBe('A');
    expect(res.sop).toBe('A');
  });

  it('solves Image 1 SOP case (m1, m3, m7, m11, m15 with dont-cares 0, 2, 4, 8)', () => {
    const kmap = createEmptyKMap(4);
    // m1, m3, m7, m11, m15 = 1
    // m0, m2, m4, m8 = X
    kmap.grid[0][0] = 'X'; // m0
    kmap.grid[0][1] = 1;   // m1
    kmap.grid[0][2] = 1;   // m3
    kmap.grid[0][3] = 'X'; // m2
    kmap.grid[1][0] = 'X'; // m4
    kmap.grid[1][2] = 1;   // m7
    kmap.grid[2][2] = 1;   // m15
    kmap.grid[3][0] = 'X'; // m8
    kmap.grid[3][2] = 1;   // m11

    const res = solveKMap(4, kmap.grid);
    // Group 1: row 0 {0, 1, 3, 2} -> A'B'
    // Group 2: col 2 {3, 7, 11, 15} -> CD
    expect(res.sop.split(' + ').sort()).toEqual(["A'B'", "CD"].sort());
  });

  it('solves Image 2 POS case', () => {
    const kmap = createEmptyKMap(4);
    // Row 0: m0=X, m1=1, m3=X, m2=0
    kmap.grid[0][0] = 'X'; kmap.grid[0][1] = 1; kmap.grid[0][2] = 'X'; kmap.grid[0][3] = 0;
    // Row 1: m4=X, m5=0, m7=0, m6=1
    kmap.grid[1][0] = 'X'; kmap.grid[1][1] = 0; kmap.grid[1][2] = 0; kmap.grid[1][3] = 1;
    // Row 2: m12=1, m13=1, m15=0, m14=1
    kmap.grid[2][0] = 1; kmap.grid[2][1] = 1; kmap.grid[2][2] = 0; kmap.grid[2][3] = 1;
    // Row 3: m8=X, m9=0, m11=1, m10=0
    kmap.grid[3][0] = 'X'; kmap.grid[3][1] = 0; kmap.grid[3][2] = 1; kmap.grid[3][3] = 0;

    const res = solveKMap(4, kmap.grid);
    // Groups should be:
    // (B + D): corners {0, 2, 8, 10}
    // (A + B' + D'): {5, 7}
    // (B' + C' + D'): {7, 15}
    // (A' + B + C): {8, 9}
    const exprs = res.posGroups.map(g => g.expression);
    expect(exprs).toContain('(B + D)');
    expect(exprs).toContain('(A + B\' + D\')');
    expect(exprs).toContain('(B\' + C\' + D\')');
    expect(exprs).toContain('(A\' + B + C)');
    expect(res.posGroups.length).toBe(4);
  });
});
