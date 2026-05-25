import { blockTypes, canvasSizes, createBlock, iconSuggestions, templates, themePresets } from '../data/templates.js';
import {
  addElement,
  applyTemplate,
  applyTheme,
  deleteElement,
  duplicateElement,
  getCanvasSize,
  getSelectedElement,
  getState,
  moveLayer,
  polishLayout,
  setCanvasSize,
  setSelected,
  subscribe,
  updateElement,
  updateState
} from './store.js';
import { exportPdf, exportPng } from './export.js';
import { escapeAttr, escapeHtml, fileToDataUrl, normalizeLines } from './utils.js';
import { showToast } from './toast.js';

let panel = 'templates';
let dockPanel;
let dockTabs;

export function initPanels() {
  dockPanel = document.getElementById('dockPanel');
  dockTabs = document.getElementById('dockTabs');

  dockTabs.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-panel]');
    if (!button) return;
    setPanel(button.dataset.panel);
  });

  document.getElementById('canvasSizeSelect').addEventListener('change', (event) => setCanvasSize(event.target.value));
  document.getElementById('polishBtn').addEventListener('click', () => { polishLayout(); showToast('Layout polished'); });
  document.getElementById('quickExportBtn').addEventListener('click', () => setPanel('export'));
  document.getElementById('fitBtn').addEventListener('click', () => updateState({ zoom: getFitZoom() }, false));
  document.getElementById('exitPreviewBtn').addEventListener('click', exitPreview);
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') exitPreview(); });

  document.getElementById('logoUploadInput').addEventListener('change', handleLogoUpload);
  document.getElementById('photoUploadInput').addEventListener('change', handlePhotoUpload);
  window.addEventListener('infographic:selected', () => {
    if (panel !== 'export') setPanel('edit');
  });

  subscribe((state) => {
    document.getElementById('canvasSizeSelect').value = state.canvasSize;
    renderTabs();
    const active = document.activeElement;
    const isEditingPanelField = dockPanel?.contains(active) && active?.matches?.('input, textarea, select');
    if (!isEditingPanelField) renderPanel(state);
  });
}

export function setPanel(name) {
  panel = name;
  renderTabs();
  renderPanel(getState());
}

function renderTabs() {
  dockTabs.querySelectorAll('button[data-panel]').forEach((button) => {
    button.classList.toggle('active', button.dataset.panel === panel);
  });
}

function renderPanel(state) {
  const renderers = {
    templates: renderTemplates,
    insert: renderInsert,
    theme: renderTheme,
    edit: renderEdit,
    export: renderExport
  };
  dockPanel.innerHTML = '';
  dockPanel.appendChild((renderers[panel] || renderTemplates)(state));
}

function renderTemplates(state) {
  const root = makeRoot('Design', [smallIcon('undo', 'Undo', () => import('./store.js').then(m => m.undo() && showToast('Undo'))), smallIcon('redo', 'Redo', () => import('./store.js').then(m => m.redo() && showToast('Redo')))]);
  const grid = document.createElement('div');
  grid.className = 'template-grid';
  templates.forEach((template) => {
    const button = document.createElement('button');
    button.className = `template-card ${state.activeTemplate === template.id ? 'active' : ''}`;
    button.innerHTML = `<div class="template-preview tpl-${template.id}"><div class="mini-stack"><span class="mini-line"></span><span class="mini-line short"></span><span class="mini-card-shape"></span></div><div class="mini-stack"><span class="mini-stat"></span><span class="mini-stat"></span></div></div><strong>${template.name}</strong>`;
    button.addEventListener('click', () => { applyTemplate(template.id); showToast('Template applied'); });
    grid.appendChild(button);
  });
  root.appendChild(grid);
  return root;
}

function renderInsert() {
  const root = makeRoot('Insert');
  const grid = document.createElement('div');
  grid.className = 'tool-grid';
  blockTypes.forEach((block) => {
    const button = document.createElement('button');
    button.className = 'tool-card';
    button.innerHTML = `<span class="material-symbols-outlined">${block.icon}</span><small>${block.label}</small>`;
    button.addEventListener('click', () => {
      const element = createBlock(block.type, getCanvasSize());
      addElement(element);
      if (block.type === 'photo') document.getElementById('photoUploadInput').click();
      if (block.type === 'logoStrip') document.getElementById('logoUploadInput').click();
      setPanel('edit');
    });
    grid.appendChild(button);
  });
  root.appendChild(grid);
  root.appendChild(iconQuickPicker());
  return root;
}

function renderTheme(state) {
  const root = makeRoot('Brand');
  const swatches = document.createElement('div');
  swatches.className = 'swatch-grid';
  themePresets.forEach((theme) => {
    const button = document.createElement('button');
    button.className = `swatch-card ${state.theme.id === theme.id ? 'active' : ''}`;
    button.innerHTML = `<div class="swatch-strip"><span style="background:${theme.primary}"></span><span style="background:${theme.accent}"></span><span style="background:${theme.bg}"></span><span style="background:${theme.text}"></span></div><strong>${theme.name}</strong>`;
    button.addEventListener('click', () => { applyTheme(theme.id); showToast('Brand applied'); });
    swatches.appendChild(button);
  });
  root.appendChild(swatches);

  const custom = document.createElement('div');
  custom.className = 'grid-2 mini-card';
  custom.innerHTML = `
    ${colorField('Primary', 'primaryColor', state.theme.primary)}
    ${colorField('Accent', 'accentColor', state.theme.accent)}
    ${colorField('Background', 'bgColor', state.theme.bg)}
    ${colorField('Text', 'textColor', state.theme.text)}
    <label class="field">Background<select id="bgStyleSelect">
      <option value="aurora">Aurora</option>
      <option value="paper">Paper</option>
      <option value="grid">Grid</option>
      <option value="diagonal">Diagonal</option>
      <option value="clean">Clean</option>
      <option value="dark">Dark</option>
    </select></label>
    <label class="field">Zoom<input id="zoomRange" type="range" min="22" max="92" value="${state.zoom}"></label>
  `;
  root.appendChild(custom);
  custom.querySelector('#bgStyleSelect').value = state.backgroundStyle;
  custom.querySelectorAll('input[type="color"]').forEach((input) => {
    input.addEventListener('input', () => updateState({ theme: {
      ...getState().theme,
      primary: custom.querySelector('#primaryColor').value,
      accent: custom.querySelector('#accentColor').value,
      bg: custom.querySelector('#bgColor').value,
      text: custom.querySelector('#textColor').value
    }}, false));
  });
  custom.querySelector('#bgStyleSelect').addEventListener('change', (event) => updateState({ backgroundStyle: event.target.value }, true));
  custom.querySelector('#zoomRange').addEventListener('input', (event) => updateState({ zoom: Number(event.target.value) }, false));

  const options = document.createElement('div');
  options.className = 'row';
  options.innerHTML = `<button class="button ghost" id="snapBtn"><span class="material-symbols-outlined">grid_4x4</span>${state.snapToGrid ? 'Snap on' : 'Snap off'}</button><button class="button ghost" id="fitCanvasBtn"><span class="material-symbols-outlined">fit_screen</span>Fit canvas</button>`;
  root.appendChild(options);
  options.querySelector('#snapBtn').addEventListener('click', () => updateState({ snapToGrid: !getState().snapToGrid }, false));
  options.querySelector('#fitCanvasBtn').addEventListener('click', () => updateState({ zoom: getFitZoom() }, false));

  return root;
}

function renderEdit(state) {
  const selected = getSelectedElement();
  const root = makeRoot('Edit', selected ? [smallIcon('content_copy', 'Duplicate', () => duplicateElement()), smallIcon('delete', 'Delete', () => deleteElement())] : []);
  if (!selected) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'Tap a block to edit';
    root.appendChild(empty);
    return root;
  }

  const stack = document.createElement('div');
  stack.className = 'stack';
  stack.appendChild(renderContentFields(selected));
  stack.appendChild(renderStyleFields(selected));
  stack.appendChild(renderPositionFields(selected));
  root.appendChild(stack);
  return root;
}

function renderExport(state) {
  const root = makeRoot('Export');
  const scale = document.createElement('div');
  scale.className = 'mini-card stack';
  scale.innerHTML = `
    <label class="field">Quality
      <select id="exportScaleSelect">
        <option value="2">2x</option>
        <option value="3">3x</option>
        <option value="4">4x</option>
      </select>
    </label>
    <div class="grid-2">
      <button class="button" id="exportPngBtn"><span class="material-symbols-outlined">image</span>PNG</button>
      <button class="button primary" id="exportPdfBtn"><span class="material-symbols-outlined">picture_as_pdf</span>PDF</button>
    </div>
    <button class="button ghost full" id="previewBtn"><span class="material-symbols-outlined">visibility</span>Preview</button>
  `;
  root.appendChild(scale);
  scale.querySelector('#exportScaleSelect').value = state.exportScale;
  scale.querySelector('#exportScaleSelect').addEventListener('change', (event) => updateState({ exportScale: Number(event.target.value) }, false));
  scale.querySelector('#exportPngBtn').addEventListener('click', exportPng);
  scale.querySelector('#exportPdfBtn').addEventListener('click', exportPdf);
  scale.querySelector('#previewBtn').addEventListener('click', enterPreview);

  const project = document.createElement('div');
  project.className = 'grid-2';
  project.innerHTML = `<button class="button ghost" id="saveProject2"><span class="material-symbols-outlined">download</span>Save</button><label class="button ghost file-action" for="loadJsonInput"><span class="material-symbols-outlined">upload_file</span>Load</label>`;
  root.appendChild(project);
  project.querySelector('#saveProject2').addEventListener('click', () => document.getElementById('saveJsonBtn').click());
  return root;
}

function enterPreview() {
  document.body.classList.add('preview-mode');
  const zoom = getFitZoom();
  if (Number.isFinite(zoom)) updateState({ zoom }, false);
  showToast('Preview mode');
}

function exitPreview() {
  if (!document.body.classList.contains('preview-mode')) return;
  document.body.classList.remove('preview-mode');
  const zoom = getFitZoom();
  if (Number.isFinite(zoom)) updateState({ zoom }, false);
}

function renderContentFields(element) {
  const box = document.createElement('div');
  box.className = 'mini-card stack';

  const addText = (label, key, rows = 3) => {
    const field = document.createElement('label');
    field.className = 'field';
    field.innerHTML = `${label}<textarea rows="${rows}">${escapeHtml(element[key] || '')}</textarea>`;
    field.querySelector('textarea').addEventListener('input', (event) => updateElement(element.id, { [key]: event.target.value }, false));
    box.appendChild(field);
  };
  const addInput = (label, key, type = 'text') => {
    const field = document.createElement('label');
    field.className = 'field';
    field.innerHTML = `${label}<input type="${type}" value="${escapeAttr(element[key] || '')}">`;
    field.querySelector('input').addEventListener('input', (event) => updateElement(element.id, { [key]: event.target.value }, false));
    box.appendChild(field);
  };

  if (['heading', 'paragraph', 'kicker'].includes(element.type)) addText('Text', 'text', element.type === 'heading' ? 2 : 4);
  if (['card', 'iconCard'].includes(element.type)) {
    addInput('Icon name', 'icon');
    addInput('Title', 'title');
    addText('Body', 'body', 3);
  }
  if (element.type === 'stat') {
    addInput('Value', 'value');
    addInput('Label', 'label');
    addInput('Note', 'note');
  }
  if (element.type === 'list') {
    addInput('Title', 'title');
    const field = document.createElement('label');
    field.className = 'field';
    field.innerHTML = `Items<textarea rows="5">${escapeHtml((element.items || []).join('\n'))}</textarea>`;
    field.querySelector('textarea').addEventListener('input', (event) => updateElement(element.id, { items: normalizeLines(event.target.value) }, false));
    box.appendChild(field);
  }
  if (element.type === 'timeline') {
    const field = document.createElement('label');
    field.className = 'field';
    field.innerHTML = `Steps<textarea rows="5">${escapeHtml((element.items || []).join('\n'))}</textarea>`;
    field.querySelector('textarea').addEventListener('input', (event) => updateElement(element.id, { items: normalizeLines(event.target.value) }, false));
    box.appendChild(field);
  }
  if (element.type === 'logoStrip') {
    const controls = document.createElement('div');
    controls.className = 'stack';
    controls.innerHTML = `
      <label class="field">Slots<input type="number" min="1" max="8" value="${element.slots || 3}" id="slotCount"></label>
      <div class="row"><button class="button" id="addLogoBtn"><span class="material-symbols-outlined">add_photo_alternate</span>Add logos</button><button class="button ghost" id="clearLogosBtn">Clear</button></div>
      <div class="logo-list">${(element.logos || []).map((logo) => `<img class="logo-pill" src="${logo}" alt="Logo">`).join('')}</div>`;
    controls.querySelector('#slotCount').addEventListener('input', (event) => updateElement(element.id, { slots: Number(event.target.value) }, false));
    controls.querySelector('#addLogoBtn').addEventListener('click', () => document.getElementById('logoUploadInput').click());
    controls.querySelector('#clearLogosBtn').addEventListener('click', () => updateElement(element.id, { logos: [] }, true));
    box.appendChild(controls);
  }
  if (element.type === 'contact') {
    addInput('Email', 'email');
    addInput('Phone', 'phone');
    addInput('Location', 'location');
    addInput('Button', 'action');
  }
  if (element.type === 'photo') {
    const controls = document.createElement('div');
    controls.className = 'row';
    controls.innerHTML = `<button class="button" id="changePhotoBtn"><span class="material-symbols-outlined">add_photo_alternate</span>Choose photo</button><button class="button ghost" id="clearPhotoBtn">Clear</button>`;
    controls.querySelector('#changePhotoBtn').addEventListener('click', () => document.getElementById('photoUploadInput').click());
    controls.querySelector('#clearPhotoBtn').addEventListener('click', () => updateElement(element.id, { src: '' }, true));
    box.appendChild(controls);
  }
  if (['divider', 'shape'].includes(element.type)) {
    const mini = document.createElement('div');
    mini.className = 'row';
    mini.innerHTML = `<button class="button ghost" id="shapeSolid">Solid</button><button class="button ghost" id="shapeAccent">Accent</button>`;
    mini.querySelector('#shapeSolid').addEventListener('click', () => updateElement(element.id, { variant: 'solid' }, true));
    mini.querySelector('#shapeAccent').addEventListener('click', () => updateElement(element.id, { variant: 'accent' }, true));
    box.appendChild(mini);
  }

  return box;
}

function renderStyleFields(element) {
  const box = document.createElement('div');
  box.className = 'mini-card stack';
  box.innerHTML = `
    <label class="field">Font size<input type="range" min="8" max="140" value="${element.fontSize || 20}" id="fontSizeRange"></label>
    <label class="field">Opacity<input type="range" min="0" max="100" value="${element.opacity ?? 100}" id="opacityRange"></label>
    <label class="field">Style<select id="variantSelect"><option value="glass">Glass</option><option value="solid">Solid</option><option value="accent">Accent</option><option value="minimal">Minimal</option></select></label>
    <div class="segmented" id="alignControls">
      <button class="segment-button ${element.align === 'left' ? 'active' : ''}" data-align="left">Left</button>
      <button class="segment-button ${element.align === 'center' ? 'active' : ''}" data-align="center">Center</button>
      <button class="segment-button ${element.align === 'right' ? 'active' : ''}" data-align="right">Right</button>
    </div>`;
  box.querySelector('#variantSelect').value = element.variant || 'glass';
  box.querySelector('#fontSizeRange').addEventListener('input', (event) => updateElement(element.id, { fontSize: Number(event.target.value) }, false));
  box.querySelector('#opacityRange').addEventListener('input', (event) => updateElement(element.id, { opacity: Number(event.target.value) }, false));
  box.querySelector('#variantSelect').addEventListener('change', (event) => updateElement(element.id, { variant: event.target.value }, true));
  box.querySelector('#alignControls').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-align]');
    if (button) updateElement(element.id, { align: button.dataset.align }, true);
  });
  return box;
}

function renderPositionFields(element) {
  const box = document.createElement('div');
  box.className = 'mini-card stack';
  box.innerHTML = `
    <div class="grid-2">
      ${numField('X', 'x', element.x)}${numField('Y', 'y', element.y)}
      ${numField('W', 'w', element.w)}${numField('H', 'h', element.h)}
    </div>
    <div class="grid-2">
      <button class="button ghost" id="backwardBtn"><span class="material-symbols-outlined">flip_to_back</span>Back</button>
      <button class="button ghost" id="forwardBtn"><span class="material-symbols-outlined">flip_to_front</span>Front</button>
    </div>`;
  box.querySelectorAll('input[data-key]').forEach((input) => {
    input.addEventListener('input', (event) => updateElement(element.id, { [event.target.dataset.key]: Number(event.target.value) }, false));
  });
  box.querySelector('#backwardBtn').addEventListener('click', () => moveLayer(element.id, 'backward'));
  box.querySelector('#forwardBtn').addEventListener('click', () => moveLayer(element.id, 'forward'));
  return box;
}

function iconQuickPicker() {
  const box = document.createElement('div');
  box.className = 'mini-card stack';
  const title = document.createElement('div');
  title.className = 'row nowrap';
  title.innerHTML = '<strong style="font-size:12px">Icons</strong>';
  const grid = document.createElement('div');
  grid.className = 'grid-auto';
  iconSuggestions.slice(0, 12).forEach((icon) => {
    const button = document.createElement('button');
    button.className = 'button ghost compact';
    button.innerHTML = `<span class="material-symbols-outlined">${icon}</span>${icon.replaceAll('_', ' ')}`;
    button.addEventListener('click', () => {
      const selected = getSelectedElement();
      if (selected && ['card', 'iconCard'].includes(selected.type)) {
        updateElement(selected.id, { icon }, true);
        setPanel('edit');
      } else {
        const element = createBlock('iconCard', getCanvasSize());
        element.icon = icon;
        addElement(element);
        setPanel('edit');
      }
    });
    grid.appendChild(button);
  });
  box.append(title, grid);
  return box;
}

async function handleLogoUpload(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = '';
  if (!files.length) return;
  const selected = getSelectedElement();
  let logoElement = selected?.type === 'logoStrip' ? selected : getState().elements.find((el) => el.type === 'logoStrip');
  if (!logoElement) {
    logoElement = createBlock('logoStrip', getCanvasSize());
    addElement(logoElement);
  } else {
    setSelected(logoElement.id);
  }
  const dataUrls = await Promise.all(files.map(fileToDataUrl));
  const current = getState().elements.find((el) => el.id === logoElement.id) || logoElement;
  updateElement(logoElement.id, { logos: [...(current.logos || []), ...dataUrls], slots: Math.max(current.slots || 3, (current.logos || []).length + dataUrls.length) }, true);
  showToast('Logos added');
}

async function handlePhotoUpload(event) {
  const [file] = Array.from(event.target.files || []);
  event.target.value = '';
  if (!file) return;
  const selected = getSelectedElement();
  let photoElement = selected?.type === 'photo' ? selected : null;
  if (!photoElement) {
    photoElement = createBlock('photo', getCanvasSize());
    addElement(photoElement);
  }
  const src = await fileToDataUrl(file);
  updateElement(photoElement.id, { src }, true);
  setPanel('edit');
  showToast('Photo added');
}

function makeRoot(title, actions = []) {
  const root = document.createElement('div');
  root.className = 'stack';
  const heading = document.createElement('div');
  heading.className = 'panel-heading';
  heading.innerHTML = `<h2>${title}</h2><div class="mini-actions"></div>`;
  actions.forEach((action) => heading.querySelector('.mini-actions').appendChild(action));
  root.appendChild(heading);
  return root;
}

function smallIcon(icon, title, onClick) {
  const button = document.createElement('button');
  button.className = 'icon-button small ghost';
  button.title = title;
  button.innerHTML = `<span class="material-symbols-outlined">${icon}</span>`;
  button.addEventListener('click', onClick);
  return button;
}

function colorField(label, id, value) {
  return `<label class="field">${label}<input id="${id}" type="color" value="${value}"></label>`;
}

function numField(label, key, value) {
  return `<label class="field">${label}<input data-key="${key}" type="number" value="${Math.round(value)}"></label>`;
}

function getFitZoom() {
  const sizeKey = getState().canvasSize;
  const size = canvasSizes[sizeKey] || canvasSizes.portrait;
  const viewport = document.getElementById('canvasViewport');
  const scaleX = (viewport.clientWidth - 44) / size.w;
  const scaleY = (viewport.clientHeight - 44) / size.h;
  return Math.max(20, Math.min(92, Math.floor(Math.min(scaleX, scaleY) * 100)));
}

