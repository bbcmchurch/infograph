import { getCanvasSize, getState } from './store.js';
import { showToast } from './toast.js';

export async function exportPng() {
  const state = getState();
  const canvasNode = document.getElementById('infographicCanvas');
  const size = getCanvasSize();
  try {
    ensureExportLibraries('png');
    showToast('Rendering PNG');
    const bitmap = await renderCanvas(canvasNode, state.exportScale);
    const blob = await canvasToBlob(bitmap, 'image/png');
    downloadBlob(blob, `infographic-${size.w}x${size.h}.png`);
    showToast('PNG exported');
  } catch (error) {
    console.error(error);
    showToast('Export failed');
  }
}

export async function exportPdf() {
  const state = getState();
  const canvasNode = document.getElementById('infographicCanvas');
  const size = getCanvasSize();
  try {
    ensureExportLibraries('pdf');
    showToast('Rendering PDF');
    const bitmap = await renderCanvas(canvasNode, state.exportScale);
    const image = bitmap.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: size.w >= size.h ? 'landscape' : 'portrait',
      unit: 'px',
      format: [size.w, size.h],
      compress: true,
      hotfixes: ['px_scaling']
    });
    pdf.addImage(image, 'PNG', 0, 0, size.w, size.h, undefined, 'FAST');
    pdf.save(`infographic-${size.w}x${size.h}.pdf`);
    showToast('PDF exported');
  } catch (error) {
    console.error(error);
    showToast('Export failed');
  }
}

async function renderCanvas(node, scale) {
  node.classList.add('exporting');
  const previous = {
    transform: node.style.transform,
    transformOrigin: node.style.transformOrigin,
    left: node.style.left,
    top: node.style.top
  };

  try {
    node.style.transform = 'none';
    node.style.transformOrigin = 'top left';
    node.style.left = '0';
    node.style.top = '0';
    await document.fonts?.ready;
    return await window.html2canvas(node, {
      scale,
      backgroundColor: null,
      useCORS: true,
      allowTaint: true,
      logging: false,
      removeContainer: true,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        clonedDoc.getElementById('infographicCanvas')?.classList.add('exporting');
      }
    });
  } finally {
    node.style.transform = previous.transform;
    node.style.transformOrigin = previous.transformOrigin;
    node.style.left = previous.left;
    node.style.top = previous.top;
    node.classList.remove('exporting');
  }
}

function ensureExportLibraries(kind) {
  if (!window.html2canvas) throw new Error('html2canvas is not loaded. Run with internet access or bundle the library locally.');
  if (kind === 'pdf' && !window.jspdf?.jsPDF) throw new Error('jsPDF is not loaded. Run with internet access or bundle the library locally.');
}

function canvasToBlob(canvas, type) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create export blob')), type, 0.96);
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
