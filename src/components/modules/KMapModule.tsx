import React, { useState } from 'react';
import { 
  createEmptyKMap, 
  solveKMap, 
  KMapResult, 
  KMapCell, 
  KMapGroup,
  mintermToCoords 
} from '../../engine/kmap/kmap';
import { 
  Grid3X3, 
  RotateCcw, 
  Layers, 
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

const CELL_SIZE = 64; // px size of each K-Map cell

export const KMapModule: React.FC = () => {
  const [varCount, setVarCount] = useState<2 | 3 | 4>(4);
  const [kmapState, setKmapState] = useState<KMapResult>(() => createEmptyKMap(4));
  const [solutionMode, setSolutionMode] = useState<'SOP' | 'POS'>('SOP');
  const [mintermInput, setMintermInput] = useState<string>('1, 3, 7, 11, 15');
  const [maxtermInput, setMaxtermInput] = useState<string>('2, 5, 7, 9, 10, 15');
  const [dontCareInput, setDontCareInput] = useState<string>('0, 2, 4, 8');
  const [hoveredGroupId, setHoveredGroupId] = useState<string | null>(null);

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

  // Clear all cells to 0
  const handleClear = () => {
    const empty = createEmptyKMap(varCount);
    setKmapState(solveKMap(varCount, empty.grid));
  };

  // Fill all cells with 1
  const handleFillAllOnes = () => {
    const nextGrid = kmapState.grid.map(row => row.map(() => 1 as KMapCell));
    setKmapState(solveKMap(varCount, nextGrid));
  };

  const activeGroups = solutionMode === 'SOP' ? kmapState.groups : kmapState.posGroups;
  const currentCanonical = solutionMode === 'SOP' ? kmapState.canonicalSOP : kmapState.canonicalPOS;

  // Grid dimensions
  const cols = kmapState.colLabels.length;
  const rows = kmapState.rowLabels.length;

  /**
   * Renders the distinct colored loop overlay for any group (Normal, Horiz Wrap, Vert Wrap, or 4 Corners)
   */
  const renderGroupLoop = (grp: KMapGroup, idx: number, isHovered: boolean) => {
    const W = CELL_SIZE;
    const H = CELL_SIZE;
    const pad = 4 + (idx % 3) * 3; // Staggered inset so overlapping groups stay distinct
    const R = 12; // Radius
    const strokeColor = grp.color;
    const strokeWidth = isHovered ? 3.5 : 2.5;
    const fillColor = isHovered ? `${grp.color}25` : `${grp.color}10`;
    const filter = isHovered ? `drop-shadow(0 0 8px ${grp.color})` : undefined;

    const r = grp.r;
    const c = grp.c;
    const h = grp.h;
    const w = grp.w;

    const wrapsHoriz = c + w > cols;
    const wrapsVert = r + h > rows;

    // Case 1: Standard non-wrapping rectangle
    if (!wrapsHoriz && !wrapsVert) {
      const x = c * W + pad;
      const y = r * H + pad;
      const width = w * W - 2 * pad;
      const height = h * H - 2 * pad;

      return (
        <g key={grp.id} filter={filter}>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            rx={R}
            ry={R}
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            className="transition-all duration-150"
          />
        </g>
      );
    }

    // Case 2: Horizontal wrap only (e.g. left and right columns)
    if (wrapsHoriz && !wrapsVert) {
      const y = r * H + pad;
      const height = h * H - 2 * pad;
      const wLeft = (c + w) % cols;

      // Right piece: from col c to grid right boundary
      const xRightStart = c * W + pad;
      const xRightEnd = cols * W;
      const rightPath = `
        M ${xRightEnd} ${y}
        L ${xRightStart + R} ${y}
        Q ${xRightStart} ${y} ${xRightStart} ${y + R}
        L ${xRightStart} ${y + height - R}
        Q ${xRightStart} ${y + height} ${xRightStart + R} ${y + height}
        L ${xRightEnd} ${y + height}
      `;

      // Left piece: from grid left boundary (0) to col wLeft
      const xLeftStart = 0;
      const xLeftEnd = wLeft * W - pad;
      const leftPath = `
        M ${xLeftStart} ${y + height}
        L ${xLeftEnd - R} ${y + height}
        Q ${xLeftEnd} ${y + height} ${xLeftEnd} ${y + height - R}
        L ${xLeftEnd} ${y + R}
        Q ${xLeftEnd} ${y} ${xLeftEnd - R} ${y}
        L ${xLeftStart} ${y}
      `;

      return (
        <g key={grp.id} filter={filter}>
          <path d={rightPath} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={leftPath} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
      );
    }

    // Case 3: Vertical wrap only (e.g. top and bottom rows)
    if (!wrapsHoriz && wrapsVert) {
      const x = c * W + pad;
      const width = w * W - 2 * pad;
      const hTop = (r + h) % rows;

      // Bottom piece: from row r to grid bottom boundary
      const yBottomStart = r * H + pad;
      const yBottomEnd = rows * H;
      const bottomPath = `
        M ${x} ${yBottomEnd}
        L ${x} ${yBottomStart + R}
        Q ${x} ${yBottomStart} ${x + R} ${yBottomStart}
        L ${x + width - R} ${yBottomStart}
        Q ${x + width} ${yBottomStart} ${x + width} ${yBottomStart + R}
        L ${x + width} ${yBottomEnd}
      `;

      // Top piece: from grid top boundary (0) to row hTop
      const yTopStart = 0;
      const yTopEnd = hTop * H - pad;
      const topPath = `
        M ${x + width} ${yTopStart}
        L ${x + width} ${yTopEnd - R}
        Q ${x + width} ${yTopEnd} ${x + width - R} ${yTopEnd}
        L ${x + R} ${yTopEnd}
        Q ${x} ${yTopEnd} ${x} ${yTopEnd - R}
        L ${x} ${yTopStart}
      `;

      return (
        <g key={grp.id} filter={filter}>
          <path d={bottomPath} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
          <path d={topPath} fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        </g>
      );
    }

    // Case 4: Wraps both horizontally AND vertically (e.g. 4 Corners group)
    const wLeft = (c + w) % cols;
    const hTop = (r + h) % rows;

    // Top-Left corner piece: rows 0..hTop, cols 0..wLeft
    const tlXLimit = wLeft * W;
    const tlYLimit = hTop * H;
    const tlPath = `
      M ${tlXLimit} ${pad}
      L ${pad + R} ${pad}
      Q ${pad} ${pad} ${pad} ${pad + R}
      L ${pad} ${tlYLimit}
    `;

    // Top-Right corner piece: rows 0..hTop, cols c..cols-1
    const trXStart = c * W;
    const trXEnd = cols * W - pad;
    const trYLimit = hTop * H;
    const trPath = `
      M ${trXStart} ${pad}
      L ${trXEnd - R} ${pad}
      Q ${trXEnd} ${pad} ${trXEnd} ${pad + R}
      L ${trXEnd} ${trYLimit}
    `;

    // Bottom-Left corner piece: rows r..rows-1, cols 0..wLeft
    const blYStart = r * H;
    const blYEnd = rows * H - pad;
    const blXLimit = wLeft * W;
    const blPath = `
      M ${pad} ${blYStart}
      L ${pad} ${blYEnd - R}
      Q ${pad} ${blYEnd} ${pad + R} ${blYEnd}
      L ${blXLimit} ${blYEnd}
    `;

    // Bottom-Right corner piece: rows r..rows-1, cols c..cols-1
    const brXEnd = cols * W - pad;
    const brYStart = r * H;
    const brYEnd = rows * H - pad;
    const brXStart = c * W;
    const brPath = `
      M ${brXEnd} ${brYStart}
      L ${brXEnd} ${brYEnd - R}
      Q ${brXEnd} ${brYEnd} ${brXEnd - R} ${brYEnd}
      L ${brXStart} ${brYEnd}
    `;

    return (
      <g key={grp.id} filter={filter}>
        <path d={tlPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={trPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={blPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
        <path d={brPath} fill="none" stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" />
      </g>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Grid3X3 className="h-6 w-6 text-emerald-400" />
          <span>Karnaugh Map (K-Map) Solver</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Interactive Gray-code K-Map with <strong>visual loop boundary overlays</strong>, color-matched equation terms, <strong>8-Cell &amp; 16-Cell</strong> modes, and <strong>SOP &amp; POS</strong> reduction
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

          {/* Quick Grid Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFillAllOnes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-colors"
            >
              <span>Fill All (1)</span>
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Clear Grid (0)</span>
            </button>
          </div>
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
              SOP Form (Sum of Products · Group 1s)
            </button>
            <button
              onClick={() => setSolutionMode('POS')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                solutionMode === 'POS'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              POS Form (Product of Sums · Group 0s)
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
                Maxterms ΠM (Indices where Y=0, e.g. 2, 5, 7, 9)
              </label>
              <input
                type="text"
                value={maxtermInput}
                onChange={e => setMaxtermInput(e.target.value)}
                placeholder={varCount === 3 ? 'e.g. 0, 2, 4, 6' : 'e.g. 2, 5, 7, 9, 10, 15'}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs font-mono text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-amber-400 uppercase">
              Don't Cares d (Optional, e.g. 0, 2, 4, 8)
            </label>
            <input
              type="text"
              value={dontCareInput}
              onChange={e => setDontCareInput(e.target.value)}
              placeholder="e.g. 0, 2, 4, 8"
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Gray-Code K-Map Grid (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-7 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Grid3X3 className="h-4 w-4 text-emerald-400" />
                <span>
                  {varCount === 2 ? '4-Cell (2-Var)' : varCount === 3 ? '8-Cell (3-Var)' : '16-Cell (4-Var)'} Karnaugh Map
                </span>
              </h3>
              <span className="text-[11px] text-slate-400">
                Click cell: <strong className="text-slate-400">0</strong> → <strong className="text-blue-400">1</strong> → <strong className="text-amber-400">X</strong>
              </span>
            </div>

            {/* Visual K-Map Container */}
            <div className="overflow-x-auto p-4 sm:p-6 rounded-2xl border border-slate-800 bg-white dark:bg-slate-950 flex justify-center shadow-inner">
              <div className="inline-block">
                {/* Column Headers Row */}
                <div className="flex items-center">
                  {/* Top-Left Diagonal Split Cell */}
                  <div
                    className="relative shrink-0 flex items-center justify-center font-mono font-bold text-xs text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-800 rounded-lg bg-slate-100 dark:bg-slate-900 mr-2 mb-2"
                    style={{ width: CELL_SIZE, height: CELL_SIZE }}
                  >
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="0" y1="0" x2={CELL_SIZE} y2={CELL_SIZE} stroke="#64748b" strokeWidth="1.5" />
                    </svg>
                    {/* Top right label (Columns) */}
                    <span className="absolute top-1 right-2 text-[11px] font-bold text-cyan-600 dark:text-cyan-400">
                      {varCount === 2 ? 'B' : varCount === 3 ? 'BC' : 'CD'}
                    </span>
                    {/* Bottom left label (Rows) */}
                    <span className="absolute bottom-1 left-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      {varCount === 2 ? 'A' : varCount === 3 ? 'A' : 'AB'}
                    </span>
                  </div>

                  {/* Column Labels */}
                  {kmapState.colLabels.map((colLabel, c) => (
                    <div
                      key={c}
                      className="shrink-0 flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300 mb-2"
                      style={{ width: CELL_SIZE }}
                    >
                      {colLabel}
                    </div>
                  ))}
                </div>

                {/* Rows Area: Row Headers + Cells Grid with Loop Overlay */}
                <div className="flex">
                  {/* Row Labels Column */}
                  <div className="flex flex-col mr-2">
                    {kmapState.rowLabels.map((rowLabel, r) => (
                      <div
                        key={r}
                        className="flex items-center justify-center font-mono font-bold text-xs text-slate-700 dark:text-slate-300"
                        style={{ width: CELL_SIZE, height: CELL_SIZE }}
                      >
                        {rowLabel}
                      </div>
                    ))}
                  </div>

                  {/* Cell Grid Matrix with SVG Loop Overlay on top */}
                  <div
                    className="relative shrink-0"
                    style={{ width: cols * CELL_SIZE, height: rows * CELL_SIZE }}
                  >
                    {/* The Cell Buttons */}
                    <div
                      className="grid"
                      style={{
                        gridTemplateColumns: `repeat(${cols}, ${CELL_SIZE}px)`,
                        gridTemplateRows: `repeat(${rows}, ${CELL_SIZE}px)`,
                      }}
                    >
                      {kmapState.grid.map((row, r) =>
                        row.map((cellVal, c) => {
                          const m = kmapState.cellMinterms[r][c];
                          const isOne = cellVal === 1;
                          const isDontCare = cellVal === 'X';

                          return (
                            <button
                              key={`${r}-${c}`}
                              onClick={() => toggleCell(r, c)}
                              className="relative flex flex-col items-center justify-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-lg transition-all focus:outline-none"
                              style={{ width: CELL_SIZE, height: CELL_SIZE }}
                            >
                              <span
                                className={`text-xl font-mono font-extrabold select-none ${
                                  isOne
                                    ? 'text-blue-600 dark:text-blue-400'
                                    : isDontCare
                                    ? 'text-amber-500'
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {cellVal}
                              </span>
                              <span className="absolute bottom-1 text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                {m}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* SVG Loop Boundary Overlay (Identical to Image 2 / karnaughmapsolver.com) */}
                    <svg
                      className="absolute inset-0 pointer-events-none"
                      width={cols * CELL_SIZE}
                      height={rows * CELL_SIZE}
                    >
                      {activeGroups.map((grp, idx) =>
                        renderGroupLoop(grp, idx, hoveredGroupId === grp.id)
                      )}
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1">
              <span>* Hover over any formula term or group card to highlight its loop boundary.</span>
              <span className="font-mono text-slate-300">
                {kmapState.minterms.length} minterms · {kmapState.maxterms.length} maxterms · {kmapState.dontCares.length} don't-cares
              </span>
            </div>
          </div>
        </div>

        {/* Right: Color-Matched Solution Formulas & Group Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Minimal Equation Card with Color-Matched Terms */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                {solutionMode === 'SOP' ? 'Minimal Sum of Products (SOP)' : 'Minimal Product of Sums (POS)'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                solutionMode === 'SOP' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              }`}>
                {solutionMode} Form
              </span>
            </div>

            {/* Color-Matched Solution Formula Box */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xl sm:text-2xl font-extrabold flex flex-wrap items-center gap-2 leading-relaxed shadow-inner">
              <span className="text-slate-200 mr-1">Y =</span>
              {activeGroups.length === 0 ? (
                <span className="text-slate-400">{solutionMode === 'SOP' ? '0' : '1'}</span>
              ) : (
                activeGroups.map((grp, idx) => {
                  const isHovered = hoveredGroupId === grp.id;
                  const termText = solutionMode === 'POS'
                    ? (grp.expression.startsWith('(') || activeGroups.length === 1 ? grp.expression : `(${grp.expression})`)
                    : grp.expression;

                  return (
                    <React.Fragment key={grp.id}>
                      <span
                        onMouseEnter={() => setHoveredGroupId(grp.id)}
                        onMouseLeave={() => setHoveredGroupId(null)}
                        style={{
                          color: grp.color,
                          borderColor: isHovered ? grp.color : 'transparent',
                          backgroundColor: isHovered ? `${grp.color}25` : 'transparent',
                        }}
                        className="px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                        title={`Group ${idx + 1}: cells [${grp.cells.join(', ')}]`}
                      >
                        {termText}
                      </span>
                      {idx < activeGroups.length - 1 && (
                        <span className="text-slate-500 font-bold">
                          {solutionMode === 'POS' ? '·' : '+'}
                        </span>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </div>

            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300 break-words">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Canonical Form:</span>
              {currentCanonical}
            </div>
          </div>

          {/* Groupings Identified */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 sm:p-6 space-y-3 shadow-xl">
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
                {activeGroups.map((grp, idx) => {
                  const isHovered = hoveredGroupId === grp.id;
                  return (
                    <div
                      key={grp.id}
                      onMouseEnter={() => setHoveredGroupId(grp.id)}
                      onMouseLeave={() => setHoveredGroupId(null)}
                      style={{
                        borderColor: isHovered ? grp.color : undefined,
                        backgroundColor: isHovered ? `${grp.color}15` : undefined,
                      }}
                      className="p-3 rounded-lg border border-slate-800 bg-slate-950/60 flex items-center justify-between transition-all cursor-pointer hover:border-slate-600"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className="h-4 w-4 rounded-full shrink-0 shadow-sm"
                          style={{ backgroundColor: grp.color }}
                        />
                        <div>
                          <span className="font-mono text-sm font-bold" style={{ color: grp.color }}>
                            Group {idx + 1}: {grp.expression}
                          </span>
                          <p className="text-[11px] text-slate-400">
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
                  );
                })}
              </div>
            )}
          </div>

          {/* Guide Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/90 p-5 space-y-2 text-xs text-slate-400 shadow-xl">
            <h4 className="font-bold text-slate-200 flex items-center gap-2">
              <Info className="h-4 w-4 text-amber-400" />
              <span>Grouping &amp; Color Match Legend</span>
            </h4>
            <p className="leading-relaxed">
              • Each colored boundary pill represents a simplified prime implicant group.
            </p>
            <p className="leading-relaxed">
              • Every term in the equation <code>Y = ...</code> matches the exact color of its loop on the map.
            </p>
            <p className="leading-relaxed">
              • Toroidal wrap groups (edges and 4 corners) have continuous open boundary arcs showing wrap-around adjacency.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
