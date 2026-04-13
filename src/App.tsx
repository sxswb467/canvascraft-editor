import { HashRouter, Routes, Route } from 'react-router-dom';
import { EditorProvider } from './context/EditorContext';
import { DashboardPage } from './pages/DashboardPage';
import { EditorPage } from './pages/EditorPage';

export function App() {
  return (
    <EditorProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/edit/:slideId" element={<EditorPage />} />
        </Routes>
      </HashRouter>
    </EditorProvider>
  );
}
