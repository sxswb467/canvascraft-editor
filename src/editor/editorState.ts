import { arrayMove } from '@dnd-kit/sortable';
import { initialSlides } from '../demoData';
import type {
  ChatMessage,
  ChatThread,
  EditorSnapshot,
  EditorState,
  GuideState,
  OverlayItem,
  OverlayKind,
  PersistedEditorState,
  Slide,
} from '../types';

export const WORKSPACE_WIDTH = 4200;
export const WORKSPACE_HEIGHT = 2600;
export const GRID_SIZE = 24;
export const ZOOM_MIN = 0.45;
export const ZOOM_MAX = 1.6;

const HISTORY_LIMIT = 40;
const ALIGN_THRESHOLD = 14;

export const uid = () => Math.random().toString(36).slice(2, 10);

export const createAssistantGreeting = (): ChatMessage => ({
  id: uid(),
  role: 'assistant',
  text: 'This thread is scoped to the current slide. The assistant runs locally on the slide data, so it can review hierarchy, rewrite copy blocks, and add deterministic layout helpers without a remote model.',
});

const createInitialThreads = (slides: Slide[]): ChatThread =>
  Object.fromEntries(slides.map((slide) => [slide.id, [createAssistantGreeting()]]));

const withDefaultZIndex = (slide: Slide): Slide => ({
  ...slide,
  objects: slide.objects.map((item, index) => ({ ...item, zIndex: item.zIndex ?? index + 1 })),
});

const createInitialSnapshot = (): EditorSnapshot => {
  const slides = initialSlides.map(withDefaultZIndex);
  return {
    slides,
    activeSlideId: slides[0].id,
    selectedObjectId: slides[0].objects[0]?.id ?? null,
    chatThreads: createInitialThreads(slides),
  };
};

export const createInitialEditorState = (persisted?: PersistedEditorState | null): EditorState => {
  const baseSnapshot = createInitialSnapshot();
  const present = persisted
    ? {
        slides: persisted.slides.map(withDefaultZIndex),
        activeSlideId: persisted.activeSlideId,
        selectedObjectId: persisted.selectedObjectId,
        chatThreads: persisted.chatThreads,
      }
    : baseSnapshot;

  return {
    past: [],
    present,
    future: [],
    viewport: {
      zoom: persisted?.viewport.zoom ?? 1,
      snapToGrid: persisted?.viewport.snapToGrid ?? true,
      guides: { x: null, y: null },
    },
  };
};

export const serializeEditorState = (state: EditorState): PersistedEditorState => ({
  ...state.present,
  viewport: {
    zoom: state.viewport.zoom,
    snapToGrid: state.viewport.snapToGrid,
  },
});

export const getActiveSlide = (state: EditorSnapshot): Slide =>
  state.slides.find((slide) => slide.id === state.activeSlideId) ?? state.slides[0];

export const getSelectedObject = (state: EditorSnapshot): OverlayItem | null => {
  const activeSlide = getActiveSlide(state);
  return activeSlide.objects.find((item) => item.id === state.selectedObjectId) ?? null;
};

export const getSlideBounds = (slide: Slide) => {
  if (slide.objects.length === 0) {
    return {
      left: WORKSPACE_WIDTH * 0.25,
      top: WORKSPACE_HEIGHT * 0.2,
      width: WORKSPACE_WIDTH * 0.5,
      height: WORKSPACE_HEIGHT * 0.45,
    };
  }

  const left = Math.min(...slide.objects.map((item) => item.x));
  const top = Math.min(...slide.objects.map((item) => item.y));
  const right = Math.max(...slide.objects.map((item) => item.x + item.width));
  const bottom = Math.max(...slide.objects.map((item) => item.y + item.height));
  const padding = 120;

  return {
    left: Math.max(24, left - padding),
    top: Math.max(24, top - padding),
    width: Math.min(WORKSPACE_WIDTH - 48, right - left + padding * 2),
    height: Math.min(WORKSPACE_HEIGHT - 48, bottom - top + padding * 2),
  };
};

const pushHistory = (state: EditorState, nextPresent: EditorSnapshot): EditorState => ({
  ...state,
  past: [...state.past.slice(-(HISTORY_LIMIT - 1)), state.present],
  present: nextPresent,
  future: [],
});

const updateActiveSlide = (present: EditorSnapshot, updater: (slide: Slide) => Slide): EditorSnapshot => ({
  ...present,
  slides: present.slides.map((slide) => (slide.id === present.activeSlideId ? updater(slide) : slide)),
});

const getMaxZIndex = (slide: Slide) => Math.max(0, ...slide.objects.map((item) => item.zIndex));

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const clampObjectPosition = (item: OverlayItem, x: number, y: number) => ({
  x: clamp(x, 24, WORKSPACE_WIDTH - item.width - 24),
  y: clamp(y, 24, WORKSPACE_HEIGHT - item.height - 24),
});

const clampObjectSize = (item: OverlayItem, width: number, height: number) => ({
  width: clamp(width, 140, WORKSPACE_WIDTH - item.x - 24),
  height: clamp(height, 80, WORKSPACE_HEIGHT - item.y - 24),
});

const snapAxis = (value: number, size: number, targets: number[], fallbackToGrid: boolean) => {
  let nextValue = value;
  let guide: number | null = null;

  for (const target of targets) {
    if (Math.abs(value - target) <= ALIGN_THRESHOLD) {
      nextValue = target;
      guide = target;
      break;
    }
  }

  if (guide === null && fallbackToGrid) {
    nextValue = Math.round(value / GRID_SIZE) * GRID_SIZE;
  }

  return { value: nextValue, guide };
};

const applySnapping = (slide: Slide, objectId: string, x: number, y: number, snapToGrid: boolean): { x: number; y: number; guides: GuideState } => {
  const activeObject = slide.objects.find((item) => item.id === objectId);
  if (!activeObject) return { x, y, guides: { x: null, y: null } };

  const otherObjects = slide.objects.filter((item) => item.id !== objectId);
  const xTargets = [
    WORKSPACE_WIDTH / 2 - activeObject.width / 2,
    ...otherObjects.map((item) => item.x),
  ];
  const yTargets = [
    WORKSPACE_HEIGHT / 2 - activeObject.height / 2,
    ...otherObjects.map((item) => item.y),
  ];

  const snappedX = snapAxis(x, activeObject.width, xTargets, snapToGrid);
  const snappedY = snapAxis(y, activeObject.height, yTargets, snapToGrid);

  return {
    x: snappedX.value,
    y: snappedY.value,
    guides: {
      x: snappedX.guide === null ? null : snappedX.guide + activeObject.width / 2,
      y: snappedY.guide === null ? null : snappedY.guide + activeObject.height / 2,
    },
  };
};

const sortObjects = (objects: OverlayItem[]) => [...objects].sort((left, right) => left.zIndex - right.zIndex);

export type EditorAction =
  | { type: 'select-slide'; slideId: string }
  | { type: 'select-object'; objectId: string | null }
  | { type: 'commit-history'; snapshot: EditorSnapshot }
  | { type: 'add-slide'; slideId?: string }
  | { type: 'delete-slide'; slideId: string }
  | { type: 'reorder-slides'; activeId: string; overId: string }
  | { type: 'add-object'; kind: OverlayKind; x: number; y: number; preset?: Partial<OverlayItem> }
  | { type: 'update-object'; objectId: string; patch: Partial<OverlayItem> }
  | { type: 'move-object'; objectId: string; x: number; y: number }
  | { type: 'resize-object'; objectId: string; width: number; height: number }
  | { type: 'delete-selected-object' }
  | { type: 'duplicate-selected-object' }
  | { type: 'set-chat-thread'; slideId: string; messages: ChatMessage[] }
  | { type: 'tidy-layout' }
  | { type: 'bring-forward' }
  | { type: 'send-backward' }
  | { type: 'set-guides'; guides: GuideState }
  | { type: 'clear-guides' }
  | { type: 'set-zoom'; zoom: number }
  | { type: 'toggle-snap' }
  | { type: 'undo' }
  | { type: 'redo' };

export function editorReducer(state: EditorState, action: EditorAction): EditorState {
  if (action.type === 'undo') {
    if (state.past.length === 0) return state;
    const previous = state.past[state.past.length - 1];
    return {
      ...state,
      past: state.past.slice(0, -1),
      present: previous,
      future: [state.present, ...state.future],
      viewport: { ...state.viewport, guides: { x: null, y: null } },
    };
  }

  if (action.type === 'redo') {
    if (state.future.length === 0) return state;
    const [next, ...rest] = state.future;
    return {
      ...state,
      past: [...state.past, state.present],
      present: next,
      future: rest,
      viewport: { ...state.viewport, guides: { x: null, y: null } },
    };
  }

  if (action.type === 'set-guides') {
    return { ...state, viewport: { ...state.viewport, guides: action.guides } };
  }

  if (action.type === 'clear-guides') {
    return { ...state, viewport: { ...state.viewport, guides: { x: null, y: null } } };
  }

  if (action.type === 'set-zoom') {
    return {
      ...state,
      viewport: { ...state.viewport, zoom: clamp(action.zoom, ZOOM_MIN, ZOOM_MAX) },
    };
  }

  if (action.type === 'toggle-snap') {
    return {
      ...state,
      viewport: {
        ...state.viewport,
        snapToGrid: !state.viewport.snapToGrid,
        guides: { x: null, y: null },
      },
    };
  }

  if (action.type === 'select-slide') {
    const slide = state.present.slides.find((item) => item.id === action.slideId);
    if (!slide) return state;
    return {
      ...state,
      present: {
        ...state.present,
        activeSlideId: action.slideId,
        selectedObjectId: slide.objects[0]?.id ?? null,
      },
    };
  }

  if (action.type === 'select-object') {
    return {
      ...state,
      present: { ...state.present, selectedObjectId: action.objectId },
    };
  }

  if (action.type === 'commit-history') {
    return {
      ...state,
      past: [...state.past.slice(-(HISTORY_LIMIT - 1)), action.snapshot],
      future: [],
      viewport: { ...state.viewport, guides: { x: null, y: null } },
    };
  }

  if (action.type === 'delete-slide') {
    if (state.present.slides.length <= 1) return state; // keep at least one slide
    const remaining = state.present.slides.filter((s) => s.id !== action.slideId);
    const nextActiveId =
      state.present.activeSlideId === action.slideId
        ? (remaining[0]?.id ?? '')
        : state.present.activeSlideId;
    const { [action.slideId]: _removed, ...remainingThreads } = state.present.chatThreads;
    return pushHistory(state, {
      ...state.present,
      slides: remaining,
      activeSlideId: nextActiveId,
      selectedObjectId: null,
      chatThreads: remainingThreads,
    });
  }

  if (action.type === 'reorder-slides') {
    const oldIndex = state.present.slides.findIndex((slide) => slide.id === action.activeId);
    const newIndex = state.present.slides.findIndex((slide) => slide.id === action.overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return state;
    return pushHistory(state, {
      ...state.present,
      slides: arrayMove(state.present.slides, oldIndex, newIndex),
    });
  }

  if (action.type === 'add-slide') {
    const nextIndex = state.present.slides.length + 1;
    const newSlide: Slide = {
      id: action.slideId ?? `slide-${uid()}`,
      title: `Concept ${nextIndex}`,
      accent: ['#0f766e', '#2563eb', '#7c3aed', '#dc2626'][state.present.slides.length % 4],
      objects: [
        {
          id: `obj-${uid()}`,
          kind: 'text',
          x: 340,
          y: 220,
          width: 560,
          height: 130,
          text: 'New slide headline — click to edit',
          color: '#111827',
          zIndex: 1,
        },
      ],
    };

    return pushHistory(state, {
      ...state.present,
      slides: [...state.present.slides, newSlide],
      activeSlideId: newSlide.id,
      selectedObjectId: newSlide.objects[0].id,
      chatThreads: { ...state.present.chatThreads, [newSlide.id]: [createAssistantGreeting()] },
    });
  }

  if (action.type === 'add-object') {
    const slide = getActiveSlide(state.present);
    const nextZIndex = getMaxZIndex(slide) + 1;
    const presets: Record<OverlayKind, OverlayItem> = {
      text: {
        id: `obj-${uid()}`,
        kind: 'text',
        x: action.x,
        y: action.y,
        width: 500,
        height: 120,
        text: 'New text block — edit inline',
        color: '#0f172a',
        zIndex: nextZIndex,
      },
      callout: {
        id: `obj-${uid()}`,
        kind: 'callout',
        x: action.x,
        y: action.y,
        width: 320,
        height: 130,
        text: 'Key callout',
        color: slide.accent,
        zIndex: nextZIndex,
      },
      sticky: {
        id: `obj-${uid()}`,
        kind: 'sticky',
        x: action.x,
        y: action.y,
        width: 240,
        height: 180,
        text: 'Review note',
        color: '#f59e0b',
        zIndex: nextZIndex,
      },
    };
    const nextObject = {
      ...presets[action.kind],
      ...action.preset,
      id: action.preset?.id ?? presets[action.kind].id,
      kind: action.kind,
      x: action.preset?.x ?? action.x,
      y: action.preset?.y ?? action.y,
      zIndex: action.preset?.zIndex ?? nextZIndex,
    };

    const nextPresent = updateActiveSlide(state.present, (activeSlide) => ({
      ...activeSlide,
      objects: [...activeSlide.objects, nextObject],
    }));

    return pushHistory(state, { ...nextPresent, selectedObjectId: nextObject.id });
  }

  if (action.type === 'update-object') {
    const slide = getActiveSlide(state.present);
    const target = slide.objects.find((item) => item.id === action.objectId);
    if (!target) return state;
    const position = clampObjectPosition(
      target,
      action.patch.x ?? target.x,
      action.patch.y ?? target.y,
    );
    const size = clampObjectSize(
      { ...target, x: position.x, y: position.y },
      action.patch.width ?? target.width,
      action.patch.height ?? target.height,
    );
    const nextPresent = updateActiveSlide(state.present, (slide) => ({
      ...slide,
      objects: slide.objects.map((item) =>
        item.id === action.objectId
          ? {
              ...item,
              ...action.patch,
              x: position.x,
              y: position.y,
              width: size.width,
              height: size.height,
            }
          : item,
      ),
    }));
    return pushHistory(state, nextPresent);
  }

  if (action.type === 'move-object') {
    const slide = getActiveSlide(state.present);
    const item = slide.objects.find((object) => object.id === action.objectId);
    if (!item) return state;
    const snapped = applySnapping(slide, action.objectId, action.x, action.y, state.viewport.snapToGrid);
    const constrained = clampObjectPosition(item, snapped.x, snapped.y);
    const nextPresent = updateActiveSlide(state.present, (activeSlide) => ({
      ...activeSlide,
      objects: activeSlide.objects.map((object) =>
        object.id === action.objectId ? { ...object, x: constrained.x, y: constrained.y } : object,
      ),
    }));
    return {
      ...state,
      present: nextPresent,
      viewport: { ...state.viewport, guides: snapped.guides },
    };
  }

  if (action.type === 'resize-object') {
    const slide = getActiveSlide(state.present);
    const item = slide.objects.find((object) => object.id === action.objectId);
    if (!item) return state;
    const constrained = clampObjectSize(item, action.width, action.height);
    const nextPresent = updateActiveSlide(state.present, (activeSlide) => ({
      ...activeSlide,
      objects: activeSlide.objects.map((object) =>
        object.id === action.objectId
          ? { ...object, width: constrained.width, height: constrained.height }
          : object,
      ),
    }));
    return {
      ...state,
      present: nextPresent,
    };
  }

  if (action.type === 'delete-selected-object') {
    if (!state.present.selectedObjectId) return state;
    const nextPresent = updateActiveSlide(state.present, (slide) => ({
      ...slide,
      objects: slide.objects.filter((item) => item.id !== state.present.selectedObjectId),
    }));
    const activeSlide = getActiveSlide(nextPresent);
    return pushHistory(state, {
      ...nextPresent,
      selectedObjectId: activeSlide.objects[0]?.id ?? null,
    });
  }

  if (action.type === 'duplicate-selected-object') {
    const selected = getSelectedObject(state.present);
    if (!selected) return state;
    const clone: OverlayItem = {
      ...selected,
      id: `obj-${uid()}`,
      x: selected.x + 40,
      y: selected.y + 40,
      zIndex: getMaxZIndex(getActiveSlide(state.present)) + 1,
    };
    const nextPresent = updateActiveSlide(state.present, (slide) => ({
      ...slide,
      objects: [...slide.objects, clone],
    }));
    return pushHistory(state, { ...nextPresent, selectedObjectId: clone.id });
  }

  if (action.type === 'set-chat-thread') {
    return pushHistory(state, {
      ...state.present,
      chatThreads: {
        ...state.present.chatThreads,
        [action.slideId]: action.messages,
      },
    });
  }

  if (action.type === 'tidy-layout') {
    const nextPresent = updateActiveSlide(state.present, (slide) => ({
      ...slide,
      objects: sortObjects(slide.objects).map((item, index) => ({
        ...item,
        x: 260 + (index % 2) * 560,
        y: 180 + Math.floor(index / 2) * 250,
      })),
    }));
    return pushHistory(state, nextPresent);
  }

  if (action.type === 'bring-forward' || action.type === 'send-backward') {
    const selected = getSelectedObject(state.present);
    if (!selected) return state;
    const slide = getActiveSlide(state.present);
    const sorted = sortObjects(slide.objects);
    const currentIndex = sorted.findIndex((item) => item.id === selected.id);
    const swapIndex = action.type === 'bring-forward' ? currentIndex + 1 : currentIndex - 1;
    if (currentIndex < 0 || swapIndex < 0 || swapIndex >= sorted.length) return state;
    const nextObjects = [...sorted];
    const current = nextObjects[currentIndex];
    const swap = nextObjects[swapIndex];
    nextObjects[currentIndex] = { ...swap, zIndex: current.zIndex };
    nextObjects[swapIndex] = { ...current, zIndex: swap.zIndex };
    const nextPresent = updateActiveSlide(state.present, (activeSlide) => ({
      ...activeSlide,
      objects: sortObjects(nextObjects),
    }));
    return pushHistory(state, nextPresent);
  }

  return state;
}
