import { useEffect } from 'react';

type KeyboardShortcutsConfig = {
  hasSelection: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
  onDeselect: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onNudge: (deltaX: number, deltaY: number) => void;
};

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable
  );
};

export function useEditorKeyboardShortcuts({
  hasSelection,
  onDelete,
  onDuplicate,
  onDeselect,
  onUndo,
  onRedo,
  onNudge,
}: KeyboardShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;

      if (mod && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) onRedo();
        else onUndo();
        return;
      }

      if (isTypingTarget(event.target)) return;

      if (!hasSelection && event.key !== 'Escape') return;

      if ((event.key === 'Backspace' || event.key === 'Delete') && hasSelection) {
        event.preventDefault();
        onDelete();
        return;
      }

      if (mod && event.key.toLowerCase() === 'd' && hasSelection) {
        event.preventDefault();
        onDuplicate();
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        onDeselect();
        return;
      }

      const step = event.shiftKey ? 24 : 8;
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        onNudge(-step, 0);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        onNudge(step, 0);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        onNudge(0, -step);
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        onNudge(0, step);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasSelection, onDelete, onDuplicate, onDeselect, onUndo, onRedo, onNudge]);
}
