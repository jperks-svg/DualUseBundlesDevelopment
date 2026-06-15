import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AppShell from './components/AppShell';
import HomePage from './routes/HomePage';
import SourceDetailPage from './routes/SourceDetailPage';
import FieldMatrixPage from './routes/FieldMatrixPage';
import DetectionLibraryPage from './routes/DetectionLibraryPage';
import ExportPage from './routes/ExportPage';
import SettingsPage from './routes/SettingsPage';
import CostSimulatorPage from './routes/CostSimulatorPage';
import CorrelationStoriesPage from './routes/CorrelationStoriesPage';
import CoverageHeatmapPage from './routes/CoverageHeatmapPage';

export default function App() {
  return (
    <BrowserRouter basename={window.CRIBL_BASE_PATH ?? '/'}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="/source/:sourceId" element={<SourceDetailPage />} />
          <Route path="/fields" element={<FieldMatrixPage />} />
          <Route path="/detections" element={<DetectionLibraryPage />} />
          <Route path="/cost" element={<CostSimulatorPage />} />
          <Route path="/stories" element={<CorrelationStoriesPage />} />
          <Route path="/coverage" element={<CoverageHeatmapPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
