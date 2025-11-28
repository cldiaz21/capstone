import React, { useState, useEffect } from 'react';
import { Factory, Package, TrendingDown, AlertCircle, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface FabricaEstadistica {
  id: number;
  nombre: string;
  codigo: string;
  total_pedidos: number;
  total_recibidos: number;
  total_sacos: number;
  perdida_total: number;
  promedio_ratio: number;
  num_ordenes: number;
}

const FabricasNuevo: React.FC = () => {
  const [fabricas, setFabricas] = useState<FabricaEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      
      // Consulta directa con agregaciones
      const { data: pedidosData, error: pedidosError } = await supabase
        .from('pedidos')
        .select('fabrica_id, cantidad_pedidos, cantidad_recibidos, cantidad_sacos, fabricas(id, nombre, codigo)');

      if (pedidosError) throw pedidosError;

      // Agrupar por fábrica
      const fabricasMap = new Map<number, FabricaEstadistica>();

      pedidosData?.forEach((pedido: any) => {
        const fabricaId = pedido.fabrica_id;
        const fabrica = pedido.fabricas;

        if (!fabrica || Array.isArray(fabrica)) return;

        if (!fabricasMap.has(fabricaId)) {
          fabricasMap.set(fabricaId, {
            id: fabrica.id,
            nombre: fabrica.nombre,
            codigo: fabrica.codigo,
            total_pedidos: 0,
            total_recibidos: 0,
            total_sacos: 0,
            perdida_total: 0,
            promedio_ratio: 0,
            num_ordenes: 0
          });
        }

        const stats = fabricasMap.get(fabricaId)!;
        stats.total_pedidos += pedido.cantidad_pedidos;
        stats.total_recibidos += pedido.cantidad_recibidos;
        stats.total_sacos += pedido.cantidad_sacos;
        stats.perdida_total += (pedido.cantidad_pedidos - pedido.cantidad_recibidos);
        stats.num_ordenes++;
      });

      // Calcular promedios y convertir a array
      const fabricasArray = Array.from(fabricasMap.values()).map(f => ({
        ...f,
        promedio_ratio: f.total_pedidos > 0 
          ? ((f.perdida_total / f.total_pedidos) * 100) 
          : 0
      })).sort((a, b) => b.perdida_total - a.perdida_total);

      setFabricas(fabricasArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando estadísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  const fabricasFiltradas = fabricas.filter(f => 
    f.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.codigo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // KPIs
  const totalPedidos = fabricasFiltradas.reduce((sum, f) => sum + f.total_pedidos, 0);
  const totalRecibidos = fabricasFiltradas.reduce((sum, f) => sum + f.total_recibidos, 0);
  const totalPerdidas = fabricasFiltradas.reduce((sum, f) => sum + f.perdida_total, 0);
  const promedioPerdidasPct = totalPedidos > 0 
    ? ((totalPerdidas / totalPedidos) * 100).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando estadísticas de fábricas...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <Factory size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#F6C23E' }} />
          Estadísticas de Fábricas
        </h1>
      </div>

      {/* Buscador */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="input-group">
            <span className="input-group-text">
              <Search size={18} />
            </span>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #F6C23E' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#F6C23E' }}>
                    Total Fábricas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {fabricasFiltradas.length}
                  </div>
                </div>
                <div className="col-auto">
                  <Factory size={32} style={{ color: 'rgba(246, 194, 62, 0.2)' }} />
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
                    Total Recibidos
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalRecibidos.toLocaleString()}
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
                    % Pérdida Promedio
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {promedioPerdidasPct}%
                  </div>
                  <div className="text-xs text-danger mt-1">
                    {totalPerdidas.toLocaleString()} unidades
                  </div>
                </div>
                <div className="col-auto">
                  <TrendingDown size={32} style={{ color: 'rgba(231, 74, 59, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Fábricas */}
      <div className="card shadow mb-4">
        <div className="card-header py-3" style={{ backgroundColor: '#F6C23E', color: 'white' }}>
          <h6 className="m-0 font-weight-bold">
            Listado de Fábricas ({fabricasFiltradas.length} registros)
          </h6>
        </div>
        <div className="card-body">
          {fabricasFiltradas.length === 0 ? (
            <div className="text-center py-4 text-muted">
              No hay fábricas que coincidan con la búsqueda
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th className="text-end">Pedidos</th>
                    <th className="text-end">Recibidos</th>
                    <th className="text-end">Sacos</th>
                    <th className="text-end">Pérdidas</th>
                    <th className="text-end">Ratio %</th>
                    <th className="text-end">Órdenes</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {fabricasFiltradas.map((fabrica, index) => {
                    const estado = fabrica.promedio_ratio > 5 ? 'CRÍTICO' : 
                                  fabrica.promedio_ratio > 2 ? 'ADVERTENCIA' : 'OK';
                    
                    return (
                      <tr key={fabrica.id}>
                        <td>{index + 1}</td>
                        <td>
                          <Factory size={14} className="me-2" style={{ color: '#F6C23E' }} />
                          <strong>{fabrica.nombre}</strong>
                        </td>
                        <td>
                          <span className="badge bg-secondary">{fabrica.codigo || 'N/A'}</span>
                        </td>
                        <td className="text-end">{fabrica.total_pedidos.toLocaleString()}</td>
                        <td className="text-end">
                          <span className="text-success">
                            {fabrica.total_recibidos.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className="text-primary">
                            {fabrica.total_sacos.toLocaleString()}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`badge ${fabrica.perdida_total > 0 ? 'bg-danger' : 'bg-success'}`}>
                            {fabrica.perdida_total > 0 ? '-' : '+'}{Math.abs(fabrica.perdida_total).toLocaleString()}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`badge ${
                            fabrica.promedio_ratio > 5 ? 'bg-danger' : 
                            fabrica.promedio_ratio > 2 ? 'bg-warning' : 
                            'bg-success'
                          }`}>
                            {fabrica.promedio_ratio.toFixed(2)}%
                          </span>
                        </td>
                        <td className="text-end">
                          <span className="text-muted">{fabrica.num_ordenes}</span>
                        </td>
                        <td>
                          {estado === 'CRÍTICO' ? (
                            <span className="badge bg-danger">
                              <AlertCircle size={12} className="me-1" />
                              Crítico
                            </span>
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
    </div>
  );
};

export default FabricasNuevo;
