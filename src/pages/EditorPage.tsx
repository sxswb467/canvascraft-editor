import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { EditorNav } from '../components/EditorNav';
import { EditorToolbar } from '../components/EditorToolbar';
import { RedactionLab } from '../components/RedactionLab';
import { RightDrawer } from '../components/RightDrawer';
import { useEditorContext } from '../context/EditorContext';
import { buildAssistantReply, type AssistantOperation } from '../editor/assistant';
import {
  WORKSPACE_HEIGHT,
  WORKSPACE_WIDTH,
  ZOOM_MAX,
  ZOOM_MIN,
  createAssistantGreeting,
  getActiveSlide,
  getSlideBounds,
  getSelectedObject,
  uid,
} from '../editor/editorState';
import { useEditorKeyboardShortcuts } from '../hooks/useEditorKeyboardShortcuts';
import type { ChatMessage, OverlayItem, OverlayKind } from '../types';

export function EditorPage() {
  const { editorState, dispatch } = useEditorContext();
  const { slideId } = useParams<{ slideId: string }>();
  const navigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [redactionOpen, setRedactionOpen] = useState(false);
  const [chatBusy, setChatBusy] = useState(false);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);
  const lastFramedSlideRef = useRef<string | null>(null);

  // Sync URL param → editor active slide
  useEffect(() => {
    if (!slideId) return;
    const exists = editorState.present.slides.some((s) => s.id === slideId);
    if (!exists) {
      navigate('/', { replace: true });
      return;
    }
    if (editorState.present.activeSlideId !== slideId) {
      dispatch({ type: 'select-slide', slideId });
    }
  }, [slideId]);

  const activeSlide = useMemo(() => getActiveSlide(editorState.present), [editorState.present]);
  const activeSlideBounds = useMemo(() => getSlideBounds(activeSlide), [activeSlide]);
  const selectedObject = useMemo(() => getSelectedObject(editorState.present), [editorState.present]);
  const activeChatMessages = editorState.present.chatThreads[activeSlide.id] ?? [createAssistantGreeting()];

  // Auto-frame when slide changes
  useEffect(() => {
    if (!scrollRef.current) return;
    const shouldAdjustZoom = !initializedRef.current || lastFramedSlideRef.current !== activeSlide.id;
    if (!initializedRef.current) initializedRef.current = true;
    focusBounds({
      bounds: activeSlideBounds,
      node: scrollRef.current,
      currentZoom: editorState.viewport.zoom,
      dispatchZoom: (zoom) => dispatch({ type: 'set-zoom', zoom }),
      adjustZoom: shouldAdjustZoom,
    });
    lastFramedSlideRef.current = activeSlide.id;
  }, [activeSlide.id]);

  const addObject = (kind: OverlayKind, preset?: Partial<OverlayItem>) => {
    const scroll = scrollRef.current;
    const x =
      preset?.x ??
      (scroll
        ? scroll.scrollLeft / editorState.viewport.zoom + scroll.clientWidth / (2 * editorState.viewport.zoom) - 180
        : 520);
    const y =
      preset?.y ??
      (scroll
        ? scroll.scrollTop / editorState.viewport.zoom + scroll.clientHeight / (2 * editorState.viewport.zoom) - 60
        : 320);
    dispatch({ type: 'add-object', kind, x, y, preset });
  };

  const setZoom = (nextZoom: number) => {
    const node = scrollRef.current;
    const previousZoom = editorState.viewport.zoom;
    const currentCenter = node
      ? {
          x: (node.scrollLeft + node.clientWidth / 2) / previousZoom,
          y: (node.scrollTop + node.clientHeight / 2) / previousZoom,
        }
      : { x: WORKSPACE_WIDTH / 2, y: WORKSPACE_HEIGHT / 2 };

    dispatch({ type: 'set-zoom', zoom: nextZoom });

    if (!node) return;
    requestAnimationFrame(() => {
      const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
      node.scrollLeft = currentCenter.x * clampedZoom - node.clientWidth / 2;
      node.scrollTop = currentCenter.y * clampedZoom - node.clientHeight / 2;
    });
  };

  const fitToView = () => {
    const node = scrollRef.current;
    if (!node) return;
    focusBounds({
      bounds: activeSlideBounds,
      node,
      currentZoom: editorState.viewport.zoom,
      dispatchZoom: (zoom) => dispatch({ type: 'set-zoom', zoom }),
      adjustZoom: true,
    });
  };

  const nudgeSelection = (deltaX: number, deltaY: number) => {
    if (!selectedObject) return;
    dispatch({
      type: 'update-object',
      objectId: selectedObject.id,
      patch: { x: selectedObject.x + deltaX, y: selectedObject.y + deltaY },
    });
  };

  useEditorKeyboardShortcuts({
    hasSelection: Boolean(selectedObject),
    onDelete: () => dispatch({ type: 'delete-selected-object' }),
    onDuplicate: () => dispatch({ type: 'duplicate-selected-object' }),
    onDeselect: () => dispatch({ type: 'select-object', objectId: null }),
    onUndo: () => dispatch({ type: 'undo' }),
    onRedo: () => dispatch({ type: 'redo' }),
    onNudge: nudgeSelection,
  });

  const applyAssistantOperations = (operations: AssistantOperation[]) => {
    startTransition(() => {
      operations.forEach((operation) => {
        if (operation.type === 'add-object') addObject(operation.kind, operation.preset);
        if (operation.type === 'rewrite-object') {
          dispatch({ type: 'update-object', objectId: operation.objectId, patch: { text: operation.text } });
        }
        if (operation.type === 'tidy-layout' && activeSlide.objects.length > 1) {
          dispatch({ type: 'tidy-layout' });
        }
      });
    });
  };

  const sendChat = async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed) return;
    const nextThread: ChatMessage[] = [
      ...activeChatMessages,
      { id: crypto.randomUUID?.() ?? `chat-${Date.now()}`, role: 'user', text: trimmed },
    ];
    dispatch({ type: 'set-chat-thread', slideId: activeSlide.id, messages: nextThread });
    setChatBusy(true);

    const reply = buildAssistantReply(trimmed, activeSlide);
    applyAssistantOperations(reply.operations);

    await new Promise((resolve) => setTimeout(resolve, 280));

    dispatch({
      type: 'set-chat-thread',
      slideId: activeSlide.id,
      messages: [
        ...nextThread,
        { id: crypto.randomUUID?.() ?? `chat-${Date.now()}-assistant`, role: 'assistant', text: reply.text },
      ],
    });
    setChatBusy(false);
  };

  const handleAddSlide = () => {
    const newSlideId = `slide-${uid()}`;
    dispatch({ type: 'add-slide', slideId: newSlideId });
    navigate(`/edit/${newSlideId}`);
  };

  return (
    <div className="editor-shell">
      <EditorNav
        slides={editorState.present.slides}
        activeSlideId={activeSlide.id}
        drawerOpen={drawerOpen}
        onToggleDrawer={() => setDrawerOpen((v) => !v)}
        onAddSlide={handleAddSlide}
      />

      <div className="editor-main">
        <CanvasWorkspace
          slide={activeSlide}
          selectedObjectId={editorState.present.selectedObjectId}
          zoom={editorState.viewport.zoom}
          guides={editorState.viewport.guides}
          scrollRef={scrollRef}
          presentSnapshot={editorState.present}
          onSelectObject={(objectId) => dispatch({ type: 'select-object', objectId })}
          onMoveObject={(objectId, x, y) => dispatch({ type: 'move-object', objectId, x, y })}
          onResizeObject={(objectId, width, height) => dispatch({ type: 'resize-object', objectId, width, height })}
          onCommitHistory={(snapshot) => dispatch({ type: 'commit-history', snapshot })}
          onTextCommit={(objectId, text) => dispatch({ type: 'update-object', objectId, patch: { text } })}
          onClearGuides={() => dispatch({ type: 'clear-guides' })}
        />

        {redactionOpen ? <RedactionLab /> : null}
      </div>

      <EditorToolbar
        zoom={editorState.viewport.zoom}
        snapToGrid={editorState.viewport.snapToGrid}
        canUndo={editorState.past.length > 0}
        canRedo={editorState.future.length > 0}
        hasSelection={Boolean(selectedObject)}
        redactionOpen={redactionOpen}
        onAddText={() => addObject('text')}
        onAddCallout={() => addObject('callout')}
        onAddSticky={() => addObject('sticky')}
        onDelete={() => dispatch({ type: 'delete-selected-object' })}
        onDuplicate={() => dispatch({ type: 'duplicate-selected-object' })}
        onUndo={() => dispatch({ type: 'undo' })}
        onRedo={() => dispatch({ type: 'redo' })}
        onZoomOut={() => setZoom(editorState.viewport.zoom - 0.1)}
        onZoomIn={() => setZoom(editorState.viewport.zoom + 0.1)}
        onResetZoom={() => setZoom(1)}
        onFitToView={fitToView}
        onToggleSnap={() => dispatch({ type: 'toggle-snap' })}
        onToggleRedaction={() => setRedactionOpen((v) => !v)}
      />

      <RightDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        selectedObject={selectedObject}
        onPatchObject={(patch) =>
          selectedObject && dispatch({ type: 'update-object', objectId: selectedObject.id, patch })
        }
        onBringForward={() => dispatch({ type: 'bring-forward' })}
        onSendBackward={() => dispatch({ type: 'send-backward' })}
        activeSlideTitle={activeSlide.title}
        messages={activeChatMessages}
        chatBusy={chatBusy}
        onQuickAction={sendChat}
        onSendMessage={sendChat}
      />
    </div>
  );
}

// ── helpers (same as original App.tsx) ────────────────────────────────────────

function focusBounds({
  bounds,
  node,
  currentZoom,
  dispatchZoom,
  adjustZoom,
}: {
  bounds: { left: number; top: number; width: number; height: number };
  node: HTMLDivElement;
  currentZoom: number;
  dispatchZoom: (zoom: number) => void;
  adjustZoom: boolean;
}) {
  const nextZoom = adjustZoom ? getBoundsZoom(bounds, node) : currentZoom;
  const clampedZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, nextZoom));
  if (adjustZoom && Math.abs(clampedZoom - currentZoom) > 0.001) dispatchZoom(clampedZoom);
  requestAnimationFrame(() => centerOnBounds(bounds, clampedZoom, node));
}

function getBoundsZoom(bounds: { width: number; height: number }, node: HTMLDivElement) {
  const pad = 120;
  return Math.min(
    ZOOM_MAX,
    Math.max(
      ZOOM_MIN,
      Math.min(
        (node.clientWidth - pad) / Math.max(bounds.width, 240),
        (node.clientHeight - pad) / Math.max(bounds.height, 180),
      ),
    ),
  );
}

function centerOnBounds(
  bounds: { left: number; top: number; width: number; height: number },
  zoom: number,
  node: HTMLDivElement,
) {
  const centerX = (bounds.left + bounds.width / 2) * zoom;
  const centerY = (bounds.top + bounds.height / 2) * zoom;
  const maxScrollLeft = Math.max(0, WORKSPACE_WIDTH * zoom - node.clientWidth);
  const maxScrollTop = Math.max(0, WORKSPACE_HEIGHT * zoom - node.clientHeight);
  node.scrollLeft = clamp(centerX - node.clientWidth / 2, 0, maxScrollLeft);
  node.scrollTop = clamp(centerY - node.clientHeight / 2, 0, maxScrollTop);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
