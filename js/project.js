import { getState, loadProject, resetProject } from './store.js';
import { downloadBlob } from './utils.js';
import { showToast } from './toast.js';

export function initProjectControls() {
  document.getElementById('saveJsonBtn').addEventListener('click', saveJson);
  document.getElementById('loadJsonInput').addEventListener('change', loadJson);
  document.getElementById('newProjectBtn').addEventListener('click', () => {
    resetProject();
    showToast('New project');
  });
}

function saveJson() {
  const json = JSON.stringify(getState(), null, 2);
  downloadBlob(new Blob([json], { type: 'application/json' }), 'infographic-project.json');
  showToast('Project saved');
}

function loadJson(event) {
  const [file] = Array.from(event.target.files || []);
  event.target.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      if (loadProject(parsed)) showToast('Project loaded');
      else showToast('Invalid project');
    } catch {
      showToast('Invalid project');
    }
  };
  reader.readAsText(file);
}
