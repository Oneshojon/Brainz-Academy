import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PricingPage } from './pages/PricingPage';
import { RegisterPage } from './pages/RegisterPage';

/**
 * School Plan SPA root. Mounted once from schools/templates/schools/index.html —
 * every /school-plan/* path Django serves renders this same shell, and
 * React Router owns navigation from there.
 */
export default function App() {
  return (
    <BrowserRouter basename="/school-plan">
      <Routes>
        <Route path="/" element={<Navigate to="/pricing" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* /admin/* routes land in the next phase */}
      </Routes>
    </BrowserRouter>
  );
}