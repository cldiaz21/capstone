import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserPlus, AlertCircle, CheckCircle } from 'lucide-react';

const AdminCreateUser: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Nota: Esta funcionalidad requiere permisos de servicio en Supabase
      // Para crear usuarios desde el cliente, necesitas configurar Edge Functions
      const { error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (error) throw error;

      setSuccess(`Usuario ${email} creado exitosamente`);
      setEmail('');
      setPassword('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear usuario';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="card-header bg-white border-0 py-3">
        <h5 className="card-title mb-0 fw-bold">
          <UserPlus size={20} className="me-2 text-brown" />
          Crear Nuevo Usuario
        </h5>
        <p className="text-muted small mb-0">Solo administradores pueden crear cuentas</p>
      </div>
      <div className="card-body">
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-3" role="alert">
            <AlertCircle size={20} className="me-2" />
            <div>{error}</div>
          </div>
        )}

        {success && (
          <div className="alert alert-success d-flex align-items-center mb-3" role="alert">
            <CheckCircle size={20} className="me-2" />
            <div>{success}</div>
          </div>
        )}

        <form onSubmit={handleCreateUser}>
          <div className="mb-3">
            <label htmlFor="newEmail" className="form-label fw-medium">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="form-control"
              id="newEmail"
              placeholder="usuario@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="newPassword" className="form-label fw-medium">
              Contraseña Temporal
            </label>
            <input
              type="password"
              className="form-control"
              id="newPassword"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <small className="text-muted">El usuario podrá cambiarla después del primer login</small>
          </div>

          <button
            type="submit"
            className="btn btn-brown"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creando usuario...
              </>
            ) : (
              <>
                <UserPlus size={18} className="me-2" />
                Crear Usuario
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminCreateUser;
