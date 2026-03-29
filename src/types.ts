export type OverlayKind = 'text' | 'callout' | 'sticky';

export type OverlayItem = {
  id: string;
  kind: OverlayKind;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
};

export type Slide = {
  id: string;
  title: string;
  accent: string;
  objects: OverlayItem[];
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

export type ChatThread = Record<string, ChatMessage[]>;
