import { uid } from '../js/utils.js';

export const canvasSizes = {
  portrait: { label: '4:5', w: 900, h: 1125 },
  story: { label: 'Story', w: 1080, h: 1920 },
  square: { label: 'Square', w: 900, h: 900 },
  wide: { label: 'Wide', w: 1125, h: 633 }
};

export const themePresets = [
  { id: 'baguio', name: 'Baguio Teal', primary: '#256f60', accent: '#f4b942', bg: '#f7f6f0', text: '#17212b' },
  { id: 'navy', name: 'Executive Navy', primary: '#173b57', accent: '#65c8ff', bg: '#f2f8fb', text: '#13212c' },
  { id: 'indigo', name: 'Indigo Coral', primary: '#3f4aa8', accent: '#ff7a66', bg: '#f5f4ff', text: '#171a2d' },
  { id: 'forest', name: 'Forest Lime', primary: '#1f6f4a', accent: '#b7e36d', bg: '#f2f8f2', text: '#14241e' },
  { id: 'cobalt', name: 'Cobalt Amber', primary: '#2156d9', accent: '#ffb020', bg: '#f4f7ff', text: '#111827' },
  { id: 'ruby', name: 'Ruby Sand', primary: '#a8324a', accent: '#f2c16b', bg: '#fff7ef', text: '#251316' },
  { id: 'plum', name: 'Plum Rose', primary: '#6d3d74', accent: '#f47aa5', bg: '#fbf3f8', text: '#251627' },
  { id: 'dark', name: 'Dark Mint', primary: '#2dd4bf', accent: '#fbbf24', bg: '#0f172a', text: '#f8fafc', backgroundStyle: 'dark' }
];

export const iconSuggestions = [
  'eco', 'recycling', 'factory', 'water_drop', 'shield', 'verified', 'groups', 'location_on',
  'analytics', 'public', 'lightbulb', 'check_circle', 'handshake', 'workspace_premium', 'forest', 'bolt',
  'monitoring', 'timeline', 'policy', 'qr_code_2', 'mail', 'phone_in_talk', 'map', 'flag'
];

export const blockTypes = [
  { type: 'heading', label: 'Title', icon: 'title' },
  { type: 'paragraph', label: 'Text', icon: 'notes' },
  { type: 'list', label: 'List', icon: 'format_list_bulleted' },
  { type: 'stat', label: 'Stat', icon: 'monitoring' },
  { type: 'iconCard', label: 'Icon', icon: 'emoji_objects' },
  { type: 'card', label: 'Card', icon: 'dashboard_customize' },
  { type: 'timeline', label: 'Steps', icon: 'timeline' },
  { type: 'logoStrip', label: 'Logos', icon: 'corporate_fare' },
  { type: 'contact', label: 'Contact', icon: 'contact_mail' },
  { type: 'photo', label: 'Photo', icon: 'image' },
  { type: 'divider', label: 'Line', icon: 'horizontal_rule' },
  { type: 'shape', label: 'Shape', icon: 'interests' }
];

function base(type, x, y, w, h, extra = {}) {
  return {
    id: uid(type),
    type,
    x,
    y,
    w,
    h,
    z: 10,
    opacity: 100,
    fontSize: 24,
    align: 'left',
    variant: 'glass',
    ...extra
  };
}

export function createBlock(type, canvas = canvasSizes.portrait) {
  const cx = Math.round((canvas.w - 540) / 2);
  const cy = Math.round(canvas.h * .42);
  const common = { z: 60 };
  const map = {
    heading: () => base('heading', 72, cy, Math.min(720, canvas.w - 144), 150, { text: 'Your infographic title', fontSize: 62, ...common }),
    kicker: () => base('kicker', 72, 72, 260, 48, { text: 'Briefing', fontSize: 15, ...common }),
    paragraph: () => base('paragraph', 72, cy, Math.min(650, canvas.w - 144), 120, { text: 'Add one clear paragraph that explains the main point without crowding the design.', fontSize: 26, ...common }),
    list: () => base('list', 72, cy, Math.min(640, canvas.w - 144), 260, { title: 'Key points', items: ['Clear first point', 'Useful second point', 'Action-focused third point'], fontSize: 24, ...common }),
    stat: () => base('stat', 72, cy, 300, 210, { value: '87%', label: 'Completion rate', note: 'Use concise context only.', fontSize: 24, ...common }),
    iconCard: () => base('iconCard', 72, cy, 330, 280, { icon: 'verified', title: 'Verified result', body: 'Short supporting detail.', fontSize: 22, ...common }),
    card: () => base('card', 72, cy, Math.min(680, canvas.w - 144), 190, { icon: 'eco', title: 'Premium information card', body: 'Use this for a clean insight, requirement, process note, or recommendation.', fontSize: 22, ...common }),
    timeline: () => base('timeline', 72, cy, Math.min(700, canvas.w - 144), 300, { items: ['Plan|Define the goal and audience', 'Build|Add only the strongest information', 'Export|Share as PNG or PDF'], fontSize: 22, ...common }),
    logoStrip: () => base('logoStrip', 72, 56, Math.min(600, canvas.w - 144), 88, { logos: [], slots: 3, ...common }),
    contact: () => base('contact', 72, canvas.h - 150, Math.min(720, canvas.w - 144), 84, { email: 'email@example.com', phone: '+63 000 000 0000', location: 'Baguio City', action: 'Contact', fontSize: 17, ...common }),
    photo: () => base('photo', 72, cy, 360, 260, { src: '', fontSize: 20, ...common }),
    divider: () => base('divider', 72, cy, Math.min(720, canvas.w - 144), 10, { ...common }),
    shape: () => base('shape', canvas.w - 260, 140, 180, 180, { opacity: 25, variant: 'accent', ...common })
  };
  return (map[type] || map.card)();
}

export const templates = [
  {
    id: 'civic-impact',
    name: 'Civic Impact',
    size: 'portrait',
    backgroundStyle: 'aurora',
    theme: themePresets[0],
    build: () => [
      base('logoStrip', 74, 58, 530, 88, { logos: [], slots: 3, z: 35 }),
      base('kicker', 74, 188, 270, 46, { text: 'Public service brief', fontSize: 15, z: 38 }),
      base('heading', 74, 248, 740, 170, { text: 'Clean City\nAction Plan', fontSize: 74, z: 40 }),
      base('paragraph', 78, 432, 650, 112, { text: 'A concise, high-trust infographic for programs, inspections, compliance updates, and public-facing reports.', fontSize: 25, z: 41 }),
      base('stat', 74, 590, 230, 210, { value: '24', label: 'priority sites', note: 'for monitoring', fontSize: 22, z: 42 }),
      base('stat', 334, 590, 230, 210, { value: '3', label: 'focus areas', note: 'collection, safety, reporting', fontSize: 22, variant: 'accent', z: 43 }),
      base('iconCard', 594, 590, 232, 210, { icon: 'verified', title: 'Verified', body: 'Clear next steps.', fontSize: 19, z: 44 }),
      base('list', 74, 840, 752, 178, { title: 'Immediate priorities', items: ['Assign accountable offices', 'Publish collection schedule', 'Track status weekly'], fontSize: 22, z: 45 }),
      base('contact', 74, 1040, 752, 74, { email: 'office@example.gov', phone: '+63 000 000 0000', location: 'City Office', action: 'Contact', fontSize: 16, z: 46 })
    ]
  },
  {
    id: 'executive-snapshot',
    name: 'Executive Snapshot',
    size: 'square',
    backgroundStyle: 'paper',
    theme: themePresets[1],
    build: () => [
      base('kicker', 60, 58, 230, 44, { text: 'Quarterly update', fontSize: 14, z: 35 }),
      base('heading', 60, 120, 640, 130, { text: 'Performance\nSnapshot', fontSize: 64, z: 36 }),
      base('paragraph', 60, 255, 560, 90, { text: 'Summarize your strongest finding with a clean hierarchy and minimal distractions.', fontSize: 22, z: 37 }),
      base('stat', 60, 384, 245, 205, { value: '91%', label: 'on-time actions', note: 'current cycle', fontSize: 22, z: 38 }),
      base('stat', 330, 384, 245, 205, { value: '18', label: 'open items', note: 'requiring follow-up', fontSize: 22, z: 39 }),
      base('stat', 600, 384, 240, 205, { value: '4.8x', label: 'faster review', note: 'after cleanup', fontSize: 22, z: 40 }),
      base('list', 60, 630, 780, 205, { title: 'Next actions', items: ['Close high-priority items', 'Prepare final report', 'Share recommendations'], fontSize: 22, z: 41 })
    ]
  },
  {
    id: 'process-master',
    name: 'Process Master',
    size: 'portrait',
    backgroundStyle: 'grid',
    theme: themePresets[3],
    build: () => [
      base('logoStrip', 74, 54, 448, 82, { logos: [], slots: 3, z: 30 }),
      base('kicker', 74, 176, 180, 44, { text: 'Workflow', fontSize: 14, z: 35 }),
      base('heading', 74, 232, 720, 150, { text: 'Simple Process\nfor Better Results', fontSize: 68, z: 36 }),
      base('timeline', 74, 430, 752, 380, { items: ['Collect|Gather only verified inputs', 'Organize|Group information into clean sections', 'Review|Remove clutter and weak details', 'Publish|Export a polished infographic'], fontSize: 22, z: 38 }),
      base('card', 74, 848, 752, 155, { icon: 'auto_fix_high', title: 'One-tap polish', body: 'Use consistent spacing, clean hierarchy, and premium cards before exporting.', fontSize: 22, z: 40 }),
      base('contact', 74, 1034, 752, 78, { email: 'team@example.com', phone: '+63 000 000 0000', location: 'Office', action: 'Details', fontSize: 16, z: 41 })
    ]
  },
  {
    id: 'premium-announcement',
    name: 'Premium Notice',
    size: 'story',
    backgroundStyle: 'diagonal',
    theme: themePresets[2],
    build: () => [
      base('logoStrip', 88, 80, 620, 112, { logos: [], slots: 3, z: 30 }),
      base('kicker', 88, 258, 280, 54, { text: 'Official update', fontSize: 16, z: 34 }),
      base('heading', 88, 340, 900, 270, { text: 'Important\nAnnouncement', fontSize: 92, z: 35 }),
      base('paragraph', 94, 640, 830, 150, { text: 'Create a polished mobile-first announcement with strong spacing and premium color hierarchy.', fontSize: 34, z: 36 }),
      base('card', 88, 860, 904, 230, { icon: 'event_available', title: 'What people need to know', body: 'Add the main detail, location, date, or action required.', fontSize: 30, z: 38 }),
      base('list', 88, 1150, 904, 330, { title: 'Checklist', items: ['Main action', 'Deadline or schedule', 'Contact channel'], fontSize: 30, z: 39 }),
      base('contact', 88, 1682, 904, 112, { email: 'contact@example.com', phone: '+63 000 000 0000', location: 'Baguio City', action: 'Inquire', fontSize: 22, z: 40 })
    ]
  },
  {
    id: 'modern-report',
    name: 'Modern Report',
    size: 'wide',
    backgroundStyle: 'dark',
    theme: themePresets[7],
    build: () => [
      base('kicker', 56, 52, 210, 42, { text: 'Strategic brief', fontSize: 13, z: 30 }),
      base('heading', 56, 112, 480, 136, { text: 'High-Impact\nReport', fontSize: 58, z: 31 }),
      base('paragraph', 58, 270, 440, 84, { text: 'A cinematic wide infographic for presentations, briefings, and screens.', fontSize: 20, z: 32 }),
      base('stat', 580, 70, 230, 180, { value: '96%', label: 'clarity score', note: 'after layout polish', fontSize: 20, z: 34 }),
      base('stat', 835, 70, 230, 180, { value: '5', label: 'key insights', note: 'single-screen brief', fontSize: 20, z: 35 }),
      base('iconCard', 580, 288, 230, 250, { icon: 'workspace_premium', title: 'Premium', body: 'Balanced spacing and color.', fontSize: 19, z: 36 }),
      base('iconCard', 835, 288, 230, 250, { icon: 'bolt', title: 'Fast', body: 'Built for quick decisions.', fontSize: 19, z: 37 }),
      base('contact', 56, 520, 460, 70, { email: 'team@example.com', phone: '+63 000 000 0000', location: 'Office', action: 'Contact', fontSize: 14, z: 38 })
    ]
  }
];

export const defaultState = {
  activeTemplate: 'civic-impact',
  canvasSize: 'portrait',
  backgroundStyle: 'aurora',
  exportScale: 3,
  zoom: 42,
  snapToGrid: true,
  selectedId: null,
  theme: themePresets[0],
  elements: templates[0].build()
};
