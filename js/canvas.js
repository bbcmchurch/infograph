import { captureHistory, subscribe, getState, getCanvasSize, setSelected, updateElement, updateState, duplicateElement, deleteElement, moveLayer } from './store.js';

let canvasEl;
let holderEl;
let viewportEl;
let activeDrag = null;
let currentState = null;
let selectionToolbar;
let dragGuideX;
let dragGuideY;

export function initCanvas() {
  canvasEl = document.getElementById('infographicCanvas');
  holderEl = document.getElementById('canvasHolder');
  viewportEl = document.getElementById('canvasViewport');
  selectionToolbar = document.getElementById('selectionToolbar');
  dragGuideX = document.getElementById('dragGuideX');
  dragGuideY = document.getElementById('dragGuideY');

  subscribe((state) => {
    currentState = state;
    renderCanvas(state);
  });

  canvasEl.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);
  window.addEventListener('pointercancel', onPointerUp);
  window.addEventListener('resize', () => requestAnimationFrame(updateSelectionToolbar));
  viewportEl.addEventListener('scroll', () => requestAnimationFrame(updateSelectionToolbar), { passive: true });
  selectionToolbar?.addEventListener('click', onSelectionToolbarClick);

  viewportEl.addEventListener('pointerdown', (event) => {
    if (event.target === viewportEl || event.target === holderEl || event.target === canvasEl) {
      setSelected(null);
    }
  });

  const fitAfterLayout = () => {
    const zoom = fitCanvasToViewport();
    if (Number.isFinite(zoom)) updateState({ zoom }, false);
  };
  requestAnimationFrame(fitAfterLayout);
  window.addEventListener('resize', () => requestAnimationFrame(fitAfterLayout));
}

export function fitCanvasToViewport() {
  const size = getCanvasSize();
  const viewport = document.getElementById('canvasViewport');
  const padding = 42;
  const scaleX = (viewport.clientWidth - padding) / size.w;
  const scaleY = (viewport.clientHeight - padding) / size.h;
  const zoom = Math.max(22, Math.min(88, Math.floor(Math.min(scaleX, scaleY) * 100)));
  return zoom;
}

function renderCanvas(state) {
  const size = getCanvasSize();
  const scale = state.zoom / 100;
  document.documentElement.style.setProperty('--primary', state.theme.primary);
  document.documentElement.style.setProperty('--accent', state.theme.accent);
  holderEl.style.setProperty('--canvas-w', `${size.w}px`);
  holderEl.style.setProperty('--canvas-h', `${size.h}px`);
  holderEl.style.setProperty('--canvas-scale', scale);
  canvasEl.style.setProperty('--canvas-w', `${size.w}px`);
  canvasEl.style.setProperty('--canvas-h', `${size.h}px`);
  canvasEl.style.setProperty('--canvas-scale', scale);
  canvasEl.style.setProperty('--canvas-primary', state.theme.primary);
  canvasEl.style.setProperty('--canvas-accent', state.theme.accent);
  canvasEl.style.setProperty('--canvas-bg', state.theme.bg);
  canvasEl.style.setProperty('--canvas-text', state.theme.text);
  canvasEl.className = `infographic-canvas bg-${state.backgroundStyle || 'aurora'}`;

  const elements = [...state.elements].sort((a, b) => (a.z || 10) - (b.z || 10));
  canvasEl.innerHTML = '<div class="canvas-watermark-grid"></div><div class="canvas-bleed-glow"></div>';
  const fragment = document.createDocumentFragment();
  elements.forEach((element) => fragment.appendChild(renderElement(element, state.selectedId)));
  canvasEl.appendChild(fragment);
  requestAnimationFrame(updateSelectionToolbar);
}


function renderElement(element, selectedId) {
  const node = document.createElement('section');
  node.className = `info-node ${element.id === selectedId ? 'selected' : ''} align-${element.align || 'left'} variant-${element.variant || 'glass'}`;
  node.dataset.id = element.id;
  node.style.setProperty('--x', `${element.x}px`);
  node.style.setProperty('--y', `${element.y}px`);
  node.style.setProperty('--w', `${element.w}px`);
  node.style.setProperty('--h', `${element.h}px`);
  node.style.setProperty('--z', element.z || 10);
  node.style.setProperty('--opacity', (element.opacity ?? 100) / 100);
  node.style.fontSize = `${element.fontSize || 22}px`;
  node.appendChild(renderContent(element));
  return node;
}

function renderContent(element) {
  const wrap = document.createElement('div');
  wrap.className = 'node-content';

  if (element.type === 'kicker') {
    wrap.innerHTML = `<div class="kicker">${escapeHtml(element.text)}</div>`;
    return wrap;
  }

  if (element.type === 'heading') {
    wrap.innerHTML = `<h2 class="heading">${lineBreaks(element.text)}</h2>`;
    return wrap;
  }

  if (element.type === 'paragraph') {
    wrap.innerHTML = `<p class="paragraph">${lineBreaks(element.text)}</p>`;
    return wrap;
  }

  if (element.type === 'card') {
    wrap.innerHTML = `
      <div class="premium-card">
        <div class="card-icon"><span class="material-symbols-outlined">${escapeHtml(element.icon || 'eco')}</span></div>
        <div class="card-copy"><strong>${escapeHtml(element.title || '')}</strong><p>${escapeHtml(element.body || '')}</p></div>
      </div>`;
    return wrap;
  }

  if (element.type === 'iconCard') {
    wrap.innerHTML = `
      <div class="icon-card">
        <div class="icon-bubble"><span class="material-symbols-outlined">${escapeHtml(element.icon || 'verified')}</span></div>
        <strong>${escapeHtml(element.title || '')}</strong>
        <p>${escapeHtml(element.body || '')}</p>
      </div>`;
    return wrap;
  }

  if (element.type === 'stat') {
    wrap.innerHTML = `
      <div class="stat-card">
        <div class="stat-value">${escapeHtml(element.value || '')}</div>
        <div class="stat-label">${escapeHtml(element.label || '')}</div>
        <div class="stat-note">${escapeHtml(element.note || '')}</div>
      </div>`;
    return wrap;
  }

  if (element.type === 'list') {
    const items = (element.items || []).map((item) => `
      <div class="list-item"><span class="material-symbols-outlined list-dot">check</span><span>${escapeHtml(item)}</span></div>`).join('');
    wrap.innerHTML = `<div class="list-card"><div class="list-title">${escapeHtml(element.title || '')}</div><div class="list-items">${items}</div></div>`;
    return wrap;
  }

  if (element.type === 'timeline') {
    const items = (element.items || []).map((item, index) => {
      const [title, body] = String(item).split('|');
      return `<div class="timeline-item"><div class="timeline-number">${index + 1}</div><div class="timeline-copy"><strong>${escapeHtml(title || '')}</strong><span>${escapeHtml(body || '')}</span></div></div>`;
    }).join('');
    wrap.innerHTML = `<div class="timeline-card"><div class="timeline-items">${items}</div></div>`;
    return wrap;
  }

  if (element.type === 'logoStrip') {
    const slots = Math.max(1, Number(element.slots || 3));
    const logos = element.logos || [];
    const html = Array.from({ length: slots }).map((_, index) => {
      const src = logos[index] || '';
      return `<div class="logo-slot">${src ? `<img src="${src}" alt="Logo ${index + 1}">` : ''}</div>`;
    }).join('');
    wrap.innerHTML = `<div class="logo-strip" style="--logo-count:${slots}">${html}</div>`;
    return wrap;
  }

  if (element.type === 'contact') {
    wrap.innerHTML = `
      <div class="contact-card">
        <div class="contact-lines">
          <div class="contact-line"><span class="material-symbols-outlined">mail</span>${escapeHtml(element.email || '')}</div>
          <div class="contact-line"><span class="material-symbols-outlined">phone_in_talk</span>${escapeHtml(element.phone || '')}</div>
          <div class="contact-line"><span class="material-symbols-outlined">location_on</span>${escapeHtml(element.location || '')}</div>
        </div>
        <div class="contact-badge">${escapeHtml(element.action || 'Contact')}</div>
      </div>`;
    return wrap;
  }

  if (element.type === 'photo') {
    wrap.innerHTML = `<div class="photo-card">${element.src ? `<img src="${element.src}" alt="Uploaded visual">` : '<div class="photo-placeholder"><span class="material-symbols-outlined">add_photo_alternate</span></div>'}</div>`;
    return wrap;
  }

  if (element.type === 'divider') {
    wrap.innerHTML = '<div class="divider-line"></div>';
    return wrap;
  }

  if (element.type === 'shape') {
    wrap.innerHTML = '<div class="accent-shape"></div>';
    return wrap;
  }

  wrap.innerHTML = `<div class="premium-card"><div class="card-copy"><strong>${escapeHtml(element.title || 'Block')}</strong><p>${escapeHtml(element.body || '')}</p></div></div>`;
  return wrap;
}

function onPointerDown(event) {
  const node = event.target.closest('.info-node');
  if (!node) return;
  event.preventDefault();
  const id = node.dataset.id;
  const element = currentState.elements.find((el) => el.id === id);
  if (!element) return;
  setSelected(id);
  window.dispatchEvent(new CustomEvent('infographic:selected', { detail: { id } }));
  node.setPointerCapture?.(event.pointerId);
  activeDrag = {
    id,
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    x: element.x,
    y: element.y,
    moved: false,
    historyCaptured: false
  };
}

function onPointerMove(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  const element = currentState.elements.find((el) => el.id === activeDrag.id);
  if (!element) return;
  const scale = (currentState.zoom || 42) / 100;
  const dx = (event.clientX - activeDrag.startX) / scale;
  const dy = (event.clientY - activeDrag.startY) / scale;
  if (Math.abs(dx) + Math.abs(dy) > 1) {
    activeDrag.moved = true;
    if (!activeDrag.historyCaptured) {
      captureHistory();
      activeDrag.historyCaptured = true;
    }
  }
  const snap = currentState.snapToGrid ? 6 : 1;
  let x = Math.round((activeDrag.x + dx) / snap) * snap;
  let y = Math.round((activeDrag.y + dy) / snap) * snap;
  const magnetic = applyMagneticGuides({ ...element, x, y }, scale);
  x = magnetic.x;
  y = magnetic.y;
  updateElement(activeDrag.id, { x, y }, false);
}

function onPointerUp(event) {
  if (!activeDrag || event.pointerId !== activeDrag.pointerId) return;
  activeDrag = null;
  hideDragGuides();
  requestAnimationFrame(updateSelectionToolbar);
}


function onSelectionToolbarClick(event) {
  const button = event.target.closest('button[data-action]');
  if (!button || !currentState?.selectedId) return;
  event.preventDefault();
  event.stopPropagation();
  const id = currentState.selectedId;
  if (button.dataset.action === 'duplicate') duplicateElement(id);
  if (button.dataset.action === 'delete') deleteElement(id);
  if (button.dataset.action === 'front') moveLayer(id, 'forward');
  if (button.dataset.action === 'back') moveLayer(id, 'backward');
  requestAnimationFrame(updateSelectionToolbar);
}

function updateSelectionToolbar() {
  if (!selectionToolbar || document.body.classList.contains('preview-mode')) return;
  const selectedId = currentState?.selectedId;
  const node = selectedId ? Array.from(canvasEl.querySelectorAll('.info-node')).find((item) => item.dataset.id === selectedId) : null;
  if (!node) {
    selectionToolbar.classList.add('hidden');
    return;
  }
  const rect = node.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    selectionToolbar.classList.add('hidden');
    return;
  }
  selectionToolbar.classList.remove('hidden');
  const toolbarRect = selectionToolbar.getBoundingClientRect();
  const width = toolbarRect.width || 184;
  const viewportPadding = 10;
  const left = clampValue(rect.left + rect.width / 2 - width / 2, viewportPadding, window.innerWidth - width - viewportPadding);
  const above = rect.top - 54;
  const top = above > 72 ? above : rect.bottom + 10;
  selectionToolbar.style.left = `${left}px`;
  selectionToolbar.style.top = `${clampValue(top, 74, window.innerHeight - 64)}px`;
}

function applyMagneticGuides(element, scale) {
  const size = getCanvasSize();
  const threshold = currentState.snapToGrid ? 10 : 0;
  let { x, y } = element;
  let guideX = null;
  let guideY = null;
  if (threshold > 0) {
    const margin = size.w >= 1000 ? 88 : 72;
    const verticalTargets = [margin, size.w / 2, size.w - margin];
    const horizontalTargets = [margin, size.h / 2, size.h - margin];
    for (const target of verticalTargets) {
      const probes = [x, x + element.w / 2, x + element.w];
      const hitIndex = probes.findIndex((probe) => Math.abs(probe - target) <= threshold);
      if (hitIndex !== -1) {
        x += target - probes[hitIndex];
        guideX = target;
        break;
      }
    }
    for (const target of horizontalTargets) {
      const probes = [y, y + element.h / 2, y + element.h];
      const hitIndex = probes.findIndex((probe) => Math.abs(probe - target) <= threshold);
      if (hitIndex !== -1) {
        y += target - probes[hitIndex];
        guideY = target;
        break;
      }
    }
  }
  updateDragGuides(guideX, guideY, scale);
  return { x, y };
}

function updateDragGuides(guideX, guideY, scale) {
  const rect = canvasEl.getBoundingClientRect();
  if (dragGuideX) {
    if (guideX === null) {
      dragGuideX.classList.remove('visible');
    } else {
      dragGuideX.style.left = `${rect.left + guideX * scale}px`;
      dragGuideX.style.top = `${rect.top}px`;
      dragGuideX.style.height = `${rect.height}px`;
      dragGuideX.classList.add('visible');
    }
  }
  if (dragGuideY) {
    if (guideY === null) {
      dragGuideY.classList.remove('visible');
    } else {
      dragGuideY.style.left = `${rect.left}px`;
      dragGuideY.style.top = `${rect.top + guideY * scale}px`;
      dragGuideY.style.width = `${rect.width}px`;
      dragGuideY.classList.add('visible');
    }
  }
}

function hideDragGuides() {
  dragGuideX?.classList.remove('visible');
  dragGuideY?.classList.remove('visible');
}

function clampValue(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function lineBreaks(value) {
  return escapeHtml(value || '').replace(/\n/g, '<br>');
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
