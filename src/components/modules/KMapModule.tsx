import React, { useState } from 'react';
import { 
  createEmptyKMap, 
  solveKMap, 
  KMapResult, 
  KMapCell, 
  mintermToCoords 
} from '../../engine/kmap/kmap';
import { 
  Grid3X3, 
  Sparkles, 
  CheckCircle2, 
  RotateCcw, 
  Layers, 
  Info 
} from 'lucide-react';

export const KMapModule: React.FC = () => {
  const [varCount, setVarCount] = useState<2 | 3 | 4>(4);
  const [kmapState, setKmapState] = useState<KMapResult>(() => createEmptyKMap(4));
  const [mintermInput, setMintermInput] = useState<string>('1, 3, 7, 11, 15');
  const [dontCareInput, setDontCareInput] = useState<string>('0, 2');

  // Handle changing variable count
  const handleVarCountChange = (count: 2 | 3 | 4) => {
    setVarCount(count);
    const newKmap = createEmptyKMap(count);
    setKmapState(solveKMap(count, newKmap.grid));
  };

  // Toggle cell on click: 0 -> 1 -> X -> 0
  const toggleCell = (r: number, c: number) => {
    const nextGrid = kmapState.grid.map(row => [...row]);
    const curVal = nextGrid[r][c];
    let nextVal: KMapCell = 1;
    if (curVal === 0) nextVal = 1;
    else if (curVal === 1) nextVal = 'X';
    else nextVal = 0;

    nextGrid[r][c] = nextVal;
    setKmapState(solveKMap(varCount, nextGrid));
  };

  // Populate grid from manual minterm & dont-care numbers
  const handleApplyMinterms = () => {
    const newKmap = createEmptyKMap(varCount);
    const totalMax = 1 << varCount;

    const mList = mintermInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n < totalMax);

    const dList = dontCareInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n < totalMax);

    for (const m of mList) {
      const { r, c } = mintermToCoords(varCount, m);
      newKmap.grid[r][c] = 1;
    }
    for (const d of dList) {
      const { r, c } = mintermToCoords(varCount, d);
      newKmap.grid[r][c] = 'X';
    }

    setKmapState(solveKMap(varCount, newKmap.grid));
  };

  // Clear all cells
  const handleClear = () => {
    const empty = createEmptyKMap(varCount);
    setKmapState(solveKMap(varCount, empty.grid));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Karnaugh Map (K-Map) Solver
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Interactive Gray-code grid with toroidal wrap-around group detection, don't-cares, and minimal SOP generation
        </p>
      </div>

      {/* Control Bar: Var Selection & Minterms Input */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Variables:
            </span>
            {([2, 3, 4] as const).map(count => (
              <button
                key={count}
                onClick={() => handleVarCountChange(count)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  varCount === count
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-750 border border-slate-700'
                }`}
              >
                {count} Vars ({count === 2 ? 'A, B' : count === 3 ? 'A, B, C' : 'A, B, C, D'})
              </button>
            ))}
          </div>

          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Grid</span>
          </button>
        </div>

        {/* Minterms / Don't Cares Text Entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Minterms Σm (Comma separated)
            </label>
            <input
              type="text"
              value={mintermInput}
              onChange={e => setMintermInput(e.target.value)}
              placeholder="e.g. 1, 3, 7, 11, 15"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase">
              Don't Cares d (Optional)
            </label>
            <input
              type="text"
              value={dontCareInput}
              onChange={e => setDontCareInput(e.target.value)}
              placeholder="e.g. 0, 2"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleApplyMinterms}
              className="w-full py-1.5 px-4 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow transition-colors"
            >
              Apply Minterms to Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Solution Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Gray-Code K-Map Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-emerald-400" />
                <span>Interactive K-Map Grid</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Click any cell to cycle: <strong className="text-slate-400">0</strong> → <strong className="text-emerald-400">1</strong> → <strong className="text-amber-400">X</strong>
              </span>
            </div>

            {/* Gray Code Grid Render */}
            <div className="overflow-x-auto p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex justify-center">
              <table className="border-collapse select-none">
                <thead>
                  <tr>
                    {/* Top-left corner showing axis variables */}
                    <th className="p-3 text-xs font-mono font-bold text-emerald-400 border-r-2 border-b-2 border-slate-700 text-center">
                      {varCount === 2 ? 'A \\ B' : varCount === 3 ? 'A \\ BC' : 'AB \\ CD'}
                    </th>
                    {kmapState.colLabels.map(col => (
                      <th
                        key={col}
                        className="p-3 text-xs font-mono font-bold text-slate-300 border-b-2 border-slate-700 text-center w-16"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {kmapState.rowLabels.map((rowLabel, r) => (
                    <tr key={r}>
                      {/* Row Gray code label */}
                      <td className="p-3 text-xs font-mono font-bold text-slate-300 border-r-2 border-slate-700 text-center">
                        {rowLabel}
                      </td>
                      {/* Cells */}
                      {kmapState.grid[r].map((cellVal, c) => {
                        const m = kmapState.cellMinterms[r][c];
                        const isOne = cellVal === 1;
                        const isDontCare = cellVal === 'X';

                        // Check if cell is in any highlighted group
                        const activeGroups = kmapState.groups.filter(g => g.cells.includes(m));

                        return (
                          <td
                            key={c}
                            onClick={() => toggleCell(r, c)}
                            className="p-2 border border-slate-800 text-center cursor-pointer transition-colors relative hover:bg-slate-800/40"
                          >
                            <div
                              className={`h-14 w-14 rounded-lg flex flex-col items-center justify-center transition-all ${
                                isOne
                                  ? 'bg-emerald-500/20 text-emerald-300 font-extrabold border border-emerald-500/50 shadow-inner'
                                  : isDontCare
                                  ? 'bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40'
                                  : 'bg-slate-900/60 text-slate-500 border border-slate-800/60'
                              }`}
                              style={{
                                backgroundColor: activeGroups.length > 0 && isOne
                                  ? activeGroups[0].color
                                  : undefined,
                              }}
                            >
                              <span className="text-base font-mono">
                                {cellVal}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                                m{m}
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-400">
              * Gray code sequence ensures adjacent cells differ by strictly one literal. Toroidal wrap connects opposite edges and corners.
            </p>
          </div>
        </div>

        {/* Right: Groups & Minimal SOP Formula (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Minimal Equation Card */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Minimal Sum of Products (SOP)
            </span>
            <div className="p-3 rounded-lg bg-slate-950 border border-emerald-500/30 font-mono text-lg font-extrabold text-emerald-300 break-words">
              Y = {kmapState.sop || '0'}
            </div>
            <p className="text-xs text-slate-300">
              Derived by prime implicant reduction and essential coverage of minterms.
            </p>
          </div>

          {/* Groupings Identified */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>Prime Implicant Groups ({kmapState.groups.length})</span>
              </h3>
            </div>

            {kmapState.groups.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No groups formed. All minterms are 0.</p>
            ) : (
              <div className="space-y-2">
                {kmapState.groups.map((grp, idx) => (
                  <div
                    key={grp.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: grp.color }}
                      />
                      <div>
                        <span className="font-mono text-xs font-bold text-white">
                          Group {idx + 1}: {grp.expression}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Minterms: [{grp.cells.join(', ')}]
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      grp.isEssential
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {grp.isEssential ? 'Essential PI' : 'Covering PI'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* K-Map Toroidal Explanation */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 text-xs text-slate-400">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-400" />
              <span>Toroidal Boundary Rules</span>
            </h4>
            <p className="leading-relaxed">
              In a 4-variable map, the top edge wraps to the bottom edge, and the left edge wraps to the right edge.
              Specifically, cells <strong>(m0, m2, m8, m10)</strong> on the four corners form a valid 4-cell group simplifying to <strong>B'D'</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
