import React from 'react';
import { LayoutDashboard, Factory, Package, TrendingDown, FileText, Settings } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', active: true },
    { id: 'factories', icon: Factory, label: 'Fábricas' },
    { id: 'sacks', icon: Package, label: 'Sacos' },
    { id: 'losses', icon: TrendingDown, label: 'Pérdidas' },
    { id: 'reports', icon: FileText, label: 'Reportes' },
    { id: 'settings', icon: Settings, label: 'Configuración' },
  ];

  return (
    <div className="sidebar bg-white border-end" style={{ width: '260px', minHeight: '100vh' }}>
      <div className="p-3">
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
                    setActiveTab(item.id);
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
      </div>
    </div>
  );
};

export default Sidebar;
