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
  zIndex: number;
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

export type GuideState = {
  x: number | null;
  y: number | null;
};

export type ViewportState = {
  zoom: number;
  snapToGrid: boolean;
  guides: GuideState;
};

export type EditorSnapshot = {
  slides: Slide[];
  activeSlideId: string;
  selectedObjectId: string | null;
  chatThreads: ChatThread;
};

export type PersistedEditorState = EditorSnapshot & {
  viewport: Pick<ViewportState, 'zoom' | 'snapToGrid'>;
};

export type EditorState = {
  past: EditorSnapshot[];
  present: EditorSnapshot;
  future: EditorSnapshot[];
  viewport: ViewportState;
};
