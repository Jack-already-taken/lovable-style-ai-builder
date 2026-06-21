import { RedirectToSignIn, Show } from '@clerk/react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Header } from './components/Header';
import { BuilderPage } from './pages/BuilderPage';
import { HistoryPage } from './pages/HistoryPage';
import { LandingPage } from './pages/LandingPage';
import { PricingPage } from './pages/PricingPage';

function Protected({ children }: { children: ReactNode }) {
  return <Show when="signed-in" fallback={<RedirectToSignIn />}>{children}</Show>;
}

export default function App() {
  return (
    <div className="app-shell">
      <Header />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/app" element={<Protected><BuilderPage /></Protected>} />
        <Route path="/app/:projectId" element={<Protected><BuilderPage /></Protected>} />
        <Route path="/history" element={<Protected><HistoryPage /></Protected>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
