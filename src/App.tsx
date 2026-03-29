import { useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { demoImageSrc, initialSlides } from './demoData';
import type { ChatMessage, ChatThread, OverlayItem, OverlayKind, Slide } from './types';

const WORKSPACE_WIDTH = 4200;
const WORKSPACE_HEIGHT = 2600;
const uid = () => Math.random().toString(36).slice(2, 10);

type RedactionMode = 'pixelate' | 'blackout';
type UndoState =
  | null
  | {
      kind: 'delete-object';
      message: string;
      payload: {
        slideId: string;
        object: OverlayItem;
        index: number;
      };
    }
  | {
      kind: 'reset-redaction';
      message: string;
      payload: {
        imageData: ImageData;
        hadRedactions: boolean;
      };
    };

const createAssistantGreeting = (): ChatMessage => ({
  id: uid(),
  role: 'assistant',
  text: 'This thread is scoped to the current slide. Ask for a tighter headline, a new callout, or a cleaner layout.',
});

const initialThreads = (): ChatThread =>
  Object.fromEntries(initialSlides.map((slide) => [slide.id, [createAssistantGreeting()]]));

export function App() {
  const [slides, setSlides] = useState<Slide[]>(initialSlides);
  const [activeSlideId, setActiveSlideId] = useState(initialSlides[0].id);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(initialSlides[0].objects[0]?.id ?? null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [redactionOpen, setRedactionOpen] = useState(true);
  const [chatBusy, setChatBusy] = useState(false);
  const [chatThreads, setChatThreads] = useState<ChatThread>(() => initialThreads());
  const [mode, setMode] = useState<RedactionMode>('pixelate');
  const [brushSize, setBrushSize] = useState(28);
  const [drawing, setDrawing] = useState(false);
  const [hasRedactions, setHasRedactions] = useState(false);
  const [undoState, setUndoState] = useState<UndoState>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const chatInputRef = useRef<HTMLTextAreaElement | null>(null);
  const initializedRef = useRef(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const activeSlide = useMemo(
    () => slides.find((slide) => slide.id === activeSlideId) ?? slides[0],
    [slides, activeSlideId],
  );

  const selectedObject = useMemo(
    () => activeSlide.objects.find((item) => item.id === selectedObjectId) ?? null,
    [activeSlide, selectedObjectId],
  );
  const activeChatMessages = chatThreads[activeSlideId] ?? [createAssistantGreeting()];

  useEffect(() => {
    if (!scrollRef.current || initializedRef.current) return;
    scrollRef.current.scrollLeft = WORKSPACE_WIDTH / 2 - scrollRef.current.clientWidth / 2;
    scrollRef.current.scrollTop = WORKSPACE_HEIGHT / 2 - scrollRef.current.clientHeight / 2;
    initializedRef.current = true;
  }, []);

  useEffect(() => {
    if (selectedObjectId && !activeSlide.objects.some((item) => item.id === selectedObjectId)) {
      setSelectedObjectId(activeSlide.objects[0]?.id ?? null);
    }
  }, [activeSlide, selectedObjectId]);

  useEffect(() => {
    const image = new Image();
    image.src = demoImageSrc;
    image.onload = () => {
      imageRef.current = image;
      resetCanvas(canvasRef.current, imageRef.current);
      setHasRedactions(false);
    };
  }, []);

  const updateActiveSlide = (updater: (slide: Slide) => Slide) => {
    setSlides((current) => current.map((slide) => (slide.id === activeSlideId ? updater(slide) : slide)));
  };

  const reorderSlides = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = slides.findIndex((slide) => slide.id === active.id);
    const newIndex = slides.findIndex((slide) => slide.id === over.id);
    setSlides(arrayMove(slides, oldIndex, newIndex));
  };

  const addSlide = () => {
    const newSlide: Slide = {
      id: `slide-${uid()}`,
      title: `Concept ${slides.length + 1}`,
      accent: ['#0f766e', '#2563eb', '#7c3aed', '#dc2626'][slides.length % 4],
      objects: [
        {
          id: `obj-${uid()}`,
          kind: 'text',
          x: 340,
          y: 220,
          width: 540,
          height: 130,
          text: 'New slide headline — click to edit',
          color: '#111827',
        },
      ],
    };
    setSlides((current) => [...current, newSlide]);
    setChatThreads((current) => ({ ...current, [newSlide.id]: [createAssistantGreeting()] }));
    setActiveSlideId(newSlide.id);
    setSelectedObjectId(newSlide.objects[0].id);
  };

  const addObject = (kind: OverlayKind) => {
    const scroll = scrollRef.current;
    const x = scroll ? scroll.scrollLeft + scroll.clientWidth / 2 - 180 : 520;
    const y = scroll ? scroll.scrollTop + scroll.clientHeight / 2 - 60 : 320;
    const presets: Record<OverlayKind, OverlayItem> = {
      text: {
        id: `obj-${uid()}`,
        kind: 'text',
        x,
        y,
        width: 460,
        height: 120,
        text: 'New text block — edit inline',
        color: '#0f172a',
      },
      callout: {
        id: `obj-${uid()}`,
        kind: 'callout',
        x,
        y,
        width: 300,
        height: 120,
        text: 'Key callout',
        color: activeSlide.accent,
      },
      sticky: {
        id: `obj-${uid()}`,
        kind: 'sticky',
        x,
        y,
        width: 220,
        height: 170,
        text: 'Review note',
        color: '#f59e0b',
      },
    };
    const object = presets[kind];

    updateActiveSlide((slide) => ({ ...slide, objects: [...slide.objects, object] }));
    setSelectedObjectId(object.id);
  };

  const updateObject = (objectId: string, patch: Partial<OverlayItem>) => {
    updateActiveSlide((slide) => ({
      ...slide,
      objects: slide.objects.map((item) => (item.id === objectId ? { ...item, ...patch } : item)),
    }));
  };

  const deleteSelectedObject = () => {
    if (!selectedObjectId) return;
    const deletedIndex = activeSlide.objects.findIndex((item) => item.id === selectedObjectId);
    const deletedObject = activeSlide.objects[deletedIndex];
    if (!deletedObject) return;
    updateActiveSlide((slide) => ({
      ...slide,
      objects: slide.objects.filter((item) => item.id !== selectedObjectId),
    }));
    setUndoState({
      kind: 'delete-object',
      message: `Deleted ${deletedObject.kind}.`,
      payload: {
        slideId: activeSlideId,
        object: deletedObject,
        index: deletedIndex,
      },
    });
    setSelectedObjectId(null);
  };

  const sendChat = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    setChatThreads((current) => ({
      ...current,
      [activeSlideId]: [...(current[activeSlideId] ?? [createAssistantGreeting()]), { id: uid(), role: 'user', text: trimmed }],
    }));
    setChatBusy(true);
    const reply = buildAssistantReply(trimmed, activeSlide);

    if (reply.action === 'headline') addObject('text');
    if (reply.action === 'callout') addObject('callout');
    if (reply.action === 'tidy' && activeSlide.objects.length > 1) {
      updateActiveSlide((slide) => ({
        ...slide,
        objects: slide.objects.map((item, index) => ({
          ...item,
          x: 260 + (index % 2) * 520,
          y: 180 + Math.floor(index / 2) * 240,
        })),
      }));
    }

    await new Promise((resolve) => setTimeout(resolve, 420));
    setChatThreads((current) => ({
      ...current,
      [activeSlideId]: [...(current[activeSlideId] ?? [createAssistantGreeting()]), { id: uid(), role: 'assistant', text: reply.text }],
    }));
    setChatBusy(false);
    chatInputRef.current?.focus();
  };

  const applyRedaction = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;
    const size = brushSize;
    const left = Math.max(0, Math.floor(x - size));
    const top = Math.max(0, Math.floor(y - size));
    const width = Math.min(canvas.width - left, size * 2);
    const height = Math.min(canvas.height - top, size * 2);
    setHasRedactions(true);

    if (mode === 'blackout') {
      context.fillStyle = '#020617';
      context.fillRect(left, top, width, height);
      return;
    }

    const block = 10;
    const imageData = context.getImageData(left, top, width, height);
    const { data } = imageData;
    for (let row = 0; row < height; row += block) {
      for (let column = 0; column < width; column += block) {
        const index = (row * width + column) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        for (let yOffset = 0; yOffset < block; yOffset += 1) {
          for (let xOffset = 0; xOffset < block; xOffset += 1) {
            const px = column + xOffset;
            const py = row + yOffset;
            if (px >= width || py >= height) continue;
            const pxIndex = (py * width + px) * 4;
            data[pxIndex] = r;
            data[pxIndex + 1] = g;
            data[pxIndex + 2] = b;
          }
        }
      }
    }
    context.putImageData(imageData, left, top);
  };

  const resetRedaction = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    if (!canvas || !image) return;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const previousImageData = context.getImageData(0, 0, canvas.width, canvas.height);
    resetCanvas(canvas, image);
    setUndoState({
      kind: 'reset-redaction',
      message: 'Reset the redaction canvas.',
      payload: {
        imageData: previousImageData,
        hadRedactions: hasRedactions,
      },
    });
    setHasRedactions(false);
  };

  const undoLastAction = () => {
    if (!undoState) return;
    if (undoState.kind === 'delete-object') {
      const { slideId, object, index } = undoState.payload;
      setSlides((current) =>
        current.map((slide) =>
          slide.id === slideId
            ? {
                ...slide,
                objects: [...slide.objects.slice(0, index), object, ...slide.objects.slice(index)],
              }
            : slide,
        ),
      );
      setActiveSlideId(undoState.payload.slideId);
      setSelectedObjectId(undoState.payload.object.id);
    }

    if (undoState.kind === 'reset-redaction') {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) {
        context.putImageData(undoState.payload.imageData, 0, 0);
        setHasRedactions(undoState.payload.hadRedactions);
      }
    }

    setUndoState(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Portfolio demo · complex editor UI</p>
          <h1>CanvasCraft Editor Demo</h1>
        </div>
        <div className="topbar-actions">
          <button className="ghost-button" aria-pressed={sidebarCollapsed} onClick={() => setSidebarCollapsed((value) => !value)}>
            {sidebarCollapsed ? 'Expand slide list' : 'Collapse slide list'}
          </button>
          <button className="ghost-button" aria-pressed={redactionOpen} onClick={() => setRedactionOpen((value) => !value)}>
            {redactionOpen ? 'Hide redaction lab' : 'Open redaction lab'}
          </button>
          <button className="primary-button" aria-pressed={aiOpen} onClick={() => setAiOpen((value) => !value)}>
            {aiOpen ? 'Hide AI panel' : 'Show AI panel'}
          </button>
        </div>
      </header>

      {undoState ? (
        <section className="undo-banner card" aria-live="polite">
          <p>{undoState.message}</p>
          <div className="undo-actions">
            <button className="toolbar-chip" onClick={undoLastAction}>Undo</button>
            <button className="ghost-button" onClick={() => setUndoState(null)}>Dismiss</button>
          </div>
        </section>
      ) : null}

      <section className={`workspace-grid ${!aiOpen ? 'no-chat' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <aside className={`sidebar card ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <div>
              <p className="sidebar-label">Slides</p>
              {!sidebarCollapsed ? <h2>{slides.length} frames</h2> : null}
            </div>
            <button
              className="icon-button"
              aria-label={sidebarCollapsed ? 'Expand slide list' : 'Collapse slide list'}
              aria-pressed={sidebarCollapsed}
              onClick={() => setSidebarCollapsed((value) => !value)}
            >
              {sidebarCollapsed ? '→' : '←'}
            </button>
          </div>

          <button className="primary-button sidebar-add" aria-label="Add slide" onClick={addSlide}>{sidebarCollapsed ? '+' : 'Add slide'}</button>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={reorderSlides}>
            <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
              <div className="slide-list">
                {slides.map((slide, index) => (
                  <SlideCard
                    key={slide.id}
                    slide={slide}
                    index={index}
                    collapsed={sidebarCollapsed}
                    active={slide.id === activeSlideId}
                    onSelect={() => {
                      setActiveSlideId(slide.id);
                      setSelectedObjectId(slide.objects[0]?.id ?? null);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </aside>

        <div className="editor-column">
          <section className="editor-toolbar card">
            <div className="toolbar-group">
              <span className="toolbar-label">Insert</span>
              <button className="toolbar-chip" onClick={() => addObject('text')}>Text</button>
              <button className="toolbar-chip" onClick={() => addObject('callout')}>Callout</button>
              <button className="toolbar-chip" onClick={() => addObject('sticky')}>Sticky note</button>
            </div>
            <div className="toolbar-group">
              <span className="toolbar-label">Selection</span>
              <button className="toolbar-chip" disabled={!selectedObject} onClick={deleteSelectedObject}>Delete</button>
              <span className="status-pill">{selectedObject ? `${selectedObject.kind} selected` : 'No selection'}</span>
            </div>
            <div className="toolbar-group toolbar-meta">
              <span className="status-pill">React + TypeScript</span>
              <span className="status-pill">dnd-kit sortable sidebar</span>
              <span className="status-pill">canvas redaction</span>
            </div>
          </section>

          <section className="canvas-card card">
            <div className="canvas-head">
              <div>
                <p className="eyebrow">Infinite-scroll canvas</p>
                <h2>{activeSlide.title}</h2>
              </div>
              <div className="status-pill" style={{ background: `${activeSlide.accent}22`, color: activeSlide.accent }}>
                {activeSlide.objects.length} live overlays
              </div>
            </div>

            <div
              ref={scrollRef}
              className="canvas-scroll"
              role="region"
              aria-label={`${activeSlide.title} canvas workspace`}
              onMouseDown={() => setSelectedObjectId(null)}
            >
              <div className="workspace-grid-bg" style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT }}>
                <div className="workspace-stage">
                  {activeSlide.objects.length === 0 ? (
                    <div className="canvas-empty-state card">
                      <p className="eyebrow">Canvas is empty</p>
                      <h3>Add a block to start arranging this slide.</h3>
                      <p>Use the insert tools or ask the layout assistant to add structure for you.</p>
                      <div className="quick-actions">
                        <button className="toolbar-chip" onClick={() => addObject('text')}>Add text</button>
                        <button className="toolbar-chip" onClick={() => addObject('callout')}>Add callout</button>
                      </div>
                    </div>
                  ) : null}
                  {activeSlide.objects.map((item) => (
                    <OverlayCard
                      key={item.id}
                      item={item}
                      selected={item.id === selectedObjectId}
                      onSelect={() => setSelectedObjectId(item.id)}
                      onMove={(x, y) => updateObject(item.id, { x, y })}
                      onTextCommit={(text) => updateObject(item.id, { text })}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {redactionOpen ? (
            <section className="card redaction-card">
              <div className="redaction-header">
                <div>
                  <p className="eyebrow">Canvas pixel manipulation</p>
                  <h2>Redaction lab</h2>
                </div>
                <div className="toolbar-group">
                  <button className={`toolbar-chip ${mode === 'pixelate' ? 'active-chip' : ''}`} onClick={() => setMode('pixelate')}>Pixelate</button>
                  <button className={`toolbar-chip ${mode === 'blackout' ? 'active-chip' : ''}`} onClick={() => setMode('blackout')}>Blackout</button>
                  <button className="ghost-button" onClick={resetRedaction}>Reset</button>
                </div>
              </div>
              <div className="redaction-controls">
                <label>
                  Brush size
                  <input type="range" min={14} max={60} value={brushSize} onChange={(event) => setBrushSize(Number(event.target.value))} />
                </label>
                <span className="status-pill">{mode === 'pixelate' ? 'Pixel block brush' : 'Blackout brush'} · {brushSize}px</span>
              </div>
              <div className="redaction-help" aria-live="polite">
                <strong>{hasRedactions ? 'Redactions applied' : 'Try the brush'}</strong>
                <p>
                  {hasRedactions
                    ? 'Use Undo to restore the last reset, or keep brushing to continue masking sensitive details.'
                    : 'Drag across the image to mask sensitive details, then use Reset if you want to start over.'}
                </p>
              </div>
              <canvas
                ref={canvasRef}
                className="redaction-canvas"
                width={960}
                height={560}
                aria-label="Interactive redaction canvas"
                onMouseDown={(event) => {
                  setDrawing(true);
                  applyRedaction(event.clientX, event.clientY);
                }}
                onMouseMove={(event) => drawing && applyRedaction(event.clientX, event.clientY)}
                onMouseUp={() => setDrawing(false)}
                onMouseLeave={() => setDrawing(false)}
              />
            </section>
          ) : null}
        </div>

        {aiOpen ? (
          <aside className="chat-panel card">
            <div className="chat-panel-header">
              <div>
                <p className="eyebrow">AI sidecar</p>
                <h2>Layout assistant</h2>
              </div>
              <span className="status-pill">{activeSlide.title}</span>
            </div>
            <p className="chat-scope-note">Thread is scoped to this slide so suggestions stay tied to the current composition.</p>
            <div className="quick-actions">
              {['Tidy the layout', 'Add a supporting callout', 'Suggest a stronger headline'].map((action) => (
                <button key={action} className="toolbar-chip" onClick={() => sendChat(action)}>{action}</button>
              ))}
            </div>
            <div className="chat-thread" role="log" aria-live="polite" aria-busy={chatBusy}>
              {activeChatMessages.map((message) => (
                <article key={message.id} className={`chat-bubble ${message.role}`}>
                  <strong>{message.role === 'assistant' ? 'Assistant' : 'You'}</strong>
                  <p>{message.text}</p>
                </article>
              ))}
              {chatBusy ? <div className="chat-bubble assistant"><strong>Assistant</strong><p>Thinking through the current composition…</p></div> : null}
            </div>
            <form className="chat-compose" onSubmit={(event) => {
              event.preventDefault();
              const value = chatInputRef.current?.value ?? '';
              if (!value.trim()) return;
              void sendChat(value);
              if (chatInputRef.current) chatInputRef.current.value = '';
            }}>
              <label className="compose-label" htmlFor="chat-message">Message</label>
              <textarea
                id="chat-message"
                ref={chatInputRef}
                name="message"
                autoComplete="off"
                placeholder="Ask for a cleaner layout, a new callout, or a stronger headline…"
              />
              <button className="primary-button" type="submit" disabled={chatBusy}>Send</button>
            </form>
          </aside>
        ) : null}
      </section>
    </main>
  );
}

function SlideCard({ slide, index, collapsed, active, onSelect }: { slide: Slide; index: number; collapsed: boolean; active: boolean; onSelect: () => void; }) {
  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({ id: slide.id });
  return (
    <article
      ref={setNodeRef}
      className={`slide-card ${active ? 'active' : ''} ${collapsed ? 'compact' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button type="button" className="slide-select" aria-label={`Open ${slide.title}`} aria-pressed={active} onClick={onSelect}>
        <div className="slide-thumb" style={{ borderColor: slide.accent }}>
          <div className="thumb-canvas">
            {slide.objects.slice(0, 3).map((item) => (
              <span
                key={item.id}
                className="thumb-item"
                style={{
                  left: `${Math.max(8, item.x / 18)}px`,
                  top: `${Math.max(10, item.y / 18)}px`,
                  width: `${Math.max(30, item.width / 12)}px`,
                  background: item.color,
                }}
              />
            ))}
          </div>
        </div>
        {!collapsed ? (
          <div className="slide-meta">
            <span className="slide-index">{String(index + 1).padStart(2, '0')}</span>
            <strong>{slide.title}</strong>
            <small>{slide.objects.length} overlays</small>
          </div>
        ) : null}
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        className="slide-drag-handle icon-button"
        aria-label={`Reorder ${slide.title}`}
        {...attributes}
        {...listeners}
      >
        ≡
      </button>
    </article>
  );
}

function OverlayCard({ item, selected, onSelect, onMove, onTextCommit }: {
  item: OverlayItem;
  selected: boolean;
  onSelect: () => void;
  onMove: (x: number, y: number) => void;
  onTextCommit: (text: string) => void;
}) {
  const dragState = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const [draftText, setDraftText] = useState(item.text);

  useEffect(() => setDraftText(item.text), [item.text]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.current) return;
      const deltaX = event.clientX - dragState.current.startX;
      const deltaY = event.clientY - dragState.current.startY;
      onMove(Math.max(24, dragState.current.originX + deltaX), Math.max(24, dragState.current.originY + deltaY));
    };
    const handleMouseUp = () => {
      dragState.current = null;
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onMove]);

  return (
    <article
      className={`overlay-card overlay-${item.kind} ${selected ? 'selected' : ''}`}
      style={{
        transform: `translate(${item.x}px, ${item.y}px)`,
        width: item.width,
        minHeight: item.height,
        borderColor: item.color,
      }}
      onMouseDown={(event) => {
        event.stopPropagation();
        onSelect();
        dragState.current = {
          startX: event.clientX,
          startY: event.clientY,
          originX: item.x,
          originY: item.y,
        };
      }}
    >
      <div className="overlay-handle">
        <span>{item.kind}</span>
        <span>drag</span>
      </div>
      <div
        className="overlay-text"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`${item.kind} text`}
        onMouseDown={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onInput={(event) => setDraftText(event.currentTarget.textContent ?? '')}
        onBlur={() => onTextCommit(draftText)}
        dangerouslySetInnerHTML={{ __html: draftText.replace(/\n/g, '<br/>') }}
      />
    </article>
  );
}

function buildAssistantReply(message: string, slide: Slide) {
  const lower = message.toLowerCase();
  if (lower.includes('headline')) {
    return {
      action: 'headline' as const,
      text: `I added a new editable headline block. For this slide, I would keep it outcome-driven: “${slide.title}: faster review cycles with less manual formatting.”`,
    };
  }
  if (lower.includes('callout') || lower.includes('annotation')) {
    return {
      action: 'callout' as const,
      text: 'Added a callout so the layout can carry an explicit supporting insight without disrupting the primary narrative.',
    };
  }
  if (lower.includes('tidy') || lower.includes('organize') || lower.includes('layout')) {
    return {
      action: 'tidy' as const,
      text: 'I normalized the spacing into a cleaner two-column rhythm. In a production editor, this would map neatly to layout presets without rewriting the rest of the canvas subsystem.',
    };
  }
  return {
    action: 'none' as const,
    text: `This editor shell is intentionally componentized: sortable slide rail, scrollable canvas, inline-editable overlays, and an AI sidecar that can reshape the layout without reloading the page. Slide “${slide.title}” currently has ${slide.objects.length} overlay items.`,
  };
}

function resetCanvas(canvas: HTMLCanvasElement | null, image: HTMLImageElement | null) {
  if (!canvas || !image) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
}
