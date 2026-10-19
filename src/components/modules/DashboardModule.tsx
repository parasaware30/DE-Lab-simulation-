import React, { useState } from 'react';
import { 
  GitCommit, 
  Workflow, 
  Table, 
  Binary, 
  Grid3X3, 
  Network, 
  Activity, 
  Calculator, 
  MonitorPlay, 
  GraduationCap, 
  FolderArchive,
  Search,
  Sparkles,
  ArrowRight,
  Play,
  Clock,
  Layers,
  ShieldCheck
} from 'lucide-react';
import { SAMPLE_CIRCUITS } from '../../engine/sampleCircuits';
import { getAllSavedProjects } from '../../engine/storage/projectStore';
import { Circuit } from '../../engine/types';

interface DashboardProps {
  onSelectModule: (mod: string) => void;
  onLoadCircuit: (circuit: Circuit) => void;
}

export const DashboardModule: React.FC<DashboardProps> = ({
  onSelectModule,
  onLoadCircuit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const savedProjects = getAllSavedProjects();

  const labModules = [
    {
      id: 'gates',
      title: 'Logic Gate Simulator',
      desc: 'Simulate all 7 fundamental gates (AND, OR, NOT, NAND, NOR, XOR, XNOR) with interactive truth tables and IEEE symbols.',
      icon: GitCommit,
      category: 'Fundamentals',
      badge: '7 Gates',
      color: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/30',
    },
    {
      id: 'builder',
      title: 'Circuit Builder Workspace',
      desc: 'Interactive drag-and-drop schematic editor. Wire components, toggle switches, observe live signal paths and active HIGH/LOW states.',
      icon: Workflow,
      category: 'Design & CAD',
      badge: 'Interactive',
      color: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/30',
    },
    {
      id: 'truthtable',
      title: 'Automatic Truth Table Generator',
      desc: 'Compute complete 2ⁿ input-output combinations for any combinational circuit with multi-output support and CSV export.',
      icon: Table,
      category: 'Analysis',
      badge: 'CSV Export',
      color: 'from-cyan-500/20 to-cyan-600/5 text-cyan-400 border-cyan-500/30',
    },
    {
      id: 'boolean',
      title: 'Boolean Algebra Solver',
      desc: 'Safe algebraic parser, step-by-step simplification using Boolean laws, equivalence verification, and schematic synthesis.',
      icon: Binary,
      category: 'Algebra',
      badge: 'Step-by-Step',
      color: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/30',
    },
    {
      id: 'kmap',
      title: 'Karnaugh Map Solver',
      desc: '2, 3, and 4-variable K-Maps with Gray code indexing, cell toggling, don\'t-care support, and toroidal wrap-around group reduction.',
      icon: Grid3X3,
      category: 'Optimization',
      badge: '2-4 Vars',
      color: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/30',
    },
    {
      id: 'combinational',
      title: 'Combinational Circuits Lab',
      desc: 'Working interactive simulations of Adders, Subtractors, 4:1 MUX, 1:4 DEMUX, Priority Encoders, Decoders, and Comparators.',
      icon: Network,
      category: 'MSI Circuits',
      badge: '9 Circuits',
      color: 'from-pink-500/20 to-pink-600/5 text-pink-400 border-pink-500/30',
    },
    {
      id: 'sequential',
      title: 'Sequential Circuits & Flip-Flops',
      desc: 'SR, JK, D, and T Flip-Flops with manual/auto clock pulses, excitation tables, shift registers, counters, and timing waveforms.',
      icon: Activity,
      category: 'Sequential',
      badge: 'Waveforms',
      color: 'from-indigo-500/20 to-indigo-600/5 text-indigo-400 border-indigo-500/30',
    },
    {
      id: 'numbers',
      title: 'Number Systems & Arithmetic',
      desc: 'Binary, Octal, Decimal, Hexadecimal conversions with mathematical steps, 1\'s and 2\'s complement, and binary addition with carry.',
      icon: Calculator,
      category: 'Arithmetic',
      badge: 'Radix',
      color: 'from-teal-500/20 to-teal-600/5 text-teal-400 border-teal-500/30',
    },
    {
      id: 'demos',
      title: 'Digital Demonstration Lab',
      desc: 'Practical digital systems: 7-segment display, traffic light controller, digital password lock, home security alarm, and audio MUX.',
      icon: MonitorPlay,
      category: 'Applications',
      badge: '6 Systems',
      color: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/30',
    },
    {
      id: 'learning',
      title: 'Learning Notes & Quizzes',
      desc: 'Curated digital electronics theory notes, IC pinouts reference, and interactive multiple-choice quizzes with instant scoring.',
      icon: GraduationCap,
      category: 'Education',
      badge: '18+ Quizzes',
      color: 'from-yellow-500/20 to-yellow-600/5 text-yellow-400 border-yellow-500/30',
    },
    {
      id: 'projects',
      title: 'Project Vault & Export',
      desc: 'Manage locally persisted circuits, duplicate, export diagrams to PNG/SVG, and export/import project files without mandatory login.',
      icon: FolderArchive,
      category: 'Management',
      badge: 'Storage',
      color: 'from-slate-500/20 to-slate-600/5 text-slate-300 border-slate-700',
    },
  ];

  const filteredModules = labModules.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Digital Electronics Virtual Laboratory</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
            Design, Simulate, and Master <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              Digital Logic Circuits Online
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to <strong>DE-Lab Pro</strong>. A complete virtual laboratory built with a deterministic 
            logic simulation engine. Explore logic gates, wire interactive circuits, solve Boolean expressions, 
            analyze Karnaugh maps, and test sequential flip-flops without installing software or creating accounts.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSelectModule('builder')}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:scale-[1.02]"
            >
              <Workflow className="h-4 w-4" />
              <span>Launch Circuit Builder</span>
            </button>

            <button
              onClick={() => onSelectModule('gates')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
            >
              <GitCommit className="h-4 w-4 text-emerald-400" />
              <span>Explore Logic Gates</span>
            </button>

            <button
              onClick={() => onSelectModule('learning')}
              className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-200 transition-colors"
            >
              <GraduationCap className="h-4 w-4 text-amber-400" />
              <span>Practice Quizzes</span>
            </button>
          </div>
        </div>

        {/* Engineering features strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-slate-800/80 pt-6">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Deterministic Math Engine</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Layers className="h-4 w-4 text-cyan-400 shrink-0" />
            <span>Multi-Platform Responsive</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Zero Mandatory Login</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <FolderArchive className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Offline Local Storage</span>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Laboratory Modules</h2>
          <p className="text-xs text-slate-400">Select any module below to begin testing and simulation</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tools, gates, maps..."
            className="w-full rounded-lg border border-slate-800 bg-slate-900/90 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map(mod => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.id}
              onClick={() => onSelectModule(mod.id)}
              className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-850 hover:shadow-lg hover:shadow-slate-950/50 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg border bg-gradient-to-br ${mod.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                    {mod.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {mod.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs font-medium text-slate-400 group-hover:text-emerald-400">
                <span>Open module</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Sample Circuits Gallery */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Sample Circuits & Guided Demonstrations</h2>
            <p className="text-xs text-slate-400">Pre-built circuits ready to load into the Circuit Builder</p>
          </div>
          <button
            onClick={() => onSelectModule('builder')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>Blank Canvas</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {SAMPLE_CIRCUITS.map(sample => (
            <div
              key={sample.id}
              className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    {sample.nodes.length} Nodes
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {sample.wires.length} Wires
                  </span>
                </div>
                <h4 className="mt-2 text-xs font-bold text-white">{sample.name}</h4>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">{sample.description}</p>
              </div>

              <button
                onClick={() => {
                  onLoadCircuit(sample);
                  onSelectModule('builder');
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 py-1.5 text-xs font-semibold text-emerald-300 transition-colors"
              >
                <Play className="h-3 w-3" />
                <span>Simulate Preset</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Projects Section */}
      {savedProjects.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Recent Local Projects</h2>
              <p className="text-xs text-slate-400">Persisted locally in your browser storage</p>
            </div>
            <button
              onClick={() => onSelectModule('projects')}
              className="text-xs text-slate-400 hover:text-white font-medium"
            >
              View all ({savedProjects.length})
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {savedProjects.slice(0, 3).map(proj => (
              <div
                key={proj.id}
                onClick={() => {
                  onLoadCircuit(proj);
                  onSelectModule('builder');
                }}
                className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950/40 p-3.5 hover:border-slate-700 transition-colors"
              >
                <h4 className="text-xs font-bold text-white truncate">{proj.name}</h4>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                  <span>{proj.nodes.length} nodes · {proj.wires.length} wires</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
