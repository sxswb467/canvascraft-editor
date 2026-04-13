import { createContext, useContext, useReducer, type ReactNode } from 'react';
import { editorReducer, type EditorAction } from '../editor/editorState';
import { loadPersistedEditorState, useEditorPersistence } from '../hooks/useEditorPersistence';
import type { EditorState } from '../types';

type EditorContextValue = {
  editorState: EditorState;
  dispatch: React.Dispatch<EditorAction>;
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editorState, dispatch] = useReducer(editorReducer, loadPersistedEditorState());
  useEditorPersistence(editorState);
  return <EditorContext.Provider value={{ editorState, dispatch }}>{children}</EditorContext.Provider>;
}

export function useEditorContext(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error('useEditorContext must be used inside EditorProvider');
  return ctx;
}
