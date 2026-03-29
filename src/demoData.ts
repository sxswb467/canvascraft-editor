import { Slide, OverlayItem } from './types';

const makeObject = (partial: Partial<OverlayItem> & Pick<OverlayItem, 'id' | 'kind'>): OverlayItem => ({
  x: 300,
  y: 180,
  width: 360,
  height: 120,
  text: 'Editable content',
  color: '#1a56db',
  ...partial,
});

export const initialSlides: Slide[] = [
  {
    id: 'slide-1',
    title: 'Behavioral Health Overview',
    accent: '#0f766e',
    objects: [
      makeObject({
        id: 'o-1',
        kind: 'text',
        x: 260,
        y: 160,
        width: 600,
        height: 140,
        text: 'Behavioral health teams need faster, clearer workflows.',
        color: '#083344',
      }),
      makeObject({
        id: 'o-2',
        kind: 'callout',
        x: 940,
        y: 260,
        width: 300,
        height: 120,
        text: 'AI-assisted note prep reduces repetitive admin time.',
        color: '#0f766e',
      }),
      makeObject({
        id: 'o-3',
        kind: 'sticky',
        x: 680,
        y: 520,
        width: 220,
        height: 170,
        text: 'Inline editing\nDrag me around',
        color: '#f59e0b',
      }),
    ],
  },
  {
    id: 'slide-2',
    title: 'Clinical Documentation Flow',
    accent: '#7c3aed',
    objects: [
      makeObject({
        id: 'o-4',
        kind: 'text',
        x: 340,
        y: 200,
        width: 460,
        height: 110,
        text: 'Capture session details, surface next actions, and sync handoff notes.',
        color: '#312e81',
      }),
      makeObject({
        id: 'o-5',
        kind: 'callout',
        x: 980,
        y: 420,
        width: 290,
        height: 120,
        text: 'AI panel can suggest cleaner layouts and supporting callouts.',
        color: '#7c3aed',
      }),
    ],
  },
  {
    id: 'slide-3',
    title: 'Compliance & Redaction',
    accent: '#dc2626',
    objects: [
      makeObject({
        id: 'o-6',
        kind: 'text',
        x: 270,
        y: 170,
        width: 540,
        height: 130,
        text: 'Canvas pixel manipulation supports blackout and pixelation redaction.',
        color: '#7f1d1d',
      }),
      makeObject({
        id: 'o-7',
        kind: 'sticky',
        x: 860,
        y: 560,
        width: 240,
        height: 170,
        text: 'Try the redaction lab\nbelow the canvas toolbar.',
        color: '#ef4444',
      }),
    ],
  },
];

export const demoImageSvg = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#f0f9ff" />
        <stop offset="100%" stop-color="#dbeafe" />
      </linearGradient>
    </defs>
    <rect width="960" height="560" fill="url(#bg)" rx="36" />
    <circle cx="144" cy="148" r="72" fill="#bfdbfe" />
    <circle cx="144" cy="132" r="42" fill="#93c5fd" />
    <rect x="88" y="220" width="112" height="150" rx="32" fill="#93c5fd" />
    <rect x="262" y="104" width="428" height="56" rx="16" fill="#0f172a" opacity="0.93" />
    <rect x="262" y="184" width="354" height="26" rx="12" fill="#1d4ed8" opacity="0.75" />
    <rect x="262" y="232" width="408" height="18" rx="9" fill="#334155" opacity="0.55" />
    <rect x="262" y="266" width="392" height="18" rx="9" fill="#334155" opacity="0.45" />
    <rect x="262" y="300" width="440" height="18" rx="9" fill="#334155" opacity="0.45" />
    <rect x="262" y="346" width="212" height="72" rx="18" fill="#0ea5e9" opacity="0.95" />
    <rect x="492" y="346" width="212" height="72" rx="18" fill="#7c3aed" opacity="0.92" />
    <rect x="722" y="104" width="156" height="304" rx="28" fill="#ffffff" opacity="0.92" />
    <rect x="748" y="136" width="104" height="20" rx="10" fill="#1e3a8a" opacity="0.9" />
    <rect x="748" y="180" width="90" height="14" rx="7" fill="#64748b" opacity="0.52" />
    <rect x="748" y="210" width="84" height="14" rx="7" fill="#64748b" opacity="0.42" />
    <rect x="748" y="240" width="96" height="14" rx="7" fill="#64748b" opacity="0.42" />
    <rect x="748" y="294" width="108" height="82" rx="16" fill="#fee2e2" />
    <text x="262" y="138" font-family="Arial, sans-serif" font-size="30" font-weight="700" fill="#ffffff">Client Intake Summary</text>
    <text x="272" y="205" font-family="Arial, sans-serif" font-size="18" font-weight="700" fill="#ffffff">Patient: Alex Morgan</text>
    <text x="274" y="391" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="#ffffff">Next Session</text>
    <text x="506" y="391" font-family="Arial, sans-serif" font-size="21" font-weight="700" fill="#ffffff">Risk Flags</text>
  </svg>
`);

export const demoImageSrc = `data:image/svg+xml;charset=utf-8,${demoImageSvg}`;
