import React from 'react';
import { 
  LayoutDashboard, 
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
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  setActiveModule,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const navSections = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: 'Home' },
      ],
    },
    {
      title: 'CORE SIMULATION',
      items: [
        { id: 'gates', label: 'Logic Gates', icon: GitCommit, badge: '7 Gates' },
        { id: 'builder', label: 'Circuit Builder', icon: Workflow, badge: 'Interactive' },
        { id: 'truthtable', label: 'Truth Tables', icon: Table, badge: 'CSV Export' },
      ],
    },
    {
      title: 'BOOLEAN ANALYSIS',
      items: [
        { id: 'boolean', label: 'Boolean Solver', icon: Binary, badge: 'Step-by-Step' },
        { id: 'kmap', label: 'Karnaugh Maps', icon: Grid3X3, badge: '2-4 Vars' },
      ],
    },
    {
      title: 'CIRCUIT FAMILIES',
      items: [
        { id: 'combinational', label: 'Combinational', icon: Network, badge: '9 Circuits' },
        { id: 'sequential', label: 'Sequential & Clock', icon: Activity, badge: 'Flip-Flops' },
      ],
    },
    {
      title: 'TOOLS & DEMOS',
      items: [
        { id: 'numbers', label: 'Number Systems', icon: Calculator, badge: 'Radix' },
        { id: 'demos', label: 'Digital Demos', icon: MonitorPlay, badge: '6 Systems' },
      ],
    },
    {
      title: 'EDUCATION & WORKSPACE',
      items: [
        { id: 'learning', label: 'Learning & Quizzes', icon: GraduationCap, badge: 'Practice' },
        { id: 'projects', label: 'Project Vault', icon: FolderArchive, badge: 'Local' },
      ],
    },
  ];

  const handleSelect = (id: string) => {
    setActiveModule(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside 
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 border-r border-slate-800 bg-slate-900/95 p-3 overflow-y-auto transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {navSections.map(section => (
            <div key={section.title} className="space-y-1">
              <h3 className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {section.title}
              </h3>
              <div className="space-y-0.5">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30 shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          isActive 
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40' 
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {item.badge}
                        </span>
                        {isActive && <ChevronRight className="h-3 w-3 text-emerald-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* College Team Footer */}
        <div className="mt-8 rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300">Engineering Virtual Lab</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Four-Member College Capstone Team</p>
          <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Simulation Engine Online</span>
          </div>
        </div>
      </aside>
    </>
  );
};
