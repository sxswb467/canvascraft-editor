type EditorToolbarProps = {
  zoom: number;
  snapToGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
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
};

export function EditorToolbar({
  zoom,
  snapToGrid,
  canUndo,
  canRedo,
  hasSelection,
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
}: EditorToolbarProps) {
  return (
    <section className="editor-toolbar card">
      <div className="toolbar-section toolbar-section-lead">
        <span className="toolbar-label">Insert</span>
        <p className="toolbar-note">Compose the slide with a few deliberate blocks, not a pile of widgets.</p>
        <div className="toolbar-group">
          <button className="toolbar-chip" onClick={onAddText}>Text</button>
          <button className="toolbar-chip" onClick={onAddCallout}>Callout</button>
          <button className="toolbar-chip" onClick={onAddSticky}>Sticky note</button>
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Edit</span>
        <div className="toolbar-group">
          <button className="toolbar-chip" disabled={!hasSelection} onClick={onDuplicate}>Duplicate</button>
          <button className="toolbar-chip" disabled={!hasSelection} onClick={onDelete}>Delete</button>
          <button className="toolbar-chip" disabled={!canUndo} onClick={onUndo}>Undo</button>
          <button className="toolbar-chip" disabled={!canRedo} onClick={onRedo}>Redo</button>
        </div>
      </div>

      <div className="toolbar-section toolbar-section-compact">
        <span className="toolbar-label">Viewport</span>
        <div className="toolbar-group">
          <button className="toolbar-chip" onClick={onZoomOut}>-</button>
          <span className="status-pill">{Math.round(zoom * 100)}%</span>
          <button className="toolbar-chip" onClick={onZoomIn}>+</button>
          <button className="toolbar-chip" onClick={onResetZoom}>100%</button>
          <button className="toolbar-chip" onClick={onFitToView}>Frame</button>
          <button className={`toolbar-chip ${snapToGrid ? 'active-chip' : ''}`} aria-pressed={snapToGrid} onClick={onToggleSnap}>
            Snap
          </button>
        </div>
      </div>
    </section>
  );
}
