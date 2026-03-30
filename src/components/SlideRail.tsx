import { DndContext, PointerSensor, closestCenter, type DragEndEvent, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Slide } from '../types';

type SlideRailProps = {
  slides: Slide[];
  activeSlideId: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onAddSlide: () => void;
  onSelectSlide: (slideId: string) => void;
  onReorderSlides: (event: DragEndEvent) => void;
};

export function SlideRail({
  slides,
  activeSlideId,
  collapsed,
  onToggleCollapsed,
  onAddSlide,
  onSelectSlide,
  onReorderSlides,
}: SlideRailProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  return (
    <aside className={`sidebar card ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div>
          <p className="sidebar-label">Slides</p>
          {!collapsed ? <h2>{slides.length} frames</h2> : null}
        </div>
        <button
          className="icon-button"
          aria-label={collapsed ? 'Expand slide list' : 'Collapse slide list'}
          aria-pressed={collapsed}
          onClick={onToggleCollapsed}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <button className="primary-button sidebar-add" aria-label="Add slide" onClick={onAddSlide}>
        {collapsed ? '+' : 'Add slide'}
      </button>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onReorderSlides}>
        <SortableContext items={slides.map((slide) => slide.id)} strategy={verticalListSortingStrategy}>
          <div className="slide-list">
            {slides.map((slide, index) => (
              <SlideCard
                key={slide.id}
                slide={slide}
                index={index}
                collapsed={collapsed}
                active={slide.id === activeSlideId}
                onSelect={() => onSelectSlide(slide.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </aside>
  );
}

function SlideCard({
  slide,
  index,
  collapsed,
  active,
  onSelect,
}: {
  slide: Slide;
  index: number;
  collapsed: boolean;
  active: boolean;
  onSelect: () => void;
}) {
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
            {slide.objects
              .slice()
              .sort((left, right) => left.zIndex - right.zIndex)
              .slice(0, 3)
              .map((item) => (
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
