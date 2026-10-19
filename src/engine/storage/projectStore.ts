import { Circuit } from '../types';
import { SAMPLE_CIRCUITS } from '../sampleCircuits';

const STORAGE_KEY = 'delab_pro_projects_v1';
const ACTIVE_PROJECT_KEY = 'delab_pro_active_project_id';

export interface ProjectMeta {
  id: string;
  name: string;
  description: string;
  updatedAt: number;
  nodeCount: number;
  wireCount: number;
}

export function getAllSavedProjects(): Circuit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with sample circuits on first launch
      saveProjectsToDisk(SAMPLE_CIRCUITS);
      return SAMPLE_CIRCUITS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Storage corrupted, resetting with sample circuits');
      return SAMPLE_CIRCUITS;
    }
    return parsed;
  } catch (err) {
    console.error('Failed reading projects from LocalStorage:', err);
    return SAMPLE_CIRCUITS;
  }
}

export function saveProjectsToDisk(projects: Circuit[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    return true;
  } catch (err) {
    console.error('LocalStorage write failed:', err);
    return false;
  }
}

export function saveProject(circuit: Circuit): boolean {
  const projects = getAllSavedProjects();
  const idx = projects.findIndex(p => p.id === circuit.id);
  const updatedCircuit: Circuit = {
    ...circuit,
    updatedAt: Date.now(),
  };

  if (idx >= 0) {
    projects[idx] = updatedCircuit;
  } else {
    projects.unshift(updatedCircuit);
  }

  const success = saveProjectsToDisk(projects);
  if (success) {
    localStorage.setItem(ACTIVE_PROJECT_KEY, updatedCircuit.id);
  }
  return success;
}

export function deleteProject(id: string): Circuit[] {
  const projects = getAllSavedProjects().filter(p => p.id !== id);
  saveProjectsToDisk(projects);
  return projects;
}

export function duplicateProject(id: string): Circuit | null {
  const projects = getAllSavedProjects();
  const orig = projects.find(p => p.id === id);
  if (!orig) return null;

  const copy: Circuit = {
    ...orig,
    id: `project_${Date.now()}`,
    name: `${orig.name} (Copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  projects.unshift(copy);
  saveProjectsToDisk(projects);
  return copy;
}

export function restoreDefaultSamples(): Circuit[] {
  saveProjectsToDisk(SAMPLE_CIRCUITS);
  return SAMPLE_CIRCUITS;
}

export function exportProjectAsJSON(circuit: Circuit): void {
  const jsonStr = JSON.stringify(circuit, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${circuit.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_delab.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importProjectFromJSON(jsonText: string): { success: boolean; circuit?: Circuit; error?: string } {
  try {
    const data = JSON.parse(jsonText);
    if (!data.id || !Array.isArray(data.nodes) || !Array.isArray(data.wires)) {
      return { success: false, error: 'Incompatible file schema. Must include nodes and wires arrays.' };
    }
    const importedCircuit: Circuit = {
      ...data,
      id: `imported_${Date.now()}`,
      name: data.name ? `${data.name} (Imported)` : 'Imported Circuit',
      updatedAt: Date.now(),
    };
    saveProject(importedCircuit);
    return { success: true, circuit: importedCircuit };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Invalid JSON format' };
  }
}
