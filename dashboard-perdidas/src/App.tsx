import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Session } from '@supabase/supabase-js';
import { LanguageProvider } from './contexts/LanguageContext';
import CardNav from './components/CardNav';
import DashboardContentNuevo from './components/DashboardContentNuevo';
import PesajeTiempoReal from './components/PesajeTiempoReal';
import Fabricas2 from './components/Fabricas2';
import SacosNuevo from './components/SacosNuevo';
import DashboardPerdidasNuevo from './components/DashboardPerdidasNuevo';
import Reportes from './components/Reportes';
import AdministracionUsuarios from './components/AdministracionUsuarios';
import Login from './components/Login';
import logo from '/assets/logo.png';
import './sb-admin-theme.css';
import './responsive.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Aplicar estilos corporativos al body
    document.body.style.background = 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)';
    document.body.style.backgroundAttachment = 'fixed';
    document.body.style.fontFamily = '"Nunito", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
    
    return () => {
      document.body.style.background = '';
      document.body.style.backgroundAttachment = '';
      document.body.style.fontFamily = '';
    };
  }, []);

  useEffect(() => {
    // Verificar sesión actual
    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) {
          console.error('Error obteniendo sesión:', error);
          // Si hay error de red/CORS, limpiar sesión local
          if (error.message?.includes('Failed to fetch') ||
              error.message?.includes('NetworkError') ||
              error.message?.includes('CORS')) {
            localStorage.removeItem('supabase.auth.token');
            setSession(null);
          }
        } else {
          setSession(session);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error de conexión:', err);
        // Limpiar sesión si hay error de red
        localStorage.clear();
        setSession(null);
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

  const navItems = [
    {
      label: 'Panel',
      bgColor: 'linear-gradient(135deg, #1a1a1a 0%, #000000 100%)',
      textColor: '#fff',
      links: [
        { label: 'Dashboard', ariaLabel: 'Ver Dashboard', onClick: () => setActiveTab('dashboard') },
        { label: 'Pérdidas', ariaLabel: 'Ver Pérdidas', onClick: () => setActiveTab('losses') }
      ]
    },
    {
      label: 'Gestión',
      bgColor: 'linear-gradient(135deg, #2d2d2d 0%, #1a1a1a 100%)',
      textColor: '#fff',
      links: [
        { label: 'Fábricas', ariaLabel: 'Gestionar Fábricas', onClick: () => setActiveTab('factories') },
        { label: 'Sacos', ariaLabel: 'Gestionar Sacos', onClick: () => setActiveTab('sacks') },
        { label: 'Pesaje', ariaLabel: 'Pesaje Tiempo Real', onClick: () => setActiveTab('pesaje') }
      ]
    },
    {
      label: 'Reportes',
      bgColor: 'linear-gradient(135deg, #3d3d3d 0%, #2d2d2d 100%)',
      textColor: '#fff',
      links: [
        { label: 'Generar Reporte', ariaLabel: 'Generar Reportes', onClick: () => setActiveTab('reports') },
        { label: 'Administración', ariaLabel: 'Administrar Usuarios', onClick: () => setActiveTab('settings') },
        { label: 'Cerrar Sesión', ariaLabel: 'Cerrar Sesión', onClick: handleLogout }
      ]
    }
  ];

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
    <div style={{ minHeight: '100vh', paddingTop: '75px' }}>
      <CardNav
        logo={logo}
        logoAlt="Control Pérdidas"
        logoText="Control Pérdidas"
        items={navItems}
        baseColor="transparent"
        buttonBgColor="#ffffff"
        buttonTextColor="#000000"
        onEditProfile={() => setShowEditProfile(true)}
        notificationCount={3}
        onNotificationClick={() => setShowNotifications(!showNotifications)}
      />

      {/* Modal Editar Perfil */}
      {showEditProfile && (
        <div 
          className="modal show d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowEditProfile(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Editar Perfil</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditProfile(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input 
                    type="email" 
                    className="form-control" 
                    value={session.user?.email || ''} 
                    disabled 
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nombre Completo</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Ingresa tu nombre" 
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfile(false)}>
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary">
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notificaciones Dropdown */}
      {showNotifications && (
        <div 
          style={{
            position: 'fixed',
            top: '80px',
            right: '5%',
            width: '320px',
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 998,
            maxHeight: '400px',
            overflow: 'auto'
          }}
        >
          <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h6 style={{ margin: 0, fontWeight: 700, color: '#ffffff' }}>Notificaciones</h6>
          </div>
          <div style={{ padding: '0.5rem' }}>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <strong style={{ color: '#ffffff' }}>Nueva pérdida registrada</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#cccccc' }}>
                Fábrica XYZ - 15 unidades
              </p>
            </div>
            <div style={{ padding: '0.75rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <strong style={{ color: '#ffffff' }}>Pedido completado</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#cccccc' }}>
                Pedido #12345 procesado
              </p>
            </div>
            <div style={{ padding: '0.75rem' }}>
              <strong style={{ color: '#ffffff' }}>Nuevo usuario registrado</strong>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#cccccc' }}>
                usuario@ejemplo.com se unió al sistema
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        {activeTab === 'dashboard' && <DashboardContentNuevo />}
        {activeTab === 'pesaje' && <PesajeTiempoReal />}
        {activeTab === 'factories' && <Fabricas2 />}
        {activeTab === 'sacks' && <SacosNuevo />}
        {activeTab === 'losses' && <DashboardPerdidasNuevo />}
        {activeTab === 'reports' && <Reportes />}
        {activeTab === 'settings' && <AdministracionUsuarios />}
      </div>
    </div>
  );
}

// Wrap with LanguageProvider
function AppWithProvider() {
  return (
    <LanguageProvider>
      <App />
    </LanguageProvider>
  );
}

export default AppWithProvider;

