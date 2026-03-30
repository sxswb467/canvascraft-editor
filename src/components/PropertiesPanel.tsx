import type { OverlayItem } from '../types';

type PropertiesPanelProps = {
  selectedObject: OverlayItem | null;
  onPatchObject: (patch: Partial<OverlayItem>) => void;
  onBringForward: () => void;
  onSendBackward: () => void;
};

export function PropertiesPanel({
  selectedObject,
  onPatchObject,
  onBringForward,
  onSendBackward,
}: PropertiesPanelProps) {
  return (
    <section className="card inspector-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Selection</p>
          <h2>Properties</h2>
        </div>
        <span className="status-pill">{selectedObject ? selectedObject.kind : 'Nothing selected'}</span>
      </div>

      {selectedObject ? (
        <>
          <div className="inspector-feature">
            <p className="eyebrow">Active block</p>
            <h3>{selectedObject.kind}</h3>
            <p>Fine-tune the block’s footprint and reading order before you return to layout.</p>
          </div>
          <div className="inspector-grid">
            <label>
              Width
              <input
                type="number"
                value={Math.round(selectedObject.width)}
                onChange={(event) => onPatchObject({ width: Number(event.target.value) })}
              />
            </label>
            <label>
              Height
              <input
                type="number"
                value={Math.round(selectedObject.height)}
                onChange={(event) => onPatchObject({ height: Number(event.target.value) })}
              />
            </label>
            <label>
              X
              <input
                type="number"
                value={Math.round(selectedObject.x)}
                onChange={(event) => onPatchObject({ x: Number(event.target.value) })}
              />
            </label>
            <label>
              Y
              <input
                type="number"
                value={Math.round(selectedObject.y)}
                onChange={(event) => onPatchObject({ y: Number(event.target.value) })}
              />
            </label>
            <label className="inspector-span">
              Accent color
              <input
                type="color"
                value={selectedObject.color}
                onChange={(event) => onPatchObject({ color: event.target.value })}
              />
            </label>
            <div className="inspector-actions inspector-span">
              <button className="toolbar-chip" onClick={onSendBackward}>Send backward</button>
              <button className="toolbar-chip" onClick={onBringForward}>Bring forward</button>
            </div>
            <div className="inspector-shortcuts inspector-span">
              <strong>Keyboard</strong>
              <p>`Delete` removes, `Cmd/Ctrl + D` duplicates, arrows nudge, `Shift + arrows` moves faster.</p>
            </div>
          </div>
        </>
      ) : (
        <div className="inspector-empty">
          <p>Select an object to adjust its size, position, color, and layer order.</p>
        </div>
      )}
    </section>
  );
}
