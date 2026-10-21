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
  RotateCcw, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';

export const KMapModule: React.FC = () => {
  const [varCount, setVarCount] = useState<2 | 3 | 4>(4);
  const [kmapState, setKmapState] = useState<KMapResult>(() => createEmptyKMap(4));
  const [solutionMode, setSolutionMode] = useState<'SOP' | 'POS'>('SOP');
  const [mintermInput, setMintermInput] = useState<string>('1, 3, 7, 11, 15');
  const [maxtermInput, setMaxtermInput] = useState<string>('0, 2, 4, 5, 6, 8, 9, 10, 12, 13, 14');
  const [dontCareInput, setDontCareInput] = useState<string>('0, 2');

  // Handle changing variable count (4-cell, 8-cell, 16-cell)
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

  // Populate grid from manual minterm & dont-care numbers (SOP)
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

    // Initialise all to 0
    for (let r = 0; r < newKmap.grid.length; r++) {
      for (let c = 0; c < newKmap.grid[0].length; c++) {
        newKmap.grid[r][c] = 0;
      }
    }

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

  // Populate grid from manual maxterm & dont-care numbers (POS)
  const handleApplyMaxterms = () => {
    const newKmap = createEmptyKMap(varCount);
    const totalMax = 1 << varCount;

    const mList = maxtermInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n < totalMax);

    const dList = dontCareInput
      .split(',')
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n >= 0 && n < totalMax);

    // Initialise all to 1
    for (let r = 0; r < newKmap.grid.length; r++) {
      for (let c = 0; c < newKmap.grid[0].length; c++) {
        newKmap.grid[r][c] = 1;
      }
    }

    // Set 0 for specified maxterms
    for (const m of mList) {
      const { r, c } = mintermToCoords(varCount, m);
      newKmap.grid[r][c] = 0;
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

  const activeGroups = solutionMode === 'SOP' ? kmapState.groups : kmapState.posGroups;
  const currentExpression = solutionMode === 'SOP' ? kmapState.sop : kmapState.pos;
  const currentCanonical = solutionMode === 'SOP' ? kmapState.canonicalSOP : kmapState.canonicalPOS;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-emerald-400" />
          <span>Karnaugh Map (K-Map) Solver</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Interactive Gray-code K-Map with <strong>8-Cell</strong> &amp; <strong>16-Cell</strong> modes, <strong>SOP (Sum of Products)</strong>, and <strong>POS (Product of Sums)</strong> prime implicant grouping
        </p>
      </div>

      {/* Control Bar: Var Selection & Mode Tabs */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Variable Count / Cell Count Selection */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Map Size:
            </span>
            <button
              onClick={() => handleVarCountChange(2)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                varCount === 2
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              4-Cell (2 Vars: A, B)
            </button>
            <button
              onClick={() => handleVarCountChange(3)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                varCount === 3
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              8-Cell (3 Vars: A, B, C | m0..m7)
            </button>
            <button
              onClick={() => handleVarCountChange(4)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                varCount === 4
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              16-Cell (4 Vars: A, B, C, D | m0..m15)
            </button>
          </div>

          {/* Reset Grid Button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Grid</span>
          </button>
        </div>

        {/* SOP vs POS Tab Switcher */}
        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Optimization Form:
          </span>
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSolutionMode('SOP')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                solutionMode === 'SOP'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SOP (Sum of Products · Group 1s)
            </button>
            <button
              onClick={() => setSolutionMode('POS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                solutionMode === 'POS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              POS (Product of Sums · Group 0s)
            </button>
          </div>
        </div>

        {/* Minterms / Maxterms / Don't Cares Text Entry */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
          {solutionMode === 'SOP' ? (
            <div>
              <label className="text-[10px] font-bold text-emerald-400 uppercase">
                Minterms Σm (Indices where Y=1, e.g. 1, 3, 7)
              </label>
              <input
                type="text"
                value={mintermInput}
                onChange={e => setMintermInput(e.target.value)}
                placeholder={varCount === 3 ? 'e.g. 1, 3, 5, 7' : 'e.g. 1, 3, 7, 11, 15'}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
          ) : (
            <div>
              <label className="text-[10px] font-bold text-cyan-400 uppercase">
                Maxterms ΠM (Indices where Y=0, e.g. 0, 2, 4)
              </label>
              <input
                type="text"
                value={maxtermInput}
                onChange={e => setMaxtermInput(e.target.value)}
                placeholder={varCount === 3 ? 'e.g. 0, 2, 4, 6' : 'e.g. 0, 2, 4, 6, 8, 10'}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase">
              Don't Cares d (Optional, e.g. 0, 2)
            </label>
            <input
              type="text"
              value={dontCareInput}
              onChange={e => setDontCareInput(e.target.value)}
              placeholder="e.g. 0, 2"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={solutionMode === 'SOP' ? handleApplyMinterms : handleApplyMaxterms}
              className={`w-full py-1.5 px-4 rounded text-xs font-bold text-slate-950 shadow transition-colors ${
                solutionMode === 'SOP'
                  ? 'bg-emerald-500 hover:bg-emerald-400'
                  : 'bg-cyan-500 hover:bg-cyan-400'
              }`}
            >
              {solutionMode === 'SOP' ? 'Apply Minterms (Σm)' : 'Apply Maxterms (ΠM)'}
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
                <span>
                  {varCount === 2 ? '4-Cell (2-Var)' : varCount === 3 ? '8-Cell (3-Var)' : '16-Cell (4-Var)'} Gray-Code Grid
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Click cell: <strong className="text-slate-400">0</strong> → <strong className="text-emerald-400">1</strong> → <strong className="text-amber-400">X</strong>
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
                        const isZero = cellVal === 0;
                        const isDontCare = cellVal === 'X';

                        // Check if cell is in any highlighted group according to active mode
                        const cellCoveringGroups = activeGroups.filter(g => g.cells.includes(m));
                        const isTarget = solutionMode === 'SOP' ? isOne : isZero;

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
                                  : 'bg-slate-900/60 text-slate-400 border border-slate-800/60'
                              }`}
                              style={{
                                backgroundColor: cellCoveringGroups.length > 0 && isTarget
                                  ? cellCoveringGroups[0].color
                                  : undefined,
                              }}
                            >
                              <span className="text-base font-mono">
                                {cellVal}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                                {solutionMode === 'SOP' ? `m${m}` : `M${m}`}
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

            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>* Gray code sequence ensures adjacent cells differ by strictly one literal.</span>
              <span className="font-mono text-slate-300">
                Active Cells: {kmapState.minterms.length} minterms, {kmapState.maxterms.length} maxterms
              </span>
            </div>
          </div>
        </div>

        {/* Right: Groups & Solution Formulas (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Minimal Equation Card */}
          <div className={`rounded-xl border p-5 space-y-3 ${
            solutionMode === 'SOP'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-cyan-500/30 bg-cyan-500/10'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                solutionMode === 'SOP' ? 'text-emerald-400' : 'text-cyan-400'
              }`}>
                {solutionMode === 'SOP' ? 'Minimal Sum of Products (SOP)' : 'Minimal Product of Sums (POS)'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700">
                {solutionMode} Mode
              </span>
            </div>
            <div className={`p-3 rounded-lg bg-slate-950 font-mono text-lg font-extrabold break-words ${
              solutionMode === 'SOP'
                ? 'border border-emerald-500/30 text-emerald-300'
                : 'border border-cyan-500/30 text-cyan-300'
            }`}>
              Y = {currentExpression || (solutionMode === 'SOP' ? '0' : '1')}
            </div>
            <div className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-300 break-words">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Canonical Form:</span>
              {currentCanonical}
            </div>
          </div>

          {/* Groupings Identified */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <span>
                  {solutionMode} Prime Implicants ({activeGroups.length})
                </span>
              </h3>
            </div>

            {activeGroups.length === 0 ? (
              <p className="text-xs text-slate-500 italic">
                {solutionMode === 'SOP' ? 'No groups formed (Function is constantly 0).' : 'No groups formed (Function is constantly 1).'}
              </p>
            ) : (
              <div className="space-y-2">
                {activeGroups.map((grp, idx) => (
                  <div
                    key={grp.id}
                    className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="h-3.5 w-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: grp.color }}
                      />
                      <div>
                        <span className="font-mono text-xs font-bold text-white">
                          Group {idx + 1}: {grp.expression}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {solutionMode === 'SOP' ? 'Minterms' : 'Maxterms'}: [{grp.cells.join(', ')}]
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

          {/* Toroidal Boundary Rules Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-2 text-xs text-slate-400">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-400" />
              <span>Toroidal Wrap-Around &amp; POS Rules</span>
            </h4>
            <p className="leading-relaxed">
              <strong>SOP:</strong> Groups power-of-2 rectangles of <strong>1s</strong> into Product terms (e.g. <code>A'B</code>).
            </p>
            <p className="leading-relaxed">
              <strong>POS:</strong> Groups power-of-2 rectangles of <strong>0s</strong> into Sum terms (e.g. <code>(A + B')</code> where 0 = uncomplemented, 1 = complemented).
            </p>
            <p className="leading-relaxed">
              In an 8-cell or 16-cell map, left &amp; right edges wrap, and top &amp; bottom edges wrap continuously.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
