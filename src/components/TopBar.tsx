type TopBarProps = {
  sidebarCollapsed: boolean;
  redactionOpen: boolean;
  aiOpen: boolean;
  onToggleSidebar: () => void;
  onToggleRedaction: () => void;
  onToggleAi: () => void;
};

export function TopBar({
  sidebarCollapsed,
  redactionOpen,
  aiOpen,
  onToggleSidebar,
  onToggleRedaction,
  onToggleAi,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <p className="eyebrow">Portfolio demo · complex editor UI</p>
        <p className="topbar-kicker">Edition 01</p>
        <h1>CanvasCraft Editor</h1>
      </div>
      <div className="topbar-lead">
        <p>
          A layout-first editing surface for sequencing slides, shaping copy blocks,
          and testing motion between structure and story.
        </p>
        <div className="topbar-meta">
          <span className="status-pill">Saved locally</span>
          <span className="status-pill">History on</span>
          <span className="status-pill">Grid aware</span>
        </div>
      </div>
      <div className="topbar-actions">
        <button className="ghost-button" aria-pressed={sidebarCollapsed} onClick={onToggleSidebar}>
          {sidebarCollapsed ? 'Expand slide list' : 'Collapse slide list'}
        </button>
        <button className="ghost-button" aria-pressed={redactionOpen} onClick={onToggleRedaction}>
          {redactionOpen ? 'Hide redaction lab' : 'Open redaction lab'}
        </button>
        <button className="primary-button" aria-pressed={aiOpen} onClick={onToggleAi}>
          {aiOpen ? 'Hide right panel' : 'Show right panel'}
        </button>
      </div>
    </header>
  );
}
