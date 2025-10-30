import React, { useState } from 'react';
import { LayoutDashboard, Factory, Package, TrendingDown, FileText, Settings, LogOut, Menu, X } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onLogout, userEmail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', active: true },
    { id: 'factories', icon: Factory, label: 'Fábricas' },
    { id: 'sacks', icon: Package, label: 'Sacos' },
    { id: 'losses', icon: TrendingDown, label: 'Pérdidas' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  const handleItemClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false); // Cerrar menú en mobile después de seleccionar
  };

  return (
    <>
      {/* Botón hamburguesa para mobile */}
      <button
        className="btn btn-brown d-lg-none position-fixed"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          bottom: '20px',
          right: '20px',
          zIndex: 1050,
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          boxShadow: '0 4px 12px rgba(139, 69, 19, 0.3)'
        }}
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-lg-none"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar unificado */}
      <div
        className={`bg-white border-end ${isOpen ? 'd-block' : 'd-none d-lg-block'}`}
        style={{
          width: '260px',
          minHeight: '100vh',
          position: isOpen ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          zIndex: 1045,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          overflowY: 'auto'
        }}
      >
        <div className="p-3">
          {/* Logo en mobile */}
          <div className="d-lg-none mb-4 text-center">
            <img
              src="/assets/logo.png"
              alt="Logo"
              style={{
                height: '50px',
                backgroundColor: 'rgba(255,255,255,0.9)',
                padding: '8px',
                borderRadius: '8px'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          {/* Info de usuario en mobile */}
          <div className="d-lg-none mb-3 pb-3 border-bottom">
            <div className="d-flex align-items-center">
              <div className="rounded-circle bg-gradient-brown text-white d-flex align-items-center justify-content-center me-2"
                   style={{ width: '40px', height: '40px' }}>
                <span className="fw-bold">{userEmail?.[0]?.toUpperCase() || 'A'}</span>
              </div>
              <div className="flex-grow-1">
                <div className="fw-medium text-dark" style={{ fontSize: '0.9rem' }}>
                  {userEmail || 'Admin'}
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Administrador
                </div>
              </div>
            </div>
          </div>

          <h6 className="text-uppercase text-muted fw-bold mb-3" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
            Navegación
          </h6>
          <ul className="nav flex-column">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li className="nav-item mb-1" key={item.id}>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }}
                    className={`nav-link d-flex align-items-center rounded ${
                      isActive 
                        ? 'bg-gradient-brown text-white' 
                        : 'text-dark hover-bg-light'
                    }`}
                    style={{ 
                      padding: '0.75rem 1rem',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Icon size={18} className="me-3" />
                    <span className="fw-medium">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Botón de cerrar sesión (visible siempre en mobile, en desktop en el navbar) */}
          {onLogout && (
            <div className="d-lg-none mt-4 pt-3 border-top">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="btn btn-outline-brown w-100 d-flex align-items-center justify-content-center"
              >
                <LogOut size={18} className="me-2" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
