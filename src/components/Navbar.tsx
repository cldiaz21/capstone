import React from 'react';
import { Search, Bell, User, LogOut } from 'lucide-react';

interface NavbarProps {
  onLogout?: () => void;
  userEmail?: string;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout, userEmail }) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-gradient-brown position-sticky top-0" style={{ zIndex: 1000 }}>
      <div className="container-fluid px-4">
        <a className="navbar-brand d-flex align-items-center" href="#">
          <img 
            src="/assets/logo.png" 
            alt="Logo Comercial Marisol" 
            height="60" 
            className="me-2"
            style={{ 
              filter: 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.8))',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              padding: '8px',
              borderRadius: '8px'
            }}
            onError={(e) => {
              // Fallback to SVG if PNG doesn't exist
              const target = e.target as HTMLImageElement;
              target.src = '/assets/logo.svg';
              target.onerror = () => {
                // Hide if neither exists
                target.style.display = 'none';
              };
            }}
          />
        </a>
        
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <form className="d-flex mx-auto" style={{ maxWidth: '400px', width: '100%' }}>
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <Search size={18} className="text-muted" />
              </span>
              <input 
                className="form-control border-start-0" 
                type="search" 
                placeholder="Buscar fábrica, código..." 
              />
            </div>
          </form>
          
          <ul className="navbar-nav ms-auto">
            <li className="nav-item dropdown">
              <a 
                className="nav-link position-relative" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
              >
                <Bell size={20} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  3
                </span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">Nueva alerta de pérdida</a></li>
                <li><a className="dropdown-item" href="#">Saco flagged</a></li>
                <li><a className="dropdown-item" href="#">Reporte mensual disponible</a></li>
              </ul>
            </li>
            
            <li className="nav-item dropdown">
              <a 
                className="nav-link d-flex align-items-center" 
                href="#" 
                role="button" 
                data-bs-toggle="dropdown"
              >
                <div className="rounded-circle bg-white text-brown d-flex align-items-center justify-content-center" 
                     style={{ width: '32px', height: '32px' }}>
                  <User size={18} />
                </div>
                <span className="ms-2 d-none d-lg-inline">{userEmail || 'Admin'}</span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><h6 className="dropdown-header">{userEmail || 'admin@example.com'}</h6></li>
                <li><hr className="dropdown-divider" /></li>
                {onLogout && (
                  <li>
                    <button 
                      className="dropdown-item d-flex align-items-center" 
                      onClick={onLogout}
                      style={{ cursor: 'pointer' }}
                    >
                      <LogOut size={16} className="me-2" />
                      Cerrar sesión
                    </button>
                  </li>
                )}
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
