import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardContent from './components/DashboardContent';
import AdminCreateUser from './components/AdminCreateUser';
import './argon-theme.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    // Aplicar clases al body
    document.body.classList.add('g-sidenav-show');
    document.body.style.backgroundColor = '#ffffff';
    
    return () => {
      document.body.classList.remove('g-sidenav-show');
      document.body.style.backgroundColor = '';
    };
  }, []);

  return (
    <>
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
      />
      <main className="main-content position-relative border-radius-lg">
        <Navbar />
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

