import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Plus, Edit, Trash2, AlertCircle, Check, X } from 'lucide-react';

interface Usuario {
  id: string;
  email: string;
  rol: 'admin' | 'supervisor' | 'operador' | 'visualizador';
  activo: boolean;
  nombre_completo?: string;
  fecha_creacion: string;
}

const AdministracionUsuarios: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rol: 'operador' as Usuario['rol'],
    nombre_completo: '',
    activo: true
  });

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error de Supabase:', error);
        throw new Error(`Error cargando usuarios: ${error.message}`);
      }
      
      setUsuarios(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido al cargar usuarios';
      setError(errorMessage);
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Actualizar usuario existente
        const { error } = await supabase
          .from('usuarios')
          .update({
            rol: formData.rol,
            nombre_completo: formData.nombre_completo,
            activo: formData.activo
          })
          .eq('id', editingUser.id);

        if (error) throw error;
      } else {
        // Crear nuevo usuario
        const { error: signUpError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (signUpError) throw signUpError;

        // Insertar en tabla usuarios
        const { error: insertError } = await supabase
          .from('usuarios')
          .insert({
            email: formData.email,
            rol: formData.rol,
            nombre_completo: formData.nombre_completo,
            activo: formData.activo
          });

        if (insertError) throw insertError;
      }

      // Limpiar form y recargar
      setFormData({
        email: '',
        password: '',
        rol: 'operador',
        nombre_completo: '',
        activo: true
      });
      setShowModal(false);
      setEditingUser(null);
      cargarUsuarios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error guardando usuario:', err);
    }
  };

  const handleEdit = (usuario: Usuario) => {
    setEditingUser(usuario);
    setFormData({
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      nombre_completo: usuario.nombre_completo || '',
      activo: usuario.activo
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;

    try {
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      cargarUsuarios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error eliminando usuario:', err);
    }
  };

  const toggleActivo = async (usuario: Usuario) => {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: !usuario.activo })
        .eq('id', usuario.id);

      if (error) throw error;
      cargarUsuarios();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error actualizando estado:', err);
    }
  };

  const getRolBadgeColor = (rol: Usuario['rol']) => {
    switch (rol) {
      case 'admin': return 'bg-danger';
      case 'supervisor': return 'bg-warning';
      case 'operador': return 'bg-info';
      case 'visualizador': return 'bg-secondary';
      default: return 'bg-secondary';
    }
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <Users size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#4E73DF' }} />
          Administración de Usuarios
        </h1>
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingUser(null);
            setFormData({
              email: '',
              password: '',
              rol: 'operador',
              nombre_completo: '',
              activo: true
            });
            setShowModal(true);
          }}
        >
          <Plus size={18} className="me-2" />
          Nuevo Usuario
        </button>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          <AlertCircle size={20} className="me-2" />
          {error}
          <button type="button" className="btn-close" onClick={() => setError(null)}></button>
        </div>
      )}

      {/* Tabla de Usuarios */}
      <div className="card shadow mb-4">
        <div className="card-header py-3" style={{ backgroundColor: '#4E73DF', color: 'white' }}>
          <h6 className="m-0 font-weight-bold">
            Lista de Usuarios ({usuarios.length} registros)
          </h6>
        </div>
        <div className="card-body">
          {usuarios.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No hay usuarios registrados
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Nombre</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Fecha Creación</th>
                    <th className="text-end">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <strong>{usuario.email}</strong>
                      </td>
                      <td>{usuario.nombre_completo || '-'}</td>
                      <td>
                        <span className={`badge ${getRolBadgeColor(usuario.rol)}`}>
                          {usuario.rol.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button
                          className={`btn btn-sm ${usuario.activo ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => toggleActivo(usuario)}
                        >
                          {usuario.activo ? <Check size={14} /> : <X size={14} />}
                          {usuario.activo ? ' Activo' : ' Inactivo'}
                        </button>
                      </td>
                      <td>{new Date(usuario.fecha_creacion).toLocaleDateString('es-CL')}</td>
                      <td className="text-end">
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => handleEdit(usuario)}
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(usuario.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      required
                      disabled={!!editingUser}
                    />
                  </div>

                  {!editingUser && (
                    <div className="mb-3">
                      <label className="form-label">Contraseña</label>
                      <input
                        type="password"
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        minLength={6}
                      />
                      <small className="text-muted">Mínimo 6 caracteres</small>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label">Nombre Completo</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nombre_completo}
                      onChange={(e) => setFormData({...formData, nombre_completo: e.target.value})}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Rol</label>
                    <select
                      className="form-select"
                      value={formData.rol}
                      onChange={(e) => setFormData({...formData, rol: e.target.value as Usuario['rol']})}
                      required
                    >
                      <option value="visualizador">Visualizador</option>
                      <option value="operador">Operador</option>
                      <option value="supervisor">Supervisor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      checked={formData.activo}
                      onChange={(e) => setFormData({...formData, activo: e.target.checked})}
                      id="checkActivo"
                    />
                    <label className="form-check-label" htmlFor="checkActivo">
                      Usuario activo
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingUser ? 'Actualizar' : 'Crear Usuario'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdministracionUsuarios;
