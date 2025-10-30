import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardContent from './components/DashboardContent';
import Login from './components/Login';
import AdminCreateUser from './components/AdminCreateUser';
import './argon-theme.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escuchar cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Mostrar loading mientras verifica sesión
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-brown" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  // Si no hay sesión, mostrar login
  if (!session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <div className="app">
      <Navbar onLogout={handleLogout} userEmail={session.user?.email} />
      <div className="d-flex">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          onLogout={handleLogout}
          userEmail={session.user?.email}
        />
        <main className="main-content flex-grow-1" style={{ marginLeft: '0px' }}>
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'factories' && (
            <div className="container-fluid px-4 py-4">
              <h1 className="h3 fw-bold mb-4">Fábricas</h1>
              <p className="text-muted">Contenido de fábricas en desarrollo...</p>
            </div>
          )}
          {activeTab === 'sacks' && (
            <div className="container-fluid px-4 py-4">
              <h1 className="h3 fw-bold mb-4">Sacos</h1>
              <p className="text-muted">Contenido de sacos en desarrollo...</p>
            </div>
          )}
          {activeTab === 'losses' && (
            <div className="container-fluid px-4 py-4">
              <h1 className="h3 fw-bold mb-4">Pérdidas</h1>
              <p className="text-muted">Análisis detallado de pérdidas en desarrollo...</p>
            </div>
          )}
          {activeTab === 'reports' && (
            <div className="container-fluid px-4 py-4">
              <h1 className="h3 fw-bold mb-4">Reportes</h1>
              <p className="text-muted">Sistema de reportes en desarrollo...</p>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="container-fluid px-4 py-4">
              <h1 className="h3 fw-bold mb-4">Configuración</h1>
              <AdminCreateUser />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;

