import React from 'react';
import { 
  Cpu, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  HelpCircle, 
  Share2, 
  Settings,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeModule: string;
  setActiveModule: (mod: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
  onOpenHelp: () => void;
  onOpenSettings: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModule,
  setActiveModule,
  isDarkMode,
  setIsDarkMode,
  onOpenHelp,
  onOpenSettings,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}) => {
  const moduleTitles: Record<string, string> = {
    dashboard: 'Laboratory Dashboard',
    gates: 'Logic Gate Simulator',
    builder: 'Drag-and-Drop Circuit Builder',
    truthtable: 'Automatic Truth Table Generator',
    boolean: 'Boolean Algebra Solver',
    kmap: 'Karnaugh Map Solver',
    combinational: 'Combinational Circuits Lab',
    sequential: 'Sequential Circuits & Flip-Flops',
    numbers: 'Number Systems & Arithmetic',
    demos: 'Digital Demonstration Lab',
    learning: 'Learning Notes & Quizzes',
    projects: 'Project Management & Export',
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'DE-Lab Pro - Digital Electronics Virtual Laboratory',
        text: 'Interactive virtual digital electronics simulator and educational laboratory.',
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Application link copied to clipboard!');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand & Mobile Menu Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <button
            onClick={() => setActiveModule('dashboard')}
            className="flex items-center gap-2.5 text-left transition-opacity hover:opacity-90"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-sm">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white sm:text-lg">
                  DE-Lab <span className="text-emerald-400">Pro</span>
                </span>
                <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                  v2.5
                </span>
              </div>
              <p className="hidden text-[10px] text-slate-400 sm:block">Digital Electronics Virtual Laboratory</p>
            </div>
          </button>
        </div>

        {/* Current Active Module Breadcrumb */}
        <div className="hidden lg:flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">MODULE:</span>
          <span className="rounded-md bg-slate-800/80 px-3 py-1 text-xs font-semibold text-emerald-400 border border-slate-700/60">
            {moduleTitles[activeModule] || 'Virtual Lab'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Demo button */}
          <button
            onClick={() => setActiveModule('builder')}
            className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Open Builder</span>
          </button>

          <button
            onClick={handleShare}
            title="Share Laboratory Link"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Share2 className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenHelp}
            title="User Guide & Keyboard Shortcuts"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
          </button>

          <button
            onClick={onOpenSettings}
            title="Laboratory Settings"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Settings className="h-4 w-4" />
          </button>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
