import React from 'react';
import { Search, Bell, User } from 'lucide-react';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-main navbar-expand-lg px-0 mx-4 shadow-none border-radius-xl" id="navbarBlur" data-scroll="false">
      <div className="container-fluid py-1 px-3">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb bg-transparent mb-0 pb-0 pt-1 px-0 me-sm-6 me-5">
            <li className="breadcrumb-item text-sm">
              <a className="opacity-5 text-dark" href="#">Dashboard</a>
            </li>
            <li className="breadcrumb-item text-sm text-dark active" aria-current="page">
              Control de Pérdidas
            </li>
          </ol>
          <h6 className="font-weight-bolder mb-0">Dashboard</h6>
        </nav>
        <div className="collapse navbar-collapse mt-sm-0 mt-2 me-md-0 me-sm-4" id="navbar">
          <div className="ms-md-auto pe-md-3 d-flex align-items-center">
            <div className="input-group">
              <span className="input-group-text text-body">
                <Search size={16} />
              </span>
              <input type="text" className="form-control" placeholder="Buscar..." />
            </div>
          </div>
          <ul className="navbar-nav justify-content-end">
            <li className="nav-item dropdown pe-2 d-flex align-items-center">
              <a 
                href="#" 
                className="nav-link text-body p-0 position-relative" 
                id="dropdownMenuButton" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                <Bell size={16} />
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                  3
                </span>
              </a>
              <ul className="dropdown-menu dropdown-menu-end px-2 py-3 me-sm-n4" aria-labelledby="dropdownMenuButton">
                <li className="mb-2">
                  <a className="dropdown-item border-radius-md" href="#">
                    <div className="d-flex py-1">
                      <div className="my-auto">
                        <div className="h6 text-sm font-weight-normal mb-1">
                          <span className="font-weight-bold">Nueva alerta</span> de pérdida
                        </div>
                        <p className="text-xs text-secondary mb-0">
                          <i className="fa fa-clock me-1"></i>
                          Hace 13 minutos
                        </p>
                      </div>
                    </div>
                  </a>
                </li>
              </ul>
            </li>
            <li className="nav-item d-flex align-items-center">
              <a 
                href="#" 
                className="nav-link text-body font-weight-bold px-0 d-flex align-items-center"
              >
                <User size={16} className="me-sm-1" />
                <span className="d-sm-inline d-none">Admin</span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
