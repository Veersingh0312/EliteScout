import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PredictionPage from './pages/PredictionPage';
import PlayerAnalysisPage from './pages/PlayerAnalysisPage';
import ModelMetricsPage from './pages/ModelMetricsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="predict" element={<PredictionPage />} />
          <Route path="analysis" element={<PlayerAnalysisPage />} />
          <Route path="metrics" element={<ModelMetricsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
