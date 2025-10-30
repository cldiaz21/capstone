import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import NavbarSB from './components/NavbarSB';
import SidebarSB from './components/SidebarSB';
import DashboardContent from './components/DashboardContent';
import Login from './components/Login';
import AdminCreateUser from './components/AdminCreateUser';
import './sb-admin-theme.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aplicar estilos de SB Admin 2 al body
    document.body.style.backgroundColor = '#F8F9FA';
    document.body.style.fontFamily = '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    return () => {
      document.body.style.backgroundColor = '';
      document.body.style.fontFamily = '';
    };
  }, []);

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
    <>
      <SidebarSB 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        userEmail={session.user?.email}
      />
      <main className="main-content position-relative border-radius-lg" style={{ marginLeft: '14rem' }}>
        <NavbarSB onLogout={handleLogout} userEmail={session.user?.email} />
        <div className="container-fluid py-4">
          {activeTab === 'dashboard' && <DashboardContent />}
          {activeTab === 'factories' && (
            <>
              <h1 className="h3 fw-bold mb-4">Fábricas</h1>
              <p className="text-muted">Contenido de fábricas en desarrollo...</p>
            </>
          )}
          {activeTab === 'sacks' && (
            <>
              <h1 className="h3 fw-bold mb-4">Sacos</h1>
              <p className="text-muted">Contenido de sacos en desarrollo...</p>
            </>
          )}
          {activeTab === 'losses' && (
            <>
              <h1 className="h3 fw-bold mb-4">Pérdidas</h1>
              <p className="text-muted">Análisis detallado de pérdidas en desarrollo...</p>
            </>
          )}
          {activeTab === 'reports' && (
            <>
              <h1 className="h3 fw-bold mb-4">Reportes</h1>
              <p className="text-muted">Sistema de reportes en desarrollo...</p>
            </>
          )}
          {activeTab === 'settings' && (
            <>
              <h1 className="h3 fw-bold mb-4">Configuración</h1>
              <AdminCreateUser />
            </>
          )}
        </div>
      </main>
    </>
  );
}

export default App;

