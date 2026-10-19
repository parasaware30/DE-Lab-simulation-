import React, { useState, useRef } from 'react';
import { 
  Circuit 
} from '../../engine/types';
import { 
  getAllSavedProjects, 
  saveProject, 
  deleteProject, 
  duplicateProject, 
  restoreDefaultSamples,
  exportProjectAsJSON,
  exportProjectAsDigitalXML,
  importProjectFromFile
} from '../../engine/storage/projectStore';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Download, 
  Upload, 
  RotateCcw, 
  Play, 
  Calendar,
  FileCode2,
  ExternalLink
} from 'lucide-react';

interface ProjectsModuleProps {
  onLoadCircuitToBuilder: (circuit: Circuit) => void;
  onNavigateToBuilder: () => void;
}

export const ProjectsModule: React.FC<ProjectsModuleProps> = ({
  onLoadCircuitToBuilder,
  onNavigateToBuilder,
}) => {
  const [projects, setProjects] = useState<Circuit[]>(() => getAllSavedProjects());
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshList = () => {
    setProjects(getAllSavedProjects());
  };

  const handleCreateNew = () => {
    const newProj: Circuit = {
      id: `proj_${Date.now()}`,
      name: `Untitled Circuit ${projects.length + 1}`,
      description: 'Custom digital logic schematic',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      nodes: [],
      wires: [],
    };
    saveProject(newProj);
    refreshList();
    onLoadCircuitToBuilder(newProj);
    onNavigateToBuilder();
  };

  const handleDelete = (id: string) => {
    const updated = deleteProject(id);
    setProjects(updated);
    setDeleteTargetId(null);
    setFeedbackMsg('Project removed successfully.');
  };

  const handleDuplicate = (id: string) => {
    const copy = duplicateProject(id);
    if (copy) {
      refreshList();
      setFeedbackMsg(`Created copy: "${copy.name}"`);
    }
  };

  const handleSaveRename = () => {
    if (!renameTarget) return;
    const target = projects.find(p => p.id === renameTarget.id);
    if (target) {
      saveProject({ ...target, name: renameTarget.name });
      refreshList();
      setRenameTarget(null);
      setFeedbackMsg('Project renamed successfully.');
    }
  };

  const handleRestoreSamples = () => {
    const restored = restoreDefaultSamples();
    setProjects(restored);
    setFeedbackMsg('Default sample circuits restored.');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const content = evt.target?.result as string;
      const res = importProjectFromFile(file.name, content);
      if (res.success && res.circuit) {
        refreshList();
        setFeedbackMsg(`Successfully imported "${res.circuit.name}" from ${file.name}!`);
      } else {
        alert(`Import failed: ${res.error}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
          Project Vault & Interoperability Center
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Save circuits locally, with full bidirectional compatibility with <strong>HNeemann Digital (.dig)</strong> and JSON formats
        </p>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-800 bg-slate-900/80">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Circuit Project</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
          >
            <Upload className="h-4 w-4 text-cyan-400" />
            <span>Import (.json / .dig)</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json,.dig"
            className="hidden"
          />
        </div>

        <button
          onClick={handleRestoreSamples}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white text-xs border border-slate-700 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Restore Sample Presets</span>
        </button>
      </div>

      {/* HNeemann Digital Reference Banner */}
      <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-cyan-200">
        <div className="flex items-center gap-2.5">
          <FileCode2 className="h-5 w-5 text-cyan-400 shrink-0" />
          <div>
            <strong className="text-white">Referenced from HNeemann Digital</strong>
            <p className="text-[11px] text-cyan-300/80 mt-0.5">
              Supports loading and exporting circuit schematics compatible with the open-source <a href="https://github.com/hneemann/Digital" target="_blank" rel="noreferrer" className="underline font-bold text-white hover:text-cyan-300 inline-flex items-center gap-0.5">HNeemann Digital Simulator <ExternalLink className="h-3 w-3" /></a> (.dig format).
            </p>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg(null)} className="text-xs text-slate-400">✕</button>
        </div>
      )}

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map(proj => (
          <div
            key={proj.id}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded font-bold">
                  {proj.nodes.length} Components
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {proj.wires.length} Wires
                </span>
              </div>

              {renameTarget?.id === proj.id ? (
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={renameTarget.name}
                    onChange={e => setRenameTarget({ ...renameTarget, name: e.target.value })}
                    className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-white"
                  />
                  <button
                    onClick={handleSaveRename}
                    className="px-2 py-1 rounded bg-emerald-600 text-xs font-bold text-white"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <h3
                  onClick={() => setRenameTarget({ id: proj.id, name: proj.name })}
                  className="text-sm font-bold text-white cursor-pointer hover:text-emerald-400 transition-colors"
                  title="Click to rename"
                >
                  {proj.name}
                </h3>
              )}

              <p className="text-xs text-slate-400 line-clamp-2">
                {proj.description || 'No description provided.'}
              </p>

              <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-1">
                <Calendar className="h-3 w-3" />
                <span>Updated: {new Date(proj.updatedAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => {
                  onLoadCircuitToBuilder(proj);
                  onNavigateToBuilder();
                }}
                className="w-full py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Play className="h-3.5 w-3.5" />
                <span>Open in Circuit Builder</span>
              </button>

              <div className="flex items-center justify-between gap-1">
                <button
                  onClick={() => exportProjectAsDigitalXML(proj)}
                  title="Export as HNeemann Digital XML (.dig)"
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 text-[11px] font-mono font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>.dig</span>
                </button>

                <button
                  onClick={() => exportProjectAsJSON(proj)}
                  title="Export as JSON"
                  className="flex items-center gap-1 px-2 py-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-[11px] font-mono font-bold"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>.json</span>
                </button>

                <button
                  onClick={() => handleDuplicate(proj.id)}
                  title="Duplicate project"
                  className="p-2 rounded text-slate-400 hover:text-white hover:bg-slate-800 text-xs"
                >
                  <Copy className="h-4 w-4" />
                </button>

                <button
                  onClick={() => setDeleteTargetId(proj.id)}
                  title="Delete project"
                  className="p-2 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Project?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete this circuit project from local storage?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteTargetId)}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
