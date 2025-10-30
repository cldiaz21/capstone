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
    <div className="min-vh-100 d-flex align-items-center justify-content-center" 
         style={{ background: 'linear-gradient(135deg, #8B4513 0%, #5C2E0A 100%)' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-lg border-0">
              <div className="card-body p-5">
                {/* Logo y título */}
                <div className="text-center mb-4">
                  <div className="mb-3">
                    <img 
                      src="/logo.png" 
                      alt="Logo" 
                      style={{ 
                        height: '80px',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '10px',
                        borderRadius: '10px',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <h2 className="fw-bold" style={{ color: '#8B4513' }}>Control de Pérdidas</h2>
                  <p className="text-muted">Inicia sesión para acceder al dashboard</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center" role="alert">
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
        </div>
      </div>
    </div>
  );
};

export default Login;
