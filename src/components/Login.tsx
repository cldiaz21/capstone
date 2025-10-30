import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al iniciar sesión';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex">
      {/* Lado izquierdo - Imagen de fondo */}
      <div 
        className="d-none d-md-flex col-md-7 col-lg-8 position-relative"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=2070&auto=format&fit=crop)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div 
          className="position-absolute w-100 h-100"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.85) 0%, rgba(92, 46, 10, 0.9) 100%)'
          }}
        >
          <div className="d-flex flex-column justify-content-center align-items-center h-100 text-white p-5">
            <div className="mb-4">
              <img 
                src="/assets/logo.png" 
                alt="Logo" 
                style={{ 
                  height: '120px',
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  padding: '20px',
                  borderRadius: '15px',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))'
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
            <h1 className="display-4 fw-bold text-center mb-3">Control de Pérdidas</h1>
            <p className="lead text-center mb-4" style={{ maxWidth: '500px' }}>
              Sistema de monitoreo y análisis de pérdidas en fábricas
            </p>
            <div className="text-center" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
              <p className="mb-1">✓ Dashboard en tiempo real</p>
              <p className="mb-1">✓ Análisis predictivo</p>
              <p className="mb-0">✓ Reportes detallados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Lado derecho - Formulario de login */}
      <div className="col-12 col-md-5 col-lg-4 d-flex align-items-center justify-content-center bg-white">
        <div className="w-100 px-4 py-5" style={{ maxWidth: '400px' }}>
          {/* Logo para mobile */}
          <div className="text-center mb-4 d-md-none">
            <img 
              src="/assets/logo.png" 
              alt="Logo" 
              style={{ 
                height: '70px',
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                padding: '12px',
                borderRadius: '12px'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>

          <div className="mb-4">
            <h2 className="fw-bold mb-2" style={{ color: '#8B4513' }}>Bienvenido</h2>
            <p className="text-muted">Inicia sesión para acceder al dashboard</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
              <AlertCircle size={20} className="me-2" />
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label htmlFor="email" className="form-label fw-medium">
                Correo Electrónico
              </label>
              <input
                type="email"
                className="form-control form-control-lg"
                id="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label htmlFor="password" className="form-label fw-medium">
                Contraseña
              </label>
              <input
                type="password"
                className="form-control form-control-lg"
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-lg w-100 text-white"
              style={{ backgroundColor: '#8B4513' }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn size={20} className="me-2" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <small className="text-muted">
              ¿Necesitas una cuenta? Contacta al administrador
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
