import { useEffect } from 'react';
import { createInitialEditorState, serializeEditorState } from '../editor/editorState';
import type { EditorState, PersistedEditorState } from '../types';

const STORAGE_KEY = 'canvascraft-editor-state-v5';

export const loadPersistedEditorState = (): EditorState => {
  if (typeof window === 'undefined') return createInitialEditorState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialEditorState();
    const parsed = JSON.parse(raw) as PersistedEditorState;
    return createInitialEditorState(parsed);
  } catch {
    return createInitialEditorState();
  }
};

export function useEditorPersistence(state: EditorState) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeEditorState(state)));
  }, [state]);
}
