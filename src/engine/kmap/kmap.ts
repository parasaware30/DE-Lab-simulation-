export type KMapCell = 0 | 1 | 'X';

export interface KMapGroup {
  id: string;
  color: string;
  cells: number[]; // minterm indices
  expression: string;
  isEssential: boolean;
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
  sop: string;
  pos: string;
  minterms: number[];
  dontCares: number[];
}

const GROUP_COLORS = [
  'rgba(59, 130, 246, 0.4)', // blue
  'rgba(16, 185, 129, 0.4)', // green
  'rgba(245, 158, 11, 0.4)', // amber
  'rgba(236, 72, 153, 0.4)', // pink
  'rgba(139, 92, 246, 0.4)', // purple
  'rgba(20, 184, 166, 0.4)', // teal
  'rgba(239, 68, 68, 0.4)',  // red
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
    sop: '0',
    pos: '1',
    minterms: [],
    dontCares: [],
  };
}

export function coordsToMinterm(varCount: 2 | 3 | 4, r: number, c: number): number {
  const gray2 = [0, 1, 3, 2]; // 00, 01, 11, 10
  if (varCount === 2) {
    // r is A, c is B
    return (r << 1) | c;
  } else if (varCount === 3) {
    // r is A (0 or 1), c is BC (Gray code: 00=0, 01=1, 11=3, 10=2)
    return (r << 2) | gray2[c];
  } else {
    // 4 vars: r is AB (Gray code), c is CD (Gray code)
    return (gray2[r] << 2) | gray2[c];
  }
}

export function mintermToCoords(varCount: 2 | 3 | 4, m: number): { r: number; c: number } {
  const grayRev = [0, 1, 3, 2]; // index 0->0, 1->1, 2->3, 3->2
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

export function solveKMap(varCount: 2 | 3 | 4, grid: KMapCell[][]): KMapResult {
  const kmap = createEmptyKMap(varCount);
  kmap.grid = grid.map(row => [...row]);

  const rows = grid.length;
  const cols = grid[0].length;
  const minterms: number[] = [];
  const dontCares: number[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const val = grid[r][c];
      const m = kmap.cellMinterms[r][c];
      if (val === 1) minterms.push(m);
      else if (val === 'X') dontCares.push(m);
    }
  }

  kmap.minterms = minterms;
  kmap.dontCares = dontCares;

  const totalCells = 1 << varCount;
  if (minterms.length === 0) {
    kmap.sop = '0';
    kmap.pos = '0';
    kmap.groups = [];
    return kmap;
  }

  if (minterms.length + dontCares.length === totalCells) {
    kmap.sop = '1';
    kmap.pos = '1';
    kmap.groups = [{
      id: 'grp_all',
      color: GROUP_COLORS[0],
      cells: Array.from({ length: totalCells }, (_, i) => i),
      expression: '1',
      isEssential: true,
      rowIndices: Array.from({ length: rows }, (_, i) => i),
      colIndices: Array.from({ length: cols }, (_, i) => i),
    }];
    return kmap;
  }

  // Find valid power-of-2 rectangular groups: sizes 16, 8, 4, 2, 1
  const candidateGroups: { r: number; c: number; h: number; w: number; cells: number[]; expression: string }[] = [];
  const groupSizes = varCount === 4
    ? [[4, 4], [4, 2], [2, 4], [4, 1], [1, 4], [2, 2], [2, 1], [1, 2], [1, 1]]
    : varCount === 3
    ? [[2, 4], [2, 2], [1, 4], [2, 1], [1, 2], [1, 1]]
    : [[2, 2], [2, 1], [1, 2], [1, 1]];

  for (const [h, w] of groupSizes) {
    if (h > rows || w > cols) continue;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        // Test if all cells in rectangle (r..r+h-1, c..c+w-1) with toroidal wrap are 1 or X
        let allValid = true;
        let containsAtLeastOne1 = false;
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
            if (cellVal === 1) containsAtLeastOne1 = true;
            cells.push(kmap.cellMinterms[tr][tc]);
          }
          if (!allValid) break;
        }

        if (allValid && containsAtLeastOne1) {
          cells.sort((a, b) => a - b);
          // Check if identical cell set already found
          const isDuplicate = candidateGroups.some(g =>
            g.cells.length === cells.length && g.cells.every((val, idx) => val === cells[idx])
          );

          if (!isDuplicate) {
            const expr = getGroupExpression(varCount, kmap.variables, cells);
            candidateGroups.push({ r, c, h, w, cells, expression: expr });
          }
        }
      }
    }
  }

  // Filter prime implicants (groups not strictly contained in a larger candidate group)
  const primeGroups = candidateGroups.filter(g1 => {
    return !candidateGroups.some(g2 =>
      g2.cells.length > g1.cells.length && g1.cells.every(m => g2.cells.includes(m))
    );
  });

  // Select minimal cover of all minterms (Essential prime implicants + greedy)
  const uncovered = new Set(minterms);
  const selectedGroups: KMapGroup[] = [];

  // Essential prime implicants
  for (const m of minterms) {
    const covering = primeGroups.filter(g => g.cells.includes(m));
    if (covering.length === 1) {
      const g = covering[0];
      if (!selectedGroups.some(sg => sg.cells.length === g.cells.length && sg.cells[0] === g.cells[0])) {
        selectedGroups.push({
          id: `grp_${selectedGroups.length}`,
          color: GROUP_COLORS[selectedGroups.length % GROUP_COLORS.length],
          cells: g.cells,
          expression: g.expression,
          isEssential: true,
          rowIndices: Array.from({ length: g.h }, (_, i) => (g.r + i) % rows),
          colIndices: Array.from({ length: g.w }, (_, i) => (g.c + i) % cols),
        });
        g.cells.forEach(cell => uncovered.delete(cell));
      }
    }
  }

  // Greedy cover for remaining uncovered minterms
  while (uncovered.size > 0) {
    let bestGroup: typeof primeGroups[0] | null = null;
    let maxCovered = -1;

    for (const g of primeGroups) {
      if (selectedGroups.some(sg => sg.cells.length === g.cells.length && sg.cells[0] === g.cells[0])) {
        continue;
      }
      const count = g.cells.filter(m => uncovered.has(m)).length;
      if (count > maxCovered) {
        maxCovered = count;
        bestGroup = g;
      }
    }

    if (!bestGroup || maxCovered <= 0) break;

    selectedGroups.push({
      id: `grp_${selectedGroups.length}`,
      color: GROUP_COLORS[selectedGroups.length % GROUP_COLORS.length],
      cells: bestGroup.cells,
      expression: bestGroup.expression,
      isEssential: false,
      rowIndices: Array.from({ length: bestGroup.h }, (_, i) => (bestGroup.r + i) % rows),
      colIndices: Array.from({ length: bestGroup.w }, (_, i) => (bestGroup.c + i) % cols),
    });
    bestGroup.cells.forEach(m => uncovered.delete(m));
  }

  kmap.groups = selectedGroups;
  kmap.sop = selectedGroups.map(g => g.expression).join(' + ') || '0';
  return kmap;
}

function getGroupExpression(varCount: number, variables: string[], minterms: number[]): string {
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
