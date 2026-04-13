type EditorToolbarProps = {
  zoom: number;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  redactionOpen: boolean;
  onAddText: () => void;
  onAddCallout: () => void;
  onAddSticky: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomOut: () => void;
  onZoomIn: () => void;
  onResetZoom: () => void;
  onFitToView: () => void;
  onToggleSnap: () => void;
  onToggleRedaction: () => void;
};

export function EditorToolbar({
  zoom,
  snapToGrid,
  canUndo,
  canRedo,
  hasSelection,
  redactionOpen,
  onAddText,
  onAddCallout,
  onAddSticky,
  onDelete,
  onDuplicate,
  onUndo,
  onRedo,
  onZoomOut,
  onZoomIn,
  onResetZoom,
  onFitToView,
  onToggleSnap,
  onToggleRedaction,
}: EditorToolbarProps) {
  return (
    <div className="bottom-bar">
      <div className="bottom-bar-group">
        <span className="bottom-bar-label">Insert</span>
        <button className="toolbar-chip" onClick={onAddText}>Text</button>
        <button className="toolbar-chip" onClick={onAddCallout}>Callout</button>
        <button className="toolbar-chip" onClick={onAddSticky}>Sticky</button>
      </div>

      <div className="bottom-bar-sep" />

      <div className="bottom-bar-group">
        <button className="toolbar-chip" disabled={!hasSelection} onClick={onDuplicate} title="Duplicate (Cmd+D)">Dup</button>
        <button className="toolbar-chip" disabled={!hasSelection} onClick={onDelete} title="Delete">Del</button>
        <button className="toolbar-chip" disabled={!canUndo} onClick={onUndo} title="Undo (Cmd+Z)">↺</button>
        <button className="toolbar-chip" disabled={!canRedo} onClick={onRedo} title="Redo (Cmd+Shift+Z)">↻</button>
      </div>

      <div className="bottom-bar-sep" />

      <div className="bottom-bar-group">
        <button className="toolbar-chip" onClick={onZoomOut} title="Zoom out">−</button>
        <span className="status-pill bottom-zoom-pill">{Math.round(zoom * 100)}%</span>
        <button className="toolbar-chip" onClick={onZoomIn} title="Zoom in">+</button>
        <button className="toolbar-chip" onClick={onResetZoom}>100%</button>
        <button className="toolbar-chip" onClick={onFitToView}>Frame</button>
        <button
          className={`toolbar-chip ${snapToGrid ? 'active-chip' : ''}`}
          aria-pressed={snapToGrid}
          onClick={onToggleSnap}
        >
          Snap
        </button>
      </div>

      <div className="bottom-bar-sep" />

      <div className="bottom-bar-group">
        <button
          className={`toolbar-chip ${redactionOpen ? 'active-chip' : ''}`}
          aria-pressed={redactionOpen}
          onClick={onToggleRedaction}
          title="Redaction lab"
        >
          Redact
        </button>
      </div>
    </div>
  );
}
