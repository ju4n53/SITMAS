import { useState } from 'react';
import { clearSession, getStoredSession } from './services/authService.js';
import AppLayout from './components/AppLayout.jsx';
import EmpleadoPage from './pages/EmpleadoPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import MaterialPage from './pages/MaterialPage.jsx';
import OrigenPage from './pages/OrigenPage.jsx';

export default function App() {
  const [session, setSession] = useState(() => getStoredSession());
  const [activePage, setActivePage] = useState('empleados');

  function handleLogout() {
    clearSession();
    setSession(null);
    setActivePage('empleados');
  }

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  const titles = {
    empleados: 'Gestion de Personal',
    'traz-material': 'Gestion de Material',
    'traz-origen': 'Gestion de Origen'
  };

  const pages = {
    empleados: <EmpleadoPage session={session} />,
    'traz-material': <MaterialPage />,
    'traz-origen': <OrigenPage />
  };

  return (
    <AppLayout
      session={session}
      onLogout={handleLogout}
      activePage={activePage}
      onNavigate={setActivePage}
      title={titles[activePage] || 'SITMAS'}
    >
      {pages[activePage] || pages.empleados}
    </AppLayout>
  );
}
