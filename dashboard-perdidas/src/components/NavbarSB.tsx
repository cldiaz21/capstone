import React, { useState, useEffect } from 'react';
import { Search, Bell, User, LogOut, Settings, Menu } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';

interface NavbarSBProps {
  onLogout?: () => void;
  userEmail?: string;
  onMenuClick?: () => void;
}

interface Notificacion {
  id: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  tipo: 'warning' | 'info' | 'success';
}

const NavbarSB: React.FC<NavbarSBProps> = ({ userEmail, onLogout, onMenuClick }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const { language, setLanguage } = useLanguage();

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      // Obtener pérdidas recientes solo si existen (últimos 7 días)
      const { data: perdidas, error } = await supabase
        .from('perdidas')
        .select('*, fabricas(nombre)')
        .gte('fecha', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .gt('porcentaje_perdida', 3) // Solo pérdidas significativas > 3%
        .order('fecha', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error cargando notificaciones:', error);
        return;
      }

      if (perdidas && perdidas.length > 0) {
        const notifs: Notificacion[] = perdidas.map(p => ({
          id: p.id,
          mensaje: `${p.porcentaje_perdida.toFixed(1)}% pérdida en ${p.fabricas?.nombre || 'fábrica'}`,
          fecha: new Date(p.fecha).toLocaleDateString('es-CL'),
          leida: false,
          tipo: p.porcentaje_perdida > 5 ? 'warning' : 'info'
        }));
        setNotificaciones(notifs);
      } else {
        setNotificaciones([]); // Sin notificaciones si no hay datos
      }
    } catch (error) {
      console.error('Error en cargarNotificaciones:', error);
      setNotificaciones([]);
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error && onLogout) {
      onLogout();
    }
  };

  const notificacionesNoLeidas = notificaciones.filter(n => !n.leida).length;

  return (
    <nav 
      className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top"
      style={{
        height: '4.375rem',
        boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)',
        position: 'sticky',
        top: 0,
        zIndex: 1019
      }}
    >
      <div className="container-fluid">
        {/* Sidebar Toggle (Topbar) - Móvil */}
        <button 
          id="sidebarToggleTop" 
          className="btn btn-link d-lg-none rounded-circle mr-3"
          style={{
            height: '2.5rem',
            width: '2.5rem',
            color: '#6C757D',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => {
            if (onMenuClick) {
              onMenuClick();
            }
          }}
        >
          <Menu size={20} />
        </button>

        {/* Page Heading */}
        <h1 className="h3 mb-0 text-gray-800 d-none d-md-block" style={{ fontWeight: 700, color: '#5A5C69' }}>
          Control de Pérdidas
        </h1>
        <h1 className="h5 mb-0 text-gray-800 d-md-none" style={{ fontWeight: 700, color: '#5A5C69' }}>
          Comercial Marisol
        </h1>

        {/* Topbar Navbar */}
        <ul className="navbar-nav ml-auto" style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0 }}>
          {/* Language Selector */}
          <li className="nav-item no-arrow" style={{ marginRight: '1rem' }}>
            <ul className="links-languaje" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              listStyle: 'none', 
              margin: 0, 
              padding: 0,
              height: '4.375rem'
            }}>
              <li>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setLanguage('es');
                  }}
                  className={`link-languaje ${language === 'es' ? 'active' : ''}`}
                  style={{
                    color: language === 'es' ? '#4E73DF' : '#858796',
                    textDecoration: 'none',
                    fontWeight: language === 'es' ? 700 : 400,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (language !== 'es') {
                      e.currentTarget.style.color = '#4E73DF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== 'es') {
                      e.currentTarget.style.color = '#858796';
                    }
                  }}
                >
                  ESP
                </a>
              </li>
              <li>
                <span className="separate-item-menu" style={{ color: '#D1D3E2', userSelect: 'none' }}>/</span>
              </li>
              <li>
                <a 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setLanguage('ko');
                  }}
                  className={`link-languaje ${language === 'ko' ? 'active' : ''}`}
                  style={{
                    color: language === 'ko' ? '#4E73DF' : '#858796',
                    textDecoration: 'none',
                    fontWeight: language === 'ko' ? 700 : 400,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (language !== 'ko') {
                      e.currentTarget.style.color = '#4E73DF';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (language !== 'ko') {
                      e.currentTarget.style.color = '#858796';
                    }
                  }}
                >
                  한국어
                </a>
              </li>
            </ul>
          </li>

          {/* Nav Item - Search Dropdown (Visible Only XS) */}
          <li className="nav-item dropdown no-arrow d-sm-none" style={{ marginRight: '1rem' }}>
            <a 
              className="nav-link dropdown-toggle" 
              href="#" 
              style={{
                height: '4.375rem',
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                color: '#6C757D',
                textDecoration: 'none'
              }}
            >
              <Search size={16} />
            </a>
          </li>

          {/* Nav Item - Alerts */}
          <li className="nav-item dropdown no-arrow mx-1" style={{ position: 'relative' }}>
            <a 
              className="nav-link dropdown-toggle" 
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                height: '4.375rem',
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                color: '#6C757D',
                textDecoration: 'none',
                position: 'relative'
              }}
            >
              <Bell size={16} />
              {/* Counter - Alerts */}
              {notificacionesNoLeidas > 0 && (
                <span 
                  className="badge badge-danger badge-counter"
                  style={{
                    position: 'absolute',
                    transform: 'scale(0.7)',
                    transformOrigin: 'top right',
                    right: '0.25rem',
                    top: '0.75rem',
                    backgroundColor: '#E74A3B',
                    color: '#fff',
                    borderRadius: '10rem',
                    padding: '0.25rem 0.4rem',
                    fontSize: '0.625rem',
                    fontWeight: 700
                  }}
                >
                  {notificacionesNoLeidas > 9 ? '9+' : notificacionesNoLeidas}
                </span>
              )}
            </a>
            {/* Dropdown - Alerts */}
            <div 
              className="dropdown-menu dropdown-menu-end"
              style={{
                minWidth: '20rem',
                border: 'none',
                boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
              }}
            >
              <div 
                className="dropdown-header"
                style={{
                  backgroundColor: '#8B4513',
                  borderBottom: '1px solid #8B4513',
                  padding: '0.75rem',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.65rem',
                  textTransform: 'uppercase'
                }}
              >
                Centro de Alertas
              </div>
              {notificaciones.length === 0 ? (
                <div className="text-center py-3 text-muted">
                  No hay notificaciones nuevas
                </div>
              ) : (
                notificaciones.map(notif => (
                  <a 
                    key={notif.id}
                    className="dropdown-item d-flex align-items-center" 
                    href="#"
                    style={{
                      padding: '0.75rem 1rem',
                      borderLeft: '1px solid #E9ECEF',
                      borderRight: '1px solid #E9ECEF',
                      borderBottom: '1px solid #E9ECEF',
                      textDecoration: 'none',
                      color: '#3A3B45'
                    }}
                  >
                    <div className="mr-3">
                      <div className="icon-circle" style={{
                        width: '2.5rem',
                        height: '2.5rem',
                        borderRadius: '50%',
                        backgroundColor: notif.tipo === 'warning' ? '#F6C23E' : '#36B9CC',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff'
                      }}>
                        <i className={`fas fa-${notif.tipo === 'warning' ? 'exclamation-triangle' : 'info-circle'}`}></i>
                      </div>
                    </div>
                    <div>
                      <div className="small text-gray-500">{notif.fecha}</div>
                      <span style={{ fontWeight: 700 }}>{notif.mensaje}</span>
                    </div>
                  </a>
                ))
              )}
            </div>
          </li>

          {/* Divider */}
          <div 
            className="topbar-divider d-none d-sm-block"
            style={{
              width: 0,
              borderRight: '1px solid #E3E6F0',
              height: 'calc(4.375rem - 2rem)',
              margin: 'auto 1rem'
            }}
          ></div>

          {/* Nav Item - User Information */}
          <li className="nav-item dropdown no-arrow">
            <a 
              className="nav-link dropdown-toggle" 
              href="#"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              style={{
                height: '4.375rem',
                display: 'flex',
                alignItems: 'center',
                padding: '0 0.75rem',
                color: '#6C757D',
                textDecoration: 'none'
              }}
            >
              <span className="mr-2 d-none d-lg-inline small" style={{ fontSize: '0.875rem', fontWeight: 400, color: '#6C757D' }}>
                {userEmail || 'Usuario'}
              </span>
              <div style={{
                width: '2rem',
                height: '2rem',
                borderRadius: '50%',
                backgroundColor: '#8B4513',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <User size={16} />
              </div>
            </a>
            {/* Dropdown - User Information */}
            <div 
              className="dropdown-menu dropdown-menu-end"
              style={{
                minWidth: '12rem',
                border: 'none',
                boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
              }}
            >
              <a 
                className="dropdown-item" 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  // Funcionalidad futura: ir a perfil
                }}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#3A3B45',
                  textDecoration: 'none'
                }}
              >
                <Settings size={14} className="mr-2" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                Perfil
              </a>
              <div className="dropdown-divider" style={{ margin: '0.5rem 0' }}></div>
              <a 
                className="dropdown-item" 
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleLogout();
                }}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  color: '#E74A3B',
                  textDecoration: 'none'
                }}
              >
                <LogOut size={14} className="mr-2" style={{ display: 'inline-block', marginRight: '0.5rem' }} />
                Cerrar Sesión
              </a>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavbarSB;
