import { deleteElement, duplicateElement, getSelectedElement, moveLayer, undo, updateElement } from './store.js';
import { showToast } from './toast.js';

export function initKeyboard() {
  window.addEventListener('keydown', (event) => {
    const active = document.activeElement;
    const typing = active && (active.matches('input, textarea, select') || active.isContentEditable);
    if (typing) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      if (undo()) showToast('Undo');
      return;
    }

    const selected = getSelectedElement();
    if (!selected) return;
    const step = event.shiftKey ? 12 : 2;
    const moves = {
      ArrowUp: { y: selected.y - step },
      ArrowDown: { y: selected.y + step },
      ArrowLeft: { x: selected.x - step },
      ArrowRight: { x: selected.x + step }
    };
    if (moves[event.key]) {
      event.preventDefault();
      updateElement(selected.id, moves[event.key], true);
    }
    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      deleteElement(selected.id);
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') {
      event.preventDefault();
      duplicateElement(selected.id);
    }
    if (event.key === ']' && (event.ctrlKey || event.metaKey)) moveLayer(selected.id, 'forward');
    if (event.key === '[' && (event.ctrlKey || event.metaKey)) moveLayer(selected.id, 'backward');
  });
}
