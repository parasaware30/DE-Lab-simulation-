import React, { useState } from 'react';
import { 
  parseBooleanExpression, 
  extractVariables 
} from '../../engine/boolean/parser';
import { 
  generateASTTruthTable 
} from '../../engine/boolean/evaluator';
import { 
  Download, 
  Table as TableIcon, 
  Sparkles, 
  AlertCircle, 
  Search,
  CheckCircle2
} from 'lucide-react';

export const TruthTableModule: React.FC = () => {
  const [expressions, setExpressions] = useState<string[]>([
    'A * B + C',
    "A' * B + A * C'",
  ]);
  const [activeInput, setActiveInput] = useState<string>('A * B + C');
  const [filterQuery, setFilterQuery] = useState<string>('');

  // Built-in presets for quick evaluation
  const presetFormulas = [
    { label: 'Half Adder Sum', expr: 'A ^ B' },
    { label: 'Full Adder Carry', expr: 'A * B + Cin * (A ^ B)' },
    { label: '2:1 MUX', expr: "S' * D0 + S * D1" },
    { label: 'XOR from NANDs', expr: "(A * (A * B)')' * (B * (A * B)')'" },
    { label: 'Majority 3-Input', expr: 'A*B + B*C + A*C' },
    { label: 'Comparator A > B', expr: "A * B'" },
  ];

  let parsedData = null;
  let errorMsg = null;

  try {
    const ast = parseBooleanExpression(activeInput);
    parsedData = generateASTTruthTable(ast);
  } catch (err: unknown) {
    errorMsg = err instanceof Error ? err.message : 'Invalid Boolean expression syntax.';
  }

  const handleExportCSV = () => {
    if (!parsedData) return;
    const headers = [...parsedData.variables, 'Output (Y)'].join(',');
    const rows = parsedData.rows.map(r => {
      const inVals = parsedData!.variables.map(v => r.inputs[v]);
      return [...inVals, r.output].join(',');
    });
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `truth_table_${activeInput.replace(/[^a-zA-Z0-9]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredRows = parsedData?.rows.filter(r => {
    if (!filterQuery) return true;
    const rowStr = Object.values(r.inputs).join('') + r.output;
    return rowStr.includes(filterQuery);
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Automatic Truth Table Generator
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Compute complete 2ⁿ state matrices for any digital combinational function with CSV data export
        </p>
      </div>

      {/* Input Box & Presets */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Boolean Expression Input</span>
            <span className="text-[11px] font-mono text-emerald-400 font-normal">
              Operators: * (AND), + (OR), ! or ' (NOT), ^ (XOR)
            </span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={activeInput}
              onChange={e => setActiveInput(e.target.value)}
              placeholder="e.g. A * B + C or A'B + AB'"
              className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-mono text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
            <button
              onClick={handleExportCSV}
              disabled={!parsedData}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 px-4 py-2.5 text-xs font-bold text-white shadow transition-colors shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Preset Badges */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Load Preset Logic:</span>
          <div className="flex flex-wrap gap-1.5">
            {presetFormulas.map(p => (
              <button
                key={p.label}
                onClick={() => setActiveInput(p.expr)}
                className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-xs text-slate-300 border border-slate-700 transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {errorMsg ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-300 flex items-start gap-3 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <div>
            <h4 className="font-bold">Syntax Parsing Error</h4>
            <p className="mt-1">{errorMsg}</p>
          </div>
        </div>
      ) : parsedData ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TableIcon className="h-4 w-4 text-emerald-400" />
                <span>Generated Truth Matrix</span>
              </h3>
              <p className="text-xs text-slate-400">
                Variables: [{parsedData.variables.join(', ')}] · Total combinations: {parsedData.rows.length} (2^{parsedData.variables.length})
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="Filter bits (e.g. 101)..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 max-h-96 overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 bg-slate-800 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="p-3 text-center text-slate-500 w-12">#</th>
                  {parsedData.variables.map(v => (
                    <th key={v} className="p-3 text-center text-slate-200 font-bold">{v}</th>
                  ))}
                  <th className="p-3 text-center text-emerald-400 font-bold">Output (Y)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredRows?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-2 text-center text-[10px] text-slate-500 font-mono">{idx}</td>
                    {parsedData!.variables.map(v => (
                      <td key={v} className="p-2 text-center text-slate-300">
                        {row.inputs[v]}
                      </td>
                    ))}
                    <td className="p-2 text-center font-bold">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-xs ${
                        row.output === 1
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50 shadow-sm'
                          : 'bg-slate-900 text-slate-400'
                      }`}>
                        {row.output}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};
