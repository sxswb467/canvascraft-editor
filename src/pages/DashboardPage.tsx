import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEditorContext } from '../context/EditorContext';
import { uid } from '../editor/editorState';
import type { Slide } from '../types';

export function DashboardPage() {
  const { editorState, dispatch } = useEditorContext();
  const navigate = useNavigate();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { slides } = editorState.present;

  const handleAddSlide = () => {
    const newSlideId = `slide-${uid()}`;
    dispatch({ type: 'add-slide', slideId: newSlideId });
    navigate(`/edit/${newSlideId}`);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) return;
    dispatch({ type: 'reorder-slides', activeId: String(event.active.id), overId: String(event.over.id) });
  };

  const handleDelete = (slideId: string) => {
    dispatch({ type: 'delete-slide', slideId });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-brand">
          <p className="eyebrow">Portfolio demo · complex editor UI</p>
          <h1 className="dashboard-title">CanvasCraft Editor</h1>
          <p className="dashboard-lead">
            A layout-first editing surface for sequencing slides, shaping copy blocks, and testing
            motion between structure and story.
          </p>
          <div className="dashboard-meta">
            <span className="status-pill">Saved locally</span>
            <span className="status-pill">History on</span>
            <span className="status-pill">Grid aware</span>
          </div>
        </div>
        <div className="dashboard-actions">
          <button className="primary-button dashboard-new-btn" onClick={handleAddSlide}>
            + New slide
          </button>
        </div>
      </header>

      <section className="dashboard-gallery-section">
        <div className="dashboard-gallery-header">
          <p className="sidebar-label">All slides</p>
          <span className="gallery-count">{slides.length} frames</span>
        </div>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={rectSortingStrategy}>
            <div className="slide-gallery">
              {slides.map((slide, index) => (
                <GalleryCard
                  key={slide.id}
                  slide={slide}
                  index={index}
                  canDelete={slides.length > 1}
                  onClick={() => navigate(`/edit/${slide.id}`)}
                  onDelete={() => handleDelete(slide.id)}
                />
              ))}
              <button className="gallery-add-card" onClick={handleAddSlide} aria-label="Add new slide">
                <span className="gallery-add-icon">+</span>
                <span className="gallery-add-label">New slide</span>
              </button>
            </div>
          </SortableContext>
        </DndContext>
      </section>
    </div>
  );
}

function GalleryCard({
  slide,
  index,
  canDelete,
  onClick,
  onDelete,
}: {
  slide: Slide;
  index: number;
  canDelete: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setActivatorNodeRef, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: slide.id });

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  return (
    <article
      ref={setNodeRef}
      className={`gallery-card ${isDragging ? 'gallery-card-dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {/* Thumbnail — drag activator */}
      <div
        ref={setActivatorNodeRef}
        className="gallery-thumb"
        style={{ borderTopColor: slide.accent }}
        title="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <div className="gallery-thumb-canvas">
          {slide.objects
            .slice()
            .sort((a, b) => a.zIndex - b.zIndex)
            .slice(0, 4)
            .map((item) => (
              <span
                key={item.id}
                className="gallery-thumb-item"
                style={{
                  left: `${Math.max(8, item.x / 16)}px`,
                  top: `${Math.max(8, item.y / 16)}px`,
                  width: `${Math.max(32, item.width / 9)}px`,
                  background: item.color,
                }}
              />
            ))}
        </div>
      </div>

      {/* Click-to-open footer */}
      <button
        type="button"
        className="gallery-card-select"
        onClick={onClick}
        aria-label={`Open ${slide.title}`}
      >
        <div className="gallery-card-meta">
          <span className="gallery-card-index">{String(index + 1).padStart(2, '0')}</span>
          <strong className="gallery-card-title">{slide.title}</strong>
          <span className="gallery-card-count">{slide.objects.length} overlays</span>
        </div>
      </button>

      {/* Actions menu */}
      <div ref={menuRef} className="gallery-card-menu">
        <button
          type="button"
          className="gallery-menu-trigger icon-button"
          aria-label="Slide options"
          aria-expanded={menuOpen}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
        >
          ···
        </button>
        {menuOpen && (
          <div className="gallery-menu-popover" role="menu">
            <button
              type="button"
              className="gallery-menu-item"
              role="menuitem"
              disabled={!canDelete}
              title={!canDelete ? 'Cannot delete the last slide' : undefined}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                onDelete();
              }}
            >
              <span className="gallery-menu-icon">🗑</span>
              Delete slide
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
