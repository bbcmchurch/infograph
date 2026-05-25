import { initCanvas } from './canvas.js';
import { initKeyboard } from './keyboard.js';
import { initPanels } from './panels.js';
import { initProjectControls } from './project.js';
import { restoreSavedState, subscribe } from './store.js';

initCanvas();
initPanels();
initProjectControls();
initKeyboard();
restoreSavedState();

subscribe((state) => {
  document.title = `Infographic Studio · ${state.canvasSize}`;
});
