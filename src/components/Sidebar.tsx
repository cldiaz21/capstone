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
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="btn btn-brown d-xl-none position-fixed"
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
        aria-label="Toggle navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="d-xl-none position-fixed top-0 start-0 w-100 h-100"
          style={{
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1040
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Argon Style */}
      <aside
        className={`sidenav bg-white navbar navbar-vertical navbar-expand-xs border-0 border-radius-xl my-3 fixed-start ms-4 ${
          isOpen ? '' : 'd-none d-xl-block'
        }`}
        id="sidenav-main"
        style={{
          zIndex: isOpen ? 1045 : 1020
        }}
      >
        <div className="sidenav-header">
          <i
            className="fas fa-times p-3 cursor-pointer text-secondary opacity-5 position-absolute end-0 top-0 d-none d-xl-none"
            aria-hidden="true"
            id="iconSidenav"
            onClick={() => setIsOpen(false)}
          ></i>
          <a className="navbar-brand m-0" href="#">
            <img
              src="/assets/logo.png"
              width="26px"
              height="26px"
              className="navbar-brand-img h-100"
              alt="Logo"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <span className="ms-1 font-weight-bold">Comercial Marisol</span>
          </a>
        </div>
        <hr className="horizontal dark mt-0" />
        <div className="collapse navbar-collapse w-auto" id="sidenav-collapse-main">
          <ul className="navbar-nav">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <li className="nav-item" key={item.id}>
                  <a
                    className={`nav-link ${isActive ? 'active' : ''}`}
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      handleItemClick(item.id);
                    }}
                  >
                    <div className="icon icon-shape icon-sm border-radius-md text-center me-2 d-flex align-items-center justify-content-center">
                      <Icon size={14} className={isActive ? 'text-white' : 'text-dark'} style={{ opacity: 0.9 }} />
                    </div>
                    <span className="nav-link-text ms-1">{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
        
        {/* Sidenav Footer */}
        <div className="sidenav-footer mx-3">
          <div className="card card-plain shadow-none" id="sidenavCard">
            <div className="card-body text-center p-3 w-100 pt-0">
              <div className="docs-info">
                <h6 className="mb-1">{userEmail}</h6>
                <p className="text-xs font-weight-bold mb-0">Administrador</p>
              </div>
            </div>
          </div>
          {onLogout && (
            <button
              className="btn btn-outline-brown btn-sm w-100 mb-3"
              onClick={() => {
                onLogout();
                setIsOpen(false);
              }}
            >
              <LogOut size={14} className="me-1" />
              Cerrar Sesión
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
