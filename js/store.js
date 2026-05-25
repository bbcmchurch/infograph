import { clone, clamp } from './utils.js';
import { canvasSizes, defaultState, templates, themePresets } from '../data/templates.js';

let state = clone(defaultState);
const listeners = new Set();
const history = [];
const future = [];

function emit() {
  listeners.forEach((listener) => listener(getState()));
  try { localStorage.setItem('infographicStudioState', JSON.stringify(state)); } catch {}
}

function snapshot() {
  history.push(clone(state));
  if (history.length > 50) history.shift();
  future.length = 0;
}

export function subscribe(listener) {
  listeners.add(listener);
  listener(getState());
  return () => listeners.delete(listener);
}

export function getState() {
  return clone(state);
}

export function getCanvasSize() {
  return canvasSizes[state.canvasSize] || canvasSizes.portrait;
}

export function getSelectedElement() {
  return clone(state.elements.find((element) => element.id === state.selectedId) || null);
}

export function restoreSavedState() {
  try {
    const saved = localStorage.getItem('infographicStudioState');
    if (!saved) return false;
    const parsed = JSON.parse(saved);
    if (!parsed || !Array.isArray(parsed.elements)) return false;
    state = { ...clone(defaultState), ...parsed };
    emit();
    return true;
  } catch {
    return false;
  }
}

export function setSelected(id) {
  state.selectedId = id;
  emit();
}

export function captureHistory() {
  snapshot();
}

export function updateState(patch, withHistory = true) {
  if (withHistory) snapshot();
  state = { ...state, ...clone(patch) };
  emit();
}

export function updateElement(id, patch, withHistory = true) {
  if (withHistory) snapshot();
  const size = getCanvasSize();
  state.elements = state.elements.map((element) => {
    if (element.id !== id) return element;
    const next = { ...element, ...clone(patch) };
    next.x = clamp(next.x, -next.w + 30, size.w - 30);
    next.y = clamp(next.y, -next.h + 30, size.h - 30);
    next.w = clamp(next.w, 10, size.w * 1.4);
    next.h = clamp(next.h, 4, size.h * 1.4);
    next.opacity = clamp(next.opacity ?? 100, 0, 100);
    next.fontSize = clamp(next.fontSize ?? 20, 8, 140);
    return next;
  });
  emit();
}

export function addElement(element) {
  snapshot();
  const maxZ = Math.max(10, ...state.elements.map((el) => el.z || 10));
  const next = { ...clone(element), z: maxZ + 1 };
  state.elements = [...state.elements, next];
  state.selectedId = next.id;
  emit();
}

export function deleteElement(id = state.selectedId) {
  if (!id) return;
  snapshot();
  state.elements = state.elements.filter((el) => el.id !== id);
  if (state.selectedId === id) state.selectedId = null;
  emit();
}

export function duplicateElement(id = state.selectedId) {
  const source = state.elements.find((el) => el.id === id);
  if (!source) return;
  snapshot();
  const copy = clone(source);
  copy.id = `${source.type}_${Math.random().toString(36).slice(2, 9)}`;
  copy.x += 28;
  copy.y += 28;
  copy.z = Math.max(...state.elements.map((el) => el.z || 10)) + 1;
  state.elements = [...state.elements, copy];
  state.selectedId = copy.id;
  emit();
}

export function moveLayer(id = state.selectedId, direction = 'forward') {
  const element = state.elements.find((el) => el.id === id);
  if (!element) return;
  snapshot();
  const zValues = state.elements.map((el) => el.z || 10);
  if (direction === 'forward') element.z = Math.max(...zValues) + 1;
  if (direction === 'backward') element.z = Math.min(...zValues) - 1;
  state.elements = state.elements.map((el) => el.id === id ? { ...element } : el);
  emit();
}

export function applyTemplate(templateId) {
  const template = templates.find((item) => item.id === templateId);
  if (!template) return;
  snapshot();
  state.activeTemplate = template.id;
  state.canvasSize = template.size;
  state.backgroundStyle = template.backgroundStyle;
  state.theme = clone(template.theme);
  state.elements = template.build();
  state.selectedId = null;
  state.zoom = autoZoomForSize(template.size);
  emit();
}

export function applyTheme(themeIdOrTheme) {
  snapshot();
  const theme = typeof themeIdOrTheme === 'string'
    ? themePresets.find((preset) => preset.id === themeIdOrTheme)
    : themeIdOrTheme;
  if (!theme) return;
  state.theme = clone(theme);
  if (theme.backgroundStyle) state.backgroundStyle = theme.backgroundStyle;
  emit();
}

export function setCanvasSize(sizeKey) {
  if (!canvasSizes[sizeKey]) return;
  snapshot();
  state.canvasSize = sizeKey;
  state.zoom = autoZoomForSize(sizeKey);
  emit();
}

export function polishLayout() {
  snapshot();
  const size = getCanvasSize();
  const margin = size.w >= 1000 ? 88 : 72;
  const grid = 8;
  const selected = state.elements.find((el) => el.id === state.selectedId);
  let statIndex = 0;

  state.elements = state.elements.map((source, index) => {
    const el = { ...source };
    const fullWidthTypes = ['heading', 'paragraph', 'list', 'card', 'timeline', 'contact'];
    el.x = Math.round(el.x / grid) * grid;
    el.y = Math.round(el.y / grid) * grid;
    el.w = Math.round(el.w / grid) * grid;
    el.h = Math.round(el.h / grid) * grid;
    el.opacity = clamp(el.opacity ?? 100, 0, 100);
    el.z = Number.isFinite(Number(el.z)) ? Number(el.z) : 20 + index;

    if (fullWidthTypes.includes(el.type) && el.w > size.w - margin * 2) {
      el.x = margin;
      el.w = size.w - margin * 2;
    }
    if (el.type === 'logoStrip') {
      el.x = margin;
      el.y = Math.max(40, Math.min(el.y, size.h > 1500 ? 96 : 88));
      el.w = Math.min(Math.max(el.w, Math.min(520, size.w - margin * 2)), size.w - margin * 2);
      el.h = clamp(el.h, size.h > 1500 ? 96 : 78, size.h > 1500 ? 126 : 98);
      el.variant = 'minimal';
    }
    if (el.type === 'contact') {
      el.x = margin;
      el.y = Math.min(Math.max(el.y, 48), size.h - el.h - 46);
      el.w = Math.min(el.w, size.w - margin * 2);
      el.h = clamp(el.h, size.h > 1500 ? 96 : 72, size.h > 1500 ? 128 : 92);
    }
    if (el.type === 'heading') {
      el.fontSize = clamp(el.fontSize || 62, size.w >= 1000 ? 42 : 38, size.h >= 1500 ? 112 : 84);
      el.h = Math.max(el.h, Math.round(el.fontSize * 2.05));
    }
    if (el.type === 'paragraph') {
      el.fontSize = clamp(el.fontSize || 22, 18, size.h >= 1500 ? 38 : 30);
      el.h = Math.max(el.h, Math.round(el.fontSize * 3.2));
    }
    if (['list', 'timeline', 'card', 'iconCard'].includes(el.type)) {
      el.fontSize = clamp(el.fontSize || 22, 16, size.h >= 1500 ? 38 : 30);
      el.h = Math.max(el.h, Math.round(el.fontSize * (el.type === 'timeline' ? 10 : 7.2)));
    }
    if (el.type === 'stat') {
      el.fontSize = clamp(el.fontSize || 22, 18, size.h >= 1500 ? 34 : 28);
      el.variant = statIndex % 2 === 1 && (el.variant === 'glass' || !el.variant) ? 'accent' : el.variant;
      statIndex += 1;
    }
    if (el.type === 'shape') {
      el.z = Math.min(el.z, 8);
      el.opacity = Math.min(el.opacity ?? 25, 28);
    }
    if (el.type === 'divider') {
      el.h = clamp(el.h, 6, 14);
      el.variant = 'accent';
    }
    el.x = clamp(el.x, -el.w + 30, size.w - 30);
    el.y = clamp(el.y, -el.h + 30, size.h - 30);
    return el;
  }).sort((a, b) => (a.z || 0) - (b.z || 0))
    .map((el, index) => ({ ...el, z: el.type === 'shape' ? 8 + index : 20 + index }));

  if (selected) state.selectedId = selected.id;
  emit();
}

export function undo() {
  const previous = history.pop();
  if (!previous) return false;
  future.push(clone(state));
  state = previous;
  emit();
  return true;
}

export function redo() {
  const next = future.pop();
  if (!next) return false;
  history.push(clone(state));
  state = next;
  emit();
  return true;
}

export function loadProject(nextState) {
  if (!nextState || !Array.isArray(nextState.elements)) return false;
  snapshot();
  state = { ...clone(defaultState), ...clone(nextState) };
  emit();
  return true;
}

export function resetProject() {
  snapshot();
  state = clone(defaultState);
  emit();
}

function autoZoomForSize(sizeKey) {
  if (sizeKey === 'story') return 31;
  if (sizeKey === 'wide') return 55;
  if (sizeKey === 'square') return 46;
  return 42;
}
