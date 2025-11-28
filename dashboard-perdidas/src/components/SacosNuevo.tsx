import React, { useState, useEffect } from 'react';
import { Package, Search, Download, Calendar, AlertCircle, Factory } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Pedido {
  id: number;
  codigo: string;
  fecha_llegada: string;
  cantidad_pedidos: number;
  cantidad_recibidos: number;
  cantidad_sacos: number;
  ratio_rp: number;
  tipo_lista: string;
  fabricas: {
    nombre: string;
  };
}

const SacosNuevo: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  const cargarPedidos = React.useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('pedidos')
        .select('*, fabricas(nombre)')
        .gt('cantidad_sacos', 0) // Solo pedidos con sacos
        .order('fecha_llegada', { ascending: false });

      if (filtroTipo !== 'todos') {
        query = query.eq('tipo_lista', filtroTipo);
      }

      if (fechaInicio) {
        query = query.gte('fecha_llegada', fechaInicio);
      }

      if (fechaFin) {
        query = query.lte('fecha_llegada', fechaFin);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando pedidos:', err);
    } finally {
      setLoading(false);
    }
  }, [filtroTipo, fechaInicio, fechaFin]);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  const pedidosFiltrados = pedidos.filter(pedido => {
    const matchSearch = 
      pedido.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pedido.fabricas?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Calcular estadísticas
  const totalSacos = pedidosFiltrados.reduce((sum, p) => sum + p.cantidad_sacos, 0);
  const totalPedidos = pedidosFiltrados.reduce((sum, p) => sum + p.cantidad_pedidos, 0);
  const totalRecibidos = pedidosFiltrados.reduce((sum, p) => sum + p.cantidad_recibidos, 0);
  const totalPerdidas = totalPedidos - totalRecibidos;
  const promedioSacosPorPedido = pedidosFiltrados.length > 0 
    ? (totalSacos / pedidosFiltrados.length).toFixed(1) 
    : '0';

  const tiposUnicos = [...new Set(pedidos.map(p => p.tipo_lista))];

  const exportarCSV = () => {
    const headers = ['Código', 'Fábrica', 'Fecha', 'Pedidos', 'Recibidos', 'Sacos', 'Ratio R/P', 'Tipo'];
    const rows = pedidosFiltrados.map(p => [
      p.codigo,
      p.fabricas?.nombre || '',
      p.fecha_llegada,
      p.cantidad_pedidos,
      p.cantidad_recibidos,
      p.cantidad_sacos,
      p.ratio_rp.toFixed(2),
      p.tipo_lista
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sacos_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando datos de sacos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <AlertCircle size={20} className="me-2" />
          Error al cargar datos: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap">
        <h1 className="h3 mb-0 text-gray-800">
          <Package size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#8B4513' }} />
          Control de Sacos
        </h1>
        <button 
          className="btn btn-success btn-block-mobile"
          onClick={exportarCSV}
        >
          <Download size={18} className="me-2" />
          Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label small">Buscar</label>
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Código o fábrica..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Tipo</label>
              <select 
                className="form-select"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                {tiposUnicos.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <label className="form-label small">Fecha Inicio</label>
              <input 
                type="date" 
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small">Fecha Fin</label>
              <input 
                type="date" 
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setSearchTerm('');
                  setFiltroTipo('todos');
                  setFechaInicio('');
                  setFechaFin('');
                }}
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #8B4513' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#8B4513' }}>
                    Total Sacos
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalSacos.toLocaleString()}
                  </div>
                </div>
                <div className="col-auto">
                  <Package size={32} style={{ color: 'rgba(139, 69, 19, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #4E73DF' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#4E73DF' }}>
                    Total Pedidos
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalPedidos.toLocaleString()}
                  </div>
                </div>
                <div className="col-auto">
                  <Package size={32} style={{ color: 'rgba(78, 115, 223, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #1CC88A' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#1CC88A' }}>
                    Promedio Sacos/Pedido
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {promedioSacosPorPedido}
                  </div>
                </div>
                <div className="col-auto">
                  <Package size={32} style={{ color: 'rgba(28, 200, 138, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #E74A3B' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1 text-danger">
                    Pérdidas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalPerdidas.toLocaleString()}
                  </div>
                </div>
                <div className="col-auto">
                  <AlertCircle size={32} style={{ color: 'rgba(231, 74, 59, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Sacos/Pedidos */}
      <div className="card shadow mb-4">
        <div className="card-header py-3" style={{ backgroundColor: '#8B4513', color: 'white' }}>
          <h6 className="m-0 font-weight-bold">
            Detalle de Sacos por Pedido ({pedidosFiltrados.length} registros)
          </h6>
        </div>
        <div className="card-body">
          {pedidosFiltrados.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No hay datos disponibles para los filtros seleccionados
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Fábrica</th>
                    <th>Fecha</th>
                    <th className="text-end">Pedidos</th>
                    <th className="text-end">Recibidos</th>
                    <th className="text-end">Sacos</th>
                    <th className="text-end">Diferencia</th>
                    <th className="text-end">Ratio %</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidosFiltrados.map((pedido) => {
                    const diferencia = pedido.cantidad_pedidos - pedido.cantidad_recibidos;
                    const estado = pedido.ratio_rp > 5 ? 'CRÍTICO' : 
                                  pedido.ratio_rp > 2 ? 'ADVERTENCIA' : 'OK';
                    
                    return (
                      <tr key={pedido.id}>
                        <td>
                          <strong>{pedido.codigo || 'N/A'}</strong>
                        </td>
                        <td>
                          <Factory size={14} className="me-2" style={{ color: '#8B4513' }} />
                          {pedido.fabricas?.nombre || 'Sin nombre'}
                        </td>
                        <td>
                          <Calendar size={14} className="me-2" style={{ color: '#6C757D' }} />
                          {new Date(pedido.fecha_llegada).toLocaleDateString('es-CL')}
                        </td>
                        <td className="text-end">{pedido.cantidad_pedidos.toLocaleString()}</td>
                        <td className="text-end">
                          <span className={diferencia > 0 ? 'text-warning' : 'text-success'}>
                            {pedido.cantidad_recibidos.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-end">
                          <strong className="text-primary">
                            {pedido.cantidad_sacos.toLocaleString()}
                          </strong>
                        </td>
                        <td className="text-end">
                          <span className={`badge ${diferencia > 0 ? 'bg-danger' : 'bg-success'}`}>
                            {diferencia > 0 ? '-' : '+'}{Math.abs(diferencia)}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`badge ${
                            pedido.ratio_rp > 5 ? 'bg-danger' : 
                            pedido.ratio_rp > 2 ? 'bg-warning' : 
                            'bg-success'
                          }`}>
                            {pedido.ratio_rp.toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {pedido.tipo_lista}
                          </span>
                        </td>
                        <td>
                          {estado === 'CRÍTICO' ? (
                            <span className="badge bg-danger">Crítico</span>
                          ) : estado === 'ADVERTENCIA' ? (
                            <span className="badge bg-warning">Advertencia</span>
                          ) : (
                            <span className="badge bg-success">OK</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Resumen por Tipo */}
      <div className="card shadow mb-4" style={{ borderLeft: '4px solid #36B9CC' }}>
        <div className="card-body">
          <h5 className="card-title text-info">Resumen por Tipo de Lista</h5>
          <div className="row text-center mt-3">
            {tiposUnicos.map(tipo => {
              const pedidosTipo = pedidosFiltrados.filter(p => p.tipo_lista === tipo);
              const totalSacosTipo = pedidosTipo.reduce((sum, p) => sum + p.cantidad_sacos, 0);
              
              return (
                <div key={tipo} className="col-md-4 mb-3">
                  <div className="border rounded p-3">
                    <h6 className="text-muted">{tipo}</h6>
                    <h3 className="text-primary">{totalSacosTipo.toLocaleString()}</h3>
                    <p className="text-muted mb-0 small">{pedidosTipo.length} pedidos</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SacosNuevo;
