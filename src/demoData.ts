import { Slide, OverlayItem } from './types';

const makeObject = (partial: Partial<OverlayItem> & Pick<OverlayItem, 'id' | 'kind'>): OverlayItem => ({
  x: 300,
  y: 180,
  width: 360,
  height: 120,
  text: 'Editable content',
  color: '#1a56db',
  zIndex: 1,
  ...partial,
});

export const initialSlides: Slide[] = [
  {
    id: 'slide-1',
    title: 'Campaign Narrative',
    accent: '#d63b2f',
    objects: [
      makeObject({
        id: 'o-1',
        kind: 'text',
        x: 260,
        y: 160,
        width: 600,
        height: 140,
        text: 'Build a sharper first-screen narrative with fewer, stronger layout moves.',
        color: '#281e17',
        zIndex: 1,
      }),
      makeObject({
        id: 'o-2',
        kind: 'callout',
        x: 940,
        y: 260,
        width: 300,
        height: 120,
        text: 'Editorial rhythm matters more than adding more surface area.',
        color: '#d63b2f',
        zIndex: 2,
      }),
      makeObject({
        id: 'o-3',
        kind: 'sticky',
        x: 680,
        y: 520,
        width: 220,
        height: 170,
        text: 'Keep the canvas\ncalm and legible',
        color: '#f2b84b',
        zIndex: 3,
      }),
    ],
  },
  {
    id: 'slide-2',
    title: 'Layout System',
    accent: '#111111',
    objects: [
      makeObject({
        id: 'o-4',
        kind: 'text',
        x: 340,
        y: 200,
        width: 460,
        height: 110,
        text: 'Use scale, spacing, and alignment before introducing more controls.',
        color: '#111111',
        zIndex: 1,
      }),
      makeObject({
        id: 'o-5',
        kind: 'callout',
        x: 980,
        y: 420,
        width: 290,
        height: 120,
        text: 'The assistant can suggest structure, but the system should still feel intentional.',
        color: '#111111',
        zIndex: 2,
      }),
    ],
  },
  {
    id: 'slide-3',
    title: 'Review & Redaction',
    accent: '#d63b2f',
    objects: [
      makeObject({
        id: 'o-6',
        kind: 'text',
        x: 270,
        y: 170,
        width: 540,
        height: 130,
        text: 'Mask sensitive details without breaking the overall document composition.',
        color: '#5c2017',
        zIndex: 1,
      }),
      makeObject({
        id: 'o-7',
        kind: 'sticky',
        x: 860,
        y: 560,
        width: 240,
        height: 170,
        text: 'The redaction lab\nshould feel neutral,\nnot themed.',
        color: '#d63b2f',
        zIndex: 2,
      }),
    ],
  },
];

export const demoImageSvg = encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="960" height="560" viewBox="0 0 960 560">
    <defs>
      <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0%" stop-color="#faf7f1" />
        <stop offset="100%" stop-color="#f2eadf" />
      </linearGradient>
      <linearGradient id="accent" x1="0" x2="1" y1="0" y2="0">
        <stop offset="0%" stop-color="#d63b2f" />
        <stop offset="100%" stop-color="#ee7a43" />
      </linearGradient>
    </defs>
    <rect width="960" height="560" fill="url(#bg)" rx="36" />
    <rect x="68" y="70" width="824" height="420" rx="28" fill="#fffdf8" stroke="#d6cec3" />
    <rect x="108" y="112" width="188" height="18" rx="9" fill="#d63b2f" opacity="0.92" />
    <rect x="108" y="150" width="232" height="56" rx="8" fill="#171717" />
    <rect x="366" y="150" width="130" height="22" rx="11" fill="#efe7dc" />
    <rect x="516" y="150" width="130" height="22" rx="11" fill="#efe7dc" />
    <rect x="666" y="150" width="130" height="22" rx="11" fill="#efe7dc" />
    <rect x="108" y="244" width="688" height="2" fill="#d8d1c8" />
    <rect x="108" y="270" width="194" height="112" rx="18" fill="#f7efe5" stroke="#ddd3c6" />
    <rect x="330" y="270" width="248" height="18" rx="9" fill="#171717" opacity="0.92" />
    <rect x="330" y="308" width="284" height="12" rx="6" fill="#8f8a83" opacity="0.75" />
    <rect x="330" y="336" width="252" height="12" rx="6" fill="#8f8a83" opacity="0.58" />
    <rect x="330" y="364" width="294" height="12" rx="6" fill="#8f8a83" opacity="0.46" />
    <rect x="634" y="270" width="162" height="112" rx="18" fill="#f7efe5" stroke="#ddd3c6" />
    <rect x="658" y="296" width="114" height="14" rx="7" fill="#171717" opacity="0.85" />
    <rect x="658" y="328" width="98" height="10" rx="5" fill="#8f8a83" opacity="0.62" />
    <rect x="658" y="352" width="88" height="10" rx="5" fill="#8f8a83" opacity="0.48" />
    <rect x="108" y="414" width="234" height="38" rx="19" fill="url(#accent)" />
    <rect x="356" y="414" width="176" height="38" rx="19" fill="#171717" />
    <rect x="548" y="414" width="124" height="38" rx="19" fill="#efe7dc" stroke="#d6cec3" />
    <text x="110" y="125" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#fffdf8">EDITORIAL BRIEF</text>
    <text x="108" y="186" font-family="Arial, sans-serif" font-size="28" font-weight="700" fill="#fffdf8">Spring Campaign Layout Review</text>
    <text x="385" y="166" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#5c554e">Narrative</text>
    <text x="543" y="166" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#5c554e">Assets</text>
    <text x="707" y="166" font-family="Arial, sans-serif" font-size="12" font-weight="700" fill="#5c554e">Status</text>
    <text x="132" y="314" font-family="Arial, sans-serif" font-size="16" font-weight="700" fill="#171717">Primary image block</text>
    <text x="132" y="340" font-family="Arial, sans-serif" font-size="13" fill="#6e675f">Calm tonal space for</text>
    <text x="132" y="358" font-family="Arial, sans-serif" font-size="13" fill="#6e675f">headline and CTA lockup.</text>
    <text x="682" y="432" font-family="Arial, sans-serif" font-size="13" font-weight="700" fill="#5c554e">Notes</text>
    <text x="144" y="438" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fffdf8">Approve cover direction</text>
    <text x="393" y="438" font-family="Arial, sans-serif" font-size="15" font-weight="700" fill="#fffdf8">Refine hierarchy</text>
  </svg>
`);

export const demoImageSrc = `data:image/svg+xml;charset=utf-8,${demoImageSvg}`;
