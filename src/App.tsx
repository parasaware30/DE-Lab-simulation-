import React, { useState, useEffect } from 'react';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HelpModal } from './components/common/HelpModal';
import { SettingsModal } from './components/common/SettingsModal';

import { DashboardModule } from './components/modules/DashboardModule';
import { GateSimulatorModule } from './components/modules/GateSimulatorModule';
import { CircuitEditorModule } from './components/modules/CircuitEditorModule';
import { TruthTableModule } from './components/modules/TruthTableModule';
import { BooleanSolverModule } from './components/modules/BooleanSolverModule';
import { KMapModule } from './components/modules/KMapModule';
import { CombinationalModule } from './components/modules/CombinationalModule';
import { SequentialModule } from './components/modules/SequentialModule';
import { NumberSystemsModule } from './components/modules/NumberSystemsModule';
import { DemonstrationsModule } from './components/modules/DemonstrationsModule';
import { LearningModule } from './components/modules/LearningModule';
import { ProjectsModule } from './components/modules/ProjectsModule';

import { Circuit } from './engine/types';
import { SAMPLE_CIRCUITS } from './engine/sampleCircuits';
import { restoreDefaultSamples } from './engine/storage/projectStore';

export function App() {
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('delab_theme') !== 'light';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Active Circuit loaded in builder
  const [activeCircuit, setActiveCircuit] = useState<Circuit>(SAMPLE_CIRCUITS[0]);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('delab_theme', isDarkMode ? 'dark' : 'light');
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleLoadCircuit = (circuit: Circuit) => {
    setActiveCircuit(circuit);
  };

  const handleResetStorage = () => {
    localStorage.clear();
    restoreDefaultSamples();
    window.location.reload();
  };

  return (
    <ErrorBoundary>
      <div className={`h-screen h-[100dvh] flex flex-col overflow-hidden ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        {/* Top Navbar */}
        <Navbar
          activeModule={activeModule}
          setActiveModule={setActiveModule}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        {/* Body Layout: Sidebar + Main Content */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          <Sidebar
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          <main className="flex-1 overflow-y-auto relative min-h-0">
            {activeModule === 'dashboard' && (
              <DashboardModule
                onSelectModule={mod => setActiveModule(mod)}
                onLoadCircuit={circuit => {
                  handleLoadCircuit(circuit);
                  setActiveModule('builder');
                }}
              />
            )}

            {activeModule === 'gates' && <GateSimulatorModule />}

            {activeModule === 'builder' && (
              <CircuitEditorModule
                key={activeCircuit.id}
                initialCircuit={activeCircuit}
                onSaveToVault={c => setActiveCircuit(c)}
              />
            )}

            {activeModule === 'truthtable' && <TruthTableModule />}

            {activeModule === 'boolean' && (
              <BooleanSolverModule
                onLoadCircuitToBuilder={circuit => {
                  handleLoadCircuit(circuit);
                  setActiveModule('builder');
                }}
                onNavigateToBuilder={() => setActiveModule('builder')}
              />
            )}

            {activeModule === 'kmap' && <KMapModule />}

            {activeModule === 'combinational' && <CombinationalModule />}

            {activeModule === 'sequential' && <SequentialModule />}

            {activeModule === 'numbers' && <NumberSystemsModule />}

            {activeModule === 'demos' && <DemonstrationsModule />}

            {activeModule === 'learning' && <LearningModule />}

            {activeModule === 'projects' && (
              <ProjectsModule
                onLoadCircuitToBuilder={circuit => {
                  handleLoadCircuit(circuit);
                  setActiveModule('builder');
                }}
                onNavigateToBuilder={() => setActiveModule('builder')}
              />
            )}
          </main>
        </div>

        {/* Global Modals */}
        <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          onResetStorage={handleResetStorage}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
