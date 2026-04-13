import { Link, useNavigate } from 'react-router-dom';
import type { Slide } from '../types';

type EditorNavProps = {
  slides: Slide[];
  activeSlideId: string;
  drawerOpen: boolean;
  onToggleDrawer: () => void;
  onAddSlide: () => void;
};

export function EditorNav({ slides, activeSlideId, drawerOpen, onToggleDrawer, onAddSlide }: EditorNavProps) {
  const navigate = useNavigate();
  const activeIndex = slides.findIndex((s) => s.id === activeSlideId);
  const prevSlide = activeIndex > 0 ? slides[activeIndex - 1] : null;
  const nextSlide = activeIndex < slides.length - 1 ? slides[activeIndex + 1] : null;

  const goToPrev = () => prevSlide && navigate(`/edit/${prevSlide.id}`);
  const goToNext = () => nextSlide && navigate(`/edit/${nextSlide.id}`);

  return (
    <nav className="editor-nav">
      <div className="editor-nav-section editor-nav-left">
        <Link to="/" className="nav-back-link">
          ← Gallery
        </Link>
        <span className="nav-divider" />
        <span className="nav-app-name">CanvasCraft Editor</span>
      </div>

      <div className="editor-nav-section editor-nav-center">
        <button
          className="icon-button nav-arrow"
          disabled={!prevSlide}
          onClick={goToPrev}
          aria-label="Previous slide"
          title={prevSlide ? prevSlide.title : undefined}
        >
          ‹
        </button>
        <span className="nav-slide-label">
          <span className="nav-slide-index">
            {String(activeIndex + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
          </span>
          <span className="nav-slide-title">{slides[activeIndex]?.title ?? ''}</span>
        </span>
        <button
          className="icon-button nav-arrow"
          disabled={!nextSlide}
          onClick={goToNext}
          aria-label="Next slide"
          title={nextSlide ? nextSlide.title : undefined}
        >
          ›
        </button>
      </div>

      <div className="editor-nav-section editor-nav-right">
        <button className="ghost-button" onClick={onAddSlide}>
          + Slide
        </button>
        <button
          className={`primary-button ${drawerOpen ? 'active-nav-btn' : ''}`}
          aria-pressed={drawerOpen}
          onClick={onToggleDrawer}
        >
          {drawerOpen ? 'Close panel' : 'Properties ✦'}
        </button>
      </div>
    </nav>
  );
}
