import React from 'react';
import { Search, Bell, User } from 'lucide-react';

interface NavbarSBProps {
  onLogout?: () => void;
  userEmail?: string;
}

const NavbarSB: React.FC<NavbarSBProps> = ({ userEmail }) => {
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
        {/* Sidebar Toggle (Topbar) */}
        <button 
          id="sidebarToggleTop" 
          className="btn btn-link d-md-none rounded-circle mr-3"
          style={{
            height: '2.5rem',
            width: '2.5rem',
            color: '#6C757D'
          }}
          onClick={() => {
            const sidebar = document.getElementById('accordionSidebar');
            if (sidebar) {
              sidebar.classList.toggle('toggled');
            }
          }}
        >
          <i className="fa fa-bars"></i>
        </button>

        {/* Page Heading */}
        <h1 className="h3 mb-0 text-gray-800" style={{ fontWeight: 700, color: '#5A5C69' }}>
          Control de Pérdidas
        </h1>

        {/* Topbar Navbar */}
        <ul className="navbar-nav ml-auto" style={{ display: 'flex', alignItems: 'center', listStyle: 'none', margin: 0 }}>
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
                3
              </span>
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
              <a 
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
                    backgroundColor: '#F6C23E',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    <i className="fas fa-exclamation-triangle"></i>
                  </div>
                </div>
                <div>
                  <div className="small text-gray-500">12 de Diciembre, 2024</div>
                  <span style={{ fontWeight: 700 }}>Nueva pérdida registrada</span> en Fábrica Norte
                </div>
              </a>
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
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default NavbarSB;
