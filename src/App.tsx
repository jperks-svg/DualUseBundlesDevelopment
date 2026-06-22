import React, { Suspense, lazy } from 'react';
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

const CustomerWorkspacePage = lazy(() => import('./routes/CustomerWorkspacePage'));
const CoverageImpactPage = lazy(() => import('./routes/CoverageImpactPage'));
const ReportPage = lazy(() => import('./routes/ReportPage'));

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {error: Error | null}> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) return (
      <div style={{ padding: 40, color: '#ef4444' }}>
        <h3>Something went wrong</h3>
        <pre style={{ fontSize: 12, marginTop: 8 }}>{this.state.error.message}</pre>
      </div>
    );
    return this.props.children;
  }
}

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
          <Route path="/workspace" element={<ErrorBoundary><Suspense fallback={<div style={{padding:20}}>Loading...</div>}><CustomerWorkspacePage /></Suspense></ErrorBoundary>} />
          <Route path="/impact" element={<ErrorBoundary><Suspense fallback={<div style={{padding:20}}>Loading...</div>}><CoverageImpactPage /></Suspense></ErrorBoundary>} />
          <Route path="/report" element={<ErrorBoundary><Suspense fallback={<div style={{padding:20}}>Loading...</div>}><ReportPage /></Suspense></ErrorBoundary>} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
