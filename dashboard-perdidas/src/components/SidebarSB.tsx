import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Scale,
  Factory, 
  Package,
  TrendingDown,
  FileText,
  Users,
  LogOut
} from 'lucide-react';

interface SidebarSBProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userEmail?: string;
  isOpen?: boolean;
}

const SidebarSB: React.FC<SidebarSBProps> = ({ activeTab, setActiveTab, onLogout, userEmail, isOpen = false }) => {
  const [isSidebarToggled, setIsSidebarToggled] = useState(false);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'pesaje', icon: Scale, label: 'Pesaje en Vivo', dividerAfter: true },
    { id: 'factories', icon: Factory, label: 'Fábricas' },
    { id: 'sacks', icon: Package, label: 'Sacos' },
    { id: 'losses', icon: TrendingDown, label: 'Pérdidas', dividerAfter: true },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'settings', icon: Users, label: 'Administración' },
  ];

  const toggleSidebar = () => {
    setIsSidebarToggled(!isSidebarToggled);
  };

  return (
    <ul 
      className={`navbar-nav sidebar sidebar-dark accordion sidebar-sb ${isSidebarToggled ? 'toggled' : ''} ${isOpen ? 'show' : ''}`} 
      id="accordionSidebar"
      style={{
        background: 'linear-gradient(180deg, #8B4513 10%, #6B3410 100%)',
        width: '14rem',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 1020
      }}
    >
      {/* Sidebar - Brand */}
      <a className="sidebar-brand d-flex align-items-center justify-content-center" href="#" style={{ textDecoration: 'none', padding: '1.5rem 1rem', color: '#fff', flexDirection: 'column', gap: '0.5rem' }}>
        <div className="sidebar-brand-icon">
          <img 
            src="/assets/logo.png" 
            alt="Comercial Marisol" 
            className="sidebar-logo"
            style={{
              width: '60px',
              height: '60px',
              objectFit: 'contain',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              padding: '8px'
            }}
          />
        </div>
        <div className="sidebar-brand-text mx-3" style={{ fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05rem', textAlign: 'center' }}>
          Comercial Marisol
        </div>
      </a>

      {/* Divider */}
      <hr className="sidebar-divider my-0" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', margin: '0 1rem 1rem' }} />

      {/* Navigation Items */}
      {menuItems.map((item) => (
        <React.Fragment key={item.id}>
          <li className={`nav-item ${activeTab === item.id ? 'active' : ''}`}>
            <a
              className="nav-link"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
              }}
              style={{
                padding: '1rem',
                color: activeTab === item.id ? '#fff' : 'rgba(255, 255, 255, 0.8)',
                fontWeight: activeTab === item.id ? 700 : 400,
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.color = '#fff';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                }
              }}
            >
              <item.icon 
                size={16} 
                style={{ 
                  marginRight: '0.5rem',
                  color: activeTab === item.id ? '#fff' : 'rgba(255, 255, 255, 0.3)'
                }} 
              />
              <span style={{ fontSize: '0.85rem' }}>{item.label}</span>
            </a>
          </li>
          {item.dividerAfter && (
            <hr className="sidebar-divider" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', margin: '0 1rem 1rem' }} />
          )}
        </React.Fragment>
      ))}

      {/* Divider */}
      <hr className="sidebar-divider d-none d-md-block" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.15)', margin: '0 1rem 1rem' }} />

      {/* Sidebar Toggler */}
      <div className="text-center d-none d-md-inline" style={{ marginBottom: '1rem' }}>
        <button 
          className="rounded-circle border-0" 
          id="sidebarToggle"
          onClick={toggleSidebar}
          style={{
            width: '2.5rem',
            height: '2.5rem',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '1rem',
            fontWeight: 900
          }}>
            {isSidebarToggled ? '›' : '‹'}
          </span>
        </button>
      </div>

      {/* User info y logout */}
      {userEmail && (
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.15)',
          marginTop: 'auto'
        }}>
          <div style={{ 
            fontSize: '0.75rem', 
            color: 'rgba(255, 255, 255, 0.6)',
            marginBottom: '0.5rem',
            textAlign: 'center'
          }}>
            {userEmail}
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '0.25rem',
                color: '#fff',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <LogOut size={14} style={{ marginRight: '0.5rem' }} />
              Cerrar Sesión
            </button>
          )}
        </div>
      )}
    </ul>
  );
};

export default SidebarSB;
