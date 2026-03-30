import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';
import { WORKSPACE_HEIGHT, WORKSPACE_WIDTH } from '../editor/editorState';
import type { EditorSnapshot, GuideState, OverlayItem, Slide } from '../types';

type CanvasWorkspaceProps = {
  slide: Slide;
  selectedObjectId: string | null;
  zoom: number;
  guides: GuideState;
  scrollRef: RefObject<HTMLDivElement | null>;
  presentSnapshot: EditorSnapshot;
  onSelectObject: (objectId: string | null) => void;
  onMoveObject: (objectId: string, x: number, y: number) => void;
  onResizeObject: (objectId: string, width: number, height: number) => void;
  onCommitHistory: (snapshot: EditorSnapshot) => void;
  onTextCommit: (objectId: string, text: string) => void;
  onClearGuides: () => void;
};

type ViewportRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type InteractionState =
  | null
  | {
      type: 'move' | 'resize';
      objectId: string;
      startX: number;
      startY: number;
      originX: number;
      originY: number;
      originWidth: number;
      originHeight: number;
      snapshot: EditorSnapshot;
      dirty: boolean;
    };

export function CanvasWorkspace({
  slide,
  selectedObjectId,
  zoom,
  guides,
  scrollRef,
  presentSnapshot,
  onSelectObject,
  onMoveObject,
  onResizeObject,
  onCommitHistory,
  onTextCommit,
  onClearGuides,
}: CanvasWorkspaceProps) {
  const interactionRef = useRef<InteractionState>(null);
  const [viewportRect, setViewportRect] = useState<ViewportRect>({
    left: 0,
    top: 0,
    width: 360,
    height: 220,
  });

  const sortedObjects = useMemo(
    () => slide.objects.slice().sort((left, right) => left.zIndex - right.zIndex),
    [slide.objects],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction) return;
      const deltaX = (event.clientX - interaction.startX) / zoom;
      const deltaY = (event.clientY - interaction.startY) / zoom;
      interaction.dirty = true;

      if (interaction.type === 'move') {
        onMoveObject(interaction.objectId, interaction.originX + deltaX, interaction.originY + deltaY);
      }

      if (interaction.type === 'resize') {
        onResizeObject(interaction.objectId, interaction.originWidth + deltaX, interaction.originHeight + deltaY);
      }
    };

    const handlePointerUp = () => {
      const interaction = interactionRef.current;
      if (interaction?.dirty) {
        onCommitHistory(interaction.snapshot);
      }
      interactionRef.current = null;
      onClearGuides();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [onClearGuides, onCommitHistory, onMoveObject, onResizeObject, zoom]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;

    const updateViewportRect = () => {
      setViewportRect({
        left: node.scrollLeft / zoom,
        top: node.scrollTop / zoom,
        width: node.clientWidth / zoom,
        height: node.clientHeight / zoom,
      });
    };

    updateViewportRect();
    node.addEventListener('scroll', updateViewportRect, { passive: true });
    window.addEventListener('resize', updateViewportRect);

    return () => {
      node.removeEventListener('scroll', updateViewportRect);
      window.removeEventListener('resize', updateViewportRect);
    };
  }, [scrollRef, zoom]);

  return (
    <section className="canvas-card card">
      <div className="canvas-head">
        <div>
          <p className="eyebrow">Infinite-scroll canvas</p>
          <h2>{slide.title}</h2>
        </div>
        <div className="canvas-status">
          <span className="status-pill" style={{ background: `${slide.accent}22`, color: slide.accent }}>
            {slide.objects.length} live overlays
          </span>
          <span className="status-pill">Viewport {Math.round(zoom * 100)}%</span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="canvas-scroll"
        role="region"
        aria-label={`${slide.title} canvas workspace`}
        onPointerDown={(event) => {
          if (event.target === event.currentTarget) onSelectObject(null);
        }}
      >
        <div className="workspace-grid-bg" style={{ width: WORKSPACE_WIDTH * zoom, height: WORKSPACE_HEIGHT * zoom, backgroundSize: `${48 * zoom}px ${48 * zoom}px, ${48 * zoom}px ${48 * zoom}px, cover` }}>
          <div className="workspace-stage" style={{ width: WORKSPACE_WIDTH, height: WORKSPACE_HEIGHT, transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
            {slide.objects.length === 0 ? (
              <div className="canvas-empty-state card">
                <p className="eyebrow">Canvas is empty</p>
                <h3>Add a block to start arranging this slide.</h3>
                <p>Use the insert tools, then drag, resize, and layer elements to shape the story.</p>
              </div>
            ) : null}

            {guides.x !== null ? <span className="guide-line vertical" style={{ left: guides.x }} /> : null}
            {guides.y !== null ? <span className="guide-line horizontal" style={{ top: guides.y }} /> : null}

            {sortedObjects.map((item) => (
              <OverlayCard
                key={item.id}
                item={item}
                selected={item.id === selectedObjectId}
                onSelect={() => onSelectObject(item.id)}
                onMoveStart={(event) => {
                  interactionRef.current = {
                    type: 'move',
                    objectId: item.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: item.x,
                    originY: item.y,
                    originWidth: item.width,
                    originHeight: item.height,
                    snapshot: presentSnapshot,
                    dirty: false,
                  };
                }}
                onResizeStart={(event) => {
                  interactionRef.current = {
                    type: 'resize',
                    objectId: item.id,
                    startX: event.clientX,
                    startY: event.clientY,
                    originX: item.x,
                    originY: item.y,
                    originWidth: item.width,
                    originHeight: item.height,
                    snapshot: presentSnapshot,
                    dirty: false,
                  };
                }}
                onTextCommit={(text) => onTextCommit(item.id, text)}
              />
            ))}
          </div>
        </div>
        <MiniMap slide={slide} viewportRect={viewportRect} />
      </div>
    </section>
  );
}

function OverlayCard({
  item,
  selected,
  onSelect,
  onMoveStart,
  onResizeStart,
  onTextCommit,
}: {
  item: OverlayItem;
  selected: boolean;
  onSelect: () => void;
  onMoveStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onResizeStart: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onTextCommit: (text: string) => void;
}) {
  const [draftText, setDraftText] = useState(item.text);

  useEffect(() => {
    setDraftText(item.text);
  }, [item.text]);

  return (
    <article
      className={`overlay-card overlay-${item.kind} ${selected ? 'selected' : ''}`}
      style={{
        transform: `translate(${item.x}px, ${item.y}px)`,
        width: item.width,
        minHeight: item.height,
        borderColor: item.color,
        zIndex: item.zIndex,
      }}
      onPointerDown={(event) => {
        event.stopPropagation();
        onSelect();
      }}
    >
      <div className="overlay-handle">
        <span>{item.kind}</span>
        <button
          type="button"
          className="overlay-handle-button"
          onPointerDown={(event) => {
            event.stopPropagation();
            onSelect();
            onMoveStart(event);
          }}
        >
          Drag
        </button>
      </div>
      <div
        className="overlay-text"
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label={`${item.kind} text`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
        }}
        onInput={(event) => setDraftText(event.currentTarget.textContent ?? '')}
        onBlur={() => onTextCommit(draftText)}
        dangerouslySetInnerHTML={{ __html: draftText.replace(/\n/g, '<br/>') }}
      />
      <button
        type="button"
        className="overlay-resize-handle"
        aria-label={`Resize ${item.kind}`}
        onPointerDown={(event) => {
          event.stopPropagation();
          onSelect();
          onResizeStart(event);
        }}
      />
    </article>
  );
}

function MiniMap({ slide, viewportRect }: { slide: Slide; viewportRect: ViewportRect }) {
  const scale = 0.045;

  return (
    <div className="minimap card" aria-hidden="true">
      <div className="minimap-stage">
        {slide.objects
          .slice()
          .sort((left, right) => left.zIndex - right.zIndex)
          .map((item) => (
            <span
              key={item.id}
              className="minimap-item"
              style={{
                left: item.x * scale,
                top: item.y * scale,
                width: Math.max(8, item.width * scale),
                height: Math.max(8, item.height * scale),
                background: item.color,
              }}
            />
          ))}
        <span
          className="minimap-viewport"
          style={{
            left: viewportRect.left * scale,
            top: viewportRect.top * scale,
            width: viewportRect.width * scale,
            height: viewportRect.height * scale,
          }}
        />
      </div>
    </div>
  );
}
