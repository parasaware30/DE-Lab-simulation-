export type KMapCell = 0 | 1 | 'X';

export interface KMapGroup {
  id: string;
  color: string;
  cells: number[]; // minterm/maxterm indices
  expression: string;
  isEssential: boolean;
  r: number; // top-left start row
  c: number; // top-left start col
  h: number; // height (row count)
  w: number; // width (col count)
  rowIndices: number[];
  colIndices: number[];
}

export interface KMapResult {
  varCount: 2 | 3 | 4;
  variables: string[];
  grid: KMapCell[][];
  rowLabels: string[];
  colLabels: string[];
  cellMinterms: number[][]; // mapping [r][c] -> minterm number
  groups: KMapGroup[];
  posGroups: KMapGroup[];
  sop: string;
  pos: string;
  canonicalSOP: string;
  canonicalPOS: string;
  minterms: number[];
  maxterms: number[];
  dontCares: number[];
}

export const KMAP_COLORS = [
  '#a855f7', // Purple (like image 2)
  '#10b981', // Emerald Green (like image 2)
  '#f97316', // Orange (like image 2)
  '#ef4444', // Red (like image 2)
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#eab308', // Amber/Yellow
];

export function createEmptyKMap(varCount: 2 | 3 | 4): KMapResult {
  const vars = varCount === 2 ? ['A', 'B'] : varCount === 3 ? ['A', 'B', 'C'] : ['A', 'B', 'C', 'D'];
  const rowLabels = varCount === 2 ? ['0', '1'] : varCount === 3 ? ['0', '1'] : ['00', '01', '11', '10'];
  const colLabels = varCount === 2 ? ['0', '1'] : ['00', '01', '11', '10'];

  const rows = rowLabels.length;
  const cols = colLabels.length;

  const grid: KMapCell[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  const cellMinterms: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cellMinterms[r][c] = coordsToMinterm(varCount, r, c);
    }
  }

  return {
    varCount,
    variables: vars,
    grid,
    rowLabels,
    colLabels,
    cellMinterms,
    groups: [],
    posGroups: [],
    sop: '0',
    pos: '1',
    canonicalSOP: 'Σm(∅)',
    canonicalPOS: 'ΠM(∅)',
    minterms: [],
    maxterms: [],
    dontCares: [],
  };
}

export function coordsToMinterm(varCount: 2 | 3 | 4, r: number, c: number): number {
  const gray2 = [0, 1, 3, 2]; // 00, 01, 11, 10
  if (varCount === 2) {
    return (r << 1) | c;
  } else if (varCount === 3) {
    return (r << 2) | gray2[c];
  } else {
    return (gray2[r] << 2) | gray2[c];
  }
}

export function mintermToCoords(varCount: 2 | 3 | 4, m: number): { r: number; c: number } {
  const grayRev = [0, 1, 3, 2];
  if (varCount === 2) {
    return { r: (m >> 1) & 1, c: m & 1 };
  } else if (varCount === 3) {
    const a = (m >> 2) & 1;
    const bc = m & 3;
    return { r: a, c: grayRev[bc] };
  } else {
    const ab = (m >> 2) & 3;
    const cd = m & 3;
    return { r: grayRev[ab], c: grayRev[cd] };
  }
}

const isSameGroup = (a: number[], b: number[]) =>
  a.length === b.length && a.every((val, idx) => val === b[idx]);

export function solveKMap(varCount: 2 | 3 | 4, grid: KMapCell[][]): KMapResult {
  const kmap = createEmptyKMap(varCount);
  kmap.grid = grid.map(row => [...row]);

  const rows = grid.length;
  const cols = grid[0].length;
  const minterms: number[] = [];
  const maxterms: number[] = [];
  const dontCares: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      const m = kmap.cellMinterms[r][c];
      if (val === 1) minterms.push(m);
      else if (val === 0) maxterms.push(m);
      else if (val === 'X') dontCares.push(m);
    }
  }

  minterms.sort((a, b) => a - b);
  maxterms.sort((a, b) => a - b);
  dontCares.sort((a, b) => a - b);

  kmap.minterms = minterms;
  kmap.maxterms = maxterms;
  kmap.dontCares = dontCares;

  const totalCells = 1 << varCount;

  // Canonical representations
  kmap.canonicalSOP = minterms.length > 0
    ? `Σm(${minterms.join(', ')})` + (dontCares.length ? ` + d(${dontCares.join(', ')})` : '')
    : '0';

  kmap.canonicalPOS = maxterms.length > 0
    ? `ΠM(${maxterms.join(', ')})` + (dontCares.length ? ` · d(${dontCares.join(', ')})` : '')
    : '1';

  // Available group sizes in Gray code: largest power-of-2 first
  const groupSizes = varCount === 4
    ? [[4, 4], [4, 2], [2, 4], [4, 1], [1, 4], [2, 2], [2, 1], [1, 2], [1, 1]]
    : varCount === 3
    ? [[2, 4], [2, 2], [1, 4], [2, 1], [1, 2], [1, 1]]
    : [[2, 2], [2, 1], [1, 2], [1, 1]];

  // -------------------------------------------------------------
  // 1. Solve Minimal SOP (Grouping 1s and Xs)
  // -------------------------------------------------------------
  if (minterms.length === 0) {
    kmap.sop = '0';
    kmap.groups = [];
  } else if (minterms.length + dontCares.length === totalCells) {
    kmap.sop = '1';
    kmap.groups = [{
      id: 'grp_sop_all',
      color: KMAP_COLORS[0],
      cells: Array.from({ length: totalCells }, (_, i) => i),
      expression: '1',
      isEssential: true,
      r: 0,
      c: 0,
      h: rows,
      w: cols,
      rowIndices: Array.from({ length: rows }, (_, i) => i),
      colIndices: Array.from({ length: cols }, (_, i) => i),
    }];
  } else {
    const candidateSOP: { r: number; c: number; h: number; w: number; cells: number[]; expression: string }[] = [];

    for (const [h, w] of groupSizes) {
      if (h > rows || w > cols) continue;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let allValid = true;
          let containsAtLeastOneTarget = false;
          const cells: number[] = [];

          for (let dr = 0; dr < h; dr++) {
            for (let dc = 0; dc < w; dc++) {
              const tr = (r + dr) % rows;
              const tc = (c + dc) % cols;
              const cellVal = grid[tr][tc];

              if (cellVal === 0) {
                allValid = false;
                break;
              }
              if (cellVal === 1) containsAtLeastOneTarget = true;
              cells.push(kmap.cellMinterms[tr][tc]);
            }
            if (!allValid) break;
          }

          if (allValid && containsAtLeastOneTarget) {
            cells.sort((a, b) => a - b);
            const isDuplicate = candidateSOP.some(g => isSameGroup(g.cells, cells));
            if (!isDuplicate) {
              const expr = getGroupSOPExpression(varCount, kmap.variables, cells);
              candidateSOP.push({ r, c, h, w, cells, expression: expr });
            }
          }
        }
      }
    }

    const primeSOP = candidateSOP.filter(g1 =>
      !candidateSOP.some(g2 => g2.cells.length > g1.cells.length && g1.cells.every(m => g2.cells.includes(m)))
    );

    const uncoveredMinterms = new Set(minterms);
    const selectedSOP: KMapGroup[] = [];

    // Essential prime implicants (uniquely covers at least one target minterm)
    for (const m of minterms) {
      const covering = primeSOP.filter(g => g.cells.includes(m));
      if (covering.length === 1) {
        const g = covering[0];
        if (!selectedSOP.some(sg => isSameGroup(sg.cells, g.cells))) {
          selectedSOP.push({
            id: `grp_sop_${selectedSOP.length}`,
            color: KMAP_COLORS[selectedSOP.length % KMAP_COLORS.length],
            cells: g.cells,
            expression: g.expression,
            isEssential: true,
            r: g.r,
            c: g.c,
            h: g.h,
            w: g.w,
            rowIndices: Array.from({ length: g.h }, (_, i) => (g.r + i) % rows),
            colIndices: Array.from({ length: g.w }, (_, i) => (g.c + i) % cols),
          });
          g.cells.forEach(cell => uncoveredMinterms.delete(cell));
        }
      }
    }

    // Cover remaining uncovered minterms
    while (uncoveredMinterms.size > 0) {
      let bestGroup: typeof primeSOP[0] | null = null;
      let maxCovered = -1;
      let bestTotalTargets = -1;

      for (const g of primeSOP) {
        if (selectedSOP.some(sg => isSameGroup(sg.cells, g.cells))) continue;
        const count = g.cells.filter(m => uncoveredMinterms.has(m)).length;
        const totalTargets = g.cells.filter(m => minterms.includes(m)).length;

        if (count > maxCovered) {
          maxCovered = count;
          bestTotalTargets = totalTargets;
          bestGroup = g;
        } else if (count === maxCovered && count > 0 && totalTargets > bestTotalTargets) {
          bestTotalTargets = totalTargets;
          bestGroup = g;
        }
      }

      if (!bestGroup || maxCovered <= 0) break;

      selectedSOP.push({
        id: `grp_sop_${selectedSOP.length}`,
        color: KMAP_COLORS[selectedSOP.length % KMAP_COLORS.length],
        cells: bestGroup.cells,
        expression: bestGroup.expression,
        isEssential: false,
        r: bestGroup.r,
        c: bestGroup.c,
        h: bestGroup.h,
        w: bestGroup.w,
        rowIndices: Array.from({ length: bestGroup.h }, (_, i) => (bestGroup.r + i) % rows),
        colIndices: Array.from({ length: bestGroup.w }, (_, i) => (bestGroup.c + i) % cols),
      });
      bestGroup.cells.forEach(m => uncoveredMinterms.delete(m));
    }

    kmap.groups = selectedSOP;
    kmap.sop = selectedSOP.map(g => g.expression).join(' + ') || '0';
  }

  // -------------------------------------------------------------
  // 2. Solve Minimal POS (Grouping 0s and Xs)
  // -------------------------------------------------------------
  if (maxterms.length === 0) {
    kmap.pos = '1';
    kmap.posGroups = [];
  } else if (maxterms.length + dontCares.length === totalCells) {
    kmap.pos = '0';
    kmap.posGroups = [{
      id: 'grp_pos_all',
      color: KMAP_COLORS[0],
      cells: Array.from({ length: totalCells }, (_, i) => i),
      expression: '0',
      isEssential: true,
      r: 0,
      c: 0,
      h: rows,
      w: cols,
      rowIndices: Array.from({ length: rows }, (_, i) => i),
      colIndices: Array.from({ length: cols }, (_, i) => i),
    }];
  } else {
    const candidatePOS: { r: number; c: number; h: number; w: number; cells: number[]; expression: string }[] = [];

    for (const [h, w] of groupSizes) {
      if (h > rows || w > cols) continue;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let allValid = true;
          let containsAtLeastOneTarget = false;
          const cells: number[] = [];

          for (let dr = 0; dr < h; dr++) {
            for (let dc = 0; dc < w; dc++) {
              const tr = (r + dr) % rows;
              const tc = (c + dc) % cols;
              const cellVal = grid[tr][tc];

              if (cellVal === 1) {
                allValid = false;
                break;
              }
              if (cellVal === 0) containsAtLeastOneTarget = true;
              cells.push(kmap.cellMinterms[tr][tc]);
            }
            if (!allValid) break;
          }

          if (allValid && containsAtLeastOneTarget) {
            cells.sort((a, b) => a - b);
            const isDuplicate = candidatePOS.some(g => isSameGroup(g.cells, cells));
            if (!isDuplicate) {
              const expr = getGroupPOSExpression(varCount, kmap.variables, cells);
              candidatePOS.push({ r, c, h, w, cells, expression: expr });
            }
          }
        }
      }
    }

    const primePOS = candidatePOS.filter(g1 =>
      !candidatePOS.some(g2 => g2.cells.length > g1.cells.length && g1.cells.every(m => g2.cells.includes(m)))
    );

    const uncoveredMaxterms = new Set(maxterms);
    const selectedPOS: KMapGroup[] = [];

    // Essential prime implicants of 0s
    for (const m of maxterms) {
      const covering = primePOS.filter(g => g.cells.includes(m));
      if (covering.length === 1) {
        const g = covering[0];
        if (!selectedPOS.some(sg => isSameGroup(sg.cells, g.cells))) {
          selectedPOS.push({
            id: `grp_pos_${selectedPOS.length}`,
            color: KMAP_COLORS[selectedPOS.length % KMAP_COLORS.length],
            cells: g.cells,
            expression: g.expression,
            isEssential: true,
            r: g.r,
            c: g.c,
            h: g.h,
            w: g.w,
            rowIndices: Array.from({ length: g.h }, (_, i) => (g.r + i) % rows),
            colIndices: Array.from({ length: g.w }, (_, i) => (g.c + i) % cols),
          });
          g.cells.forEach(cell => uncoveredMaxterms.delete(cell));
        }
      }
    }

    // Cover remaining uncovered maxterms
    while (uncoveredMaxterms.size > 0) {
      let bestGroup: typeof primePOS[0] | null = null;
      let maxCovered = -1;
      let bestTotalTargets = -1;

      for (const g of primePOS) {
        if (selectedPOS.some(sg => isSameGroup(sg.cells, g.cells))) continue;
        const count = g.cells.filter(m => uncoveredMaxterms.has(m)).length;
        const totalTargets = g.cells.filter(m => maxterms.includes(m)).length;

        if (count > maxCovered) {
          maxCovered = count;
          bestTotalTargets = totalTargets;
          bestGroup = g;
        } else if (count === maxCovered && count > 0 && totalTargets > bestTotalTargets) {
          bestTotalTargets = totalTargets;
          bestGroup = g;
        }
      }

      if (!bestGroup || maxCovered <= 0) break;

      selectedPOS.push({
        id: `grp_pos_${selectedPOS.length}`,
        color: KMAP_COLORS[selectedPOS.length % KMAP_COLORS.length],
        cells: bestGroup.cells,
        expression: bestGroup.expression,
        isEssential: false,
        r: bestGroup.r,
        c: bestGroup.c,
        h: bestGroup.h,
        w: bestGroup.w,
        rowIndices: Array.from({ length: bestGroup.h }, (_, i) => (bestGroup.r + i) % rows),
        colIndices: Array.from({ length: bestGroup.w }, (_, i) => (bestGroup.c + i) % cols),
      });
      bestGroup.cells.forEach(m => uncoveredMaxterms.delete(m));
    }

    kmap.posGroups = selectedPOS;
    const formattedPOSTerms = selectedPOS.map(g => {
      return (selectedPOS.length > 1 && !g.expression.startsWith('('))
        ? `(${g.expression})`
        : g.expression;
    });
    kmap.pos = formattedPOSTerms.join('') || '1';
  }

  return kmap;
}

function getGroupSOPExpression(varCount: number, variables: string[], minterms: number[]): string {
  let expr = '';

  for (let bit = 0; bit < varCount; bit++) {
    const shift = varCount - 1 - bit;
    const firstBit = (minterms[0] >> shift) & 1;
    let uniform = true;

    for (let i = 1; i < minterms.length; i++) {
      if (((minterms[i] >> shift) & 1) !== firstBit) {
        uniform = false;
        break;
      }
    }

    if (uniform) {
      expr += firstBit === 1 ? variables[bit] : `${variables[bit]}'`;
    }
  }

  return expr || '1';
}

function getGroupPOSExpression(varCount: number, variables: string[], maxterms: number[]): string {
  const sumParts: string[] = [];

  for (let bit = 0; bit < varCount; bit++) {
    const shift = varCount - 1 - bit;
    const firstBit = (maxterms[0] >> shift) & 1;
    let uniform = true;

    for (let i = 1; i < maxterms.length; i++) {
      if (((maxterms[i] >> shift) & 1) !== firstBit) {
        uniform = false;
        break;
      }
    }

    if (uniform) {
      // In POS convention: 0 is uncomplemented (A), 1 is complemented (A')
      sumParts.push(firstBit === 0 ? variables[bit] : `${variables[bit]}'`);
    }
  }

  if (sumParts.length === 0) return '0';
  if (sumParts.length === 1) return sumParts[0];
  return `(${sumParts.join(' + ')})`;
}
