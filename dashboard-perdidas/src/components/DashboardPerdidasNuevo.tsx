import React, { useState, useEffect } from 'react';
import { TrendingDown, Calendar, Factory, AlertTriangle, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Pedido {
  id: number;
  codigo: string;
  fecha_llegada: string;
  cantidad_pedidos: number;
  cantidad_recibidos: number;
  ratio_rp: number;
  fabricas: {
    id: number;
    nombre: string;
  };
}

interface DatosMensuales {
  mes: string;
  perdidas: number;
  pedidos: number;
  recibidos: number;
  porcentaje: number;
}

interface DatosPorFabrica {
  fabrica: string;
  perdidas: number;
  porcentaje: number;
}

const DashboardPerdidasNuevo: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [fabricaFiltro, setFabricaFiltro] = useState<string>('todas');
  const [fabricas, setFabricas] = useState<{id: number, nombre: string}[]>([]);

  const cargarDatos = React.useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar fábricas
      const { data: fabricasData } = await supabase
        .from('fabricas')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre');
      
      if (fabricasData) setFabricas(fabricasData);

      // Cargar pedidos con filtros
      let query = supabase
        .from('pedidos')
        .select('*, fabricas(id, nombre)')
        .order('fecha_llegada', { ascending: true });

      if (fechaInicio) {
        query = query.gte('fecha_llegada', fechaInicio);
      }
      if (fechaFin) {
        query = query.lte('fecha_llegada', fechaFin);
      }
      if (fabricaFiltro !== 'todas') {
        query = query.eq('fabrica_id', parseInt(fabricaFiltro));
      }

      const { data, error } = await query;

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, [fechaInicio, fechaFin, fabricaFiltro]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Calcular datos mensuales
  const datosMensuales = React.useMemo<DatosMensuales[]>(() => {
    const monthMap = new Map<string, { pedidos: number; recibidos: number }>();

    pedidos.forEach(p => {
      const fecha = new Date(p.fecha_llegada);
      const mes = fecha.toLocaleDateString('es-CL', { month: 'short', year: '2-digit' });

      if (!monthMap.has(mes)) {
        monthMap.set(mes, { pedidos: 0, recibidos: 0 });
      }

      const data = monthMap.get(mes)!;
      data.pedidos += p.cantidad_pedidos;
      data.recibidos += p.cantidad_recibidos;
    });

    return Array.from(monthMap.entries())
      .map(([mes, data]) => ({
        mes,
        perdidas: data.pedidos - data.recibidos,
        pedidos: data.pedidos,
        recibidos: data.recibidos,
        porcentaje: data.pedidos > 0 ? ((data.pedidos - data.recibidos) / data.pedidos) * 100 : 0
      }))
      .slice(-6); // Últimos 6 meses
  }, [pedidos]);

  // Calcular datos por fábrica
  const datosPorFabrica = React.useMemo<DatosPorFabrica[]>(() => {
    const fabricaMap = new Map<string, { pedidos: number; recibidos: number }>();

    pedidos.forEach(p => {
      const nombre = p.fabricas?.nombre || 'Sin nombre';
      if (!fabricaMap.has(nombre)) {
        fabricaMap.set(nombre, { pedidos: 0, recibidos: 0 });
      }
      const data = fabricaMap.get(nombre)!;
      data.pedidos += p.cantidad_pedidos;
      data.recibidos += p.cantidad_recibidos;
    });

    return Array.from(fabricaMap.entries())
      .map(([fabrica, data]) => ({
        fabrica,
        perdidas: data.pedidos - data.recibidos,
        porcentaje: data.pedidos > 0 ? ((data.pedidos - data.recibidos) / data.pedidos) * 100 : 0
      }))
      .filter(d => d.perdidas > 0)
      .sort((a, b) => b.perdidas - a.perdidas)
      .slice(0, 10); // Top 10 fábricas
  }, [pedidos]);

  // KPIs
  const totalPedidos = pedidos.reduce((sum, p) => sum + p.cantidad_pedidos, 0);
  const totalRecibidos = pedidos.reduce((sum, p) => sum + p.cantidad_recibidos, 0);
  const totalPerdidas = totalPedidos - totalRecibidos;
  const porcentajePerdida = totalPedidos > 0 ? ((totalPerdidas / totalPedidos) * 100).toFixed(2) : '0.00';

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando análisis de pérdidas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <TrendingDown size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#E74A3B' }} />
          Análisis de Pérdidas
        </h1>
      </div>

      {/* Filtros */}
      <div className="card shadow mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label small">
                <Calendar size={16} className="me-2" />
                Fecha Inicio
              </label>
              <input 
                type="date" 
                className="form-control"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small">
                <Calendar size={16} className="me-2" />
                Fecha Fin
              </label>
              <input 
                type="date" 
                className="form-control"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small">
                <Factory size={16} className="me-2" />
                Fábrica
              </label>
              <select 
                className="form-select"
                value={fabricaFiltro}
                onChange={(e) => setFabricaFiltro(e.target.value)}
              >
                <option value="todas">Todas las fábricas</option>
                {fabricas.map(f => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3 d-flex align-items-end">
              <button 
                className="btn btn-secondary w-100"
                onClick={() => {
                  setFechaInicio('');
                  setFechaFin('');
                  setFabricaFiltro('todas');
                }}
              >
                <Filter size={16} className="me-2" />
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #E74A3B' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1 text-danger">
                    Total Pérdidas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {totalPerdidas.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    unidades
                  </div>
                </div>
                <div className="col-auto">
                  <TrendingDown size={32} style={{ color: 'rgba(231, 74, 59, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #F6C23E' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#F6C23E' }}>
                    % Pérdida
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {porcentajePerdida}%
                  </div>
                  <div className="text-xs text-muted mt-1">
                    del total
                  </div>
                </div>
                <div className="col-auto">
                  <AlertTriangle size={32} style={{ color: 'rgba(246, 194, 62, 0.2)' }} />
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
                  <div className="text-xs text-muted mt-1">
                    unidades
                  </div>
                </div>
                <div className="col-auto">
                  <TrendingDown size={32} style={{ color: 'rgba(78, 115, 223, 0.2)' }} />
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
                  <div className="text-xs text-muted mt-1">
                    unidades
                  </div>
                </div>
                <div className="col-auto">
                  <TrendingDown size={32} style={{ color: 'rgba(28, 200, 138, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="row mb-4">
        {/* Tendencia mensual */}
        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3" style={{ backgroundColor: '#E74A3B', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Tendencia de Pérdidas Mensuales</h6>
            </div>
            <div className="card-body">
              {datosMensuales.length > 0 ? (
                <div style={{ width: '100%', height: '300px', padding: '10px' }}>
                  <Line
                    data={{
                      labels: datosMensuales.map(d => d.mes),
                      datasets: [
                        {
                          label: 'Pérdidas',
                          data: datosMensuales.map(d => d.perdidas),
                          borderColor: '#E74A3B',
                          backgroundColor: 'rgba(231, 74, 59, 0.05)',
                          borderWidth: 3,
                          pointRadius: 5,
                          pointBackgroundColor: '#E74A3B',
                          tension: 0.3,
                          fill: true,
                          yAxisID: 'y',
                        },
                        {
                          label: '% Pérdida',
                          data: datosMensuales.map(d => d.porcentaje),
                          borderColor: '#F6C23E',
                          backgroundColor: 'rgba(246, 194, 62, 0.05)',
                          borderWidth: 3,
                          pointRadius: 5,
                          pointBackgroundColor: '#F6C23E',
                          tension: 0.3,
                          fill: true,
                          yAxisID: 'y1',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgb(255,255,255)',
                          bodyColor: '#858796',
                          borderColor: '#dddfeb',
                          borderWidth: 1,
                          titleColor: '#6e707e',
                        }
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Pérdidas (unidades)'
                          },
                          grid: {
                            color: 'rgb(234, 236, 244)',
                          }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: '% Pérdida'
                          },
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  No hay datos disponibles para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top fábricas con pérdidas */}
        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3" style={{ backgroundColor: '#F6C23E', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Top 10 Fábricas</h6>
            </div>
            <div className="card-body" style={{ maxHeight: '350px', overflowY: 'auto' }}>
              {datosPorFabrica.length > 0 ? (
                <div className="list-group">
                  {datosPorFabrica.map((item, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong className="small">{item.fabrica}</strong>
                        <br />
                        <span className="badge bg-danger">{item.perdidas.toLocaleString()} unidades</span>
                      </div>
                      <span className={`badge ${
                        item.porcentaje > 5 ? 'bg-danger' : 
                        item.porcentaje > 2 ? 'bg-warning' : 
                        'bg-success'
                      } rounded-pill`}>
                        {item.porcentaje.toFixed(2)}%
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de barras por fábrica */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header py-3" style={{ backgroundColor: '#4E73DF', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Pérdidas por Fábrica</h6>
            </div>
            <div className="card-body">
              {datosPorFabrica.length > 0 ? (
                <div style={{ width: '100%', height: '300px' }}>
                  <Bar
                    data={{
                      labels: datosPorFabrica.map(d => d.fabrica),
                      datasets: [{
                        label: 'Pérdidas (unidades)',
                        data: datosPorFabrica.map(d => d.perdidas),
                        backgroundColor: '#E74A3B',
                        borderColor: '#E74A3B',
                        borderWidth: 1,
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: true,
                          position: 'top',
                        },
                        tooltip: {
                          backgroundColor: 'rgb(255,255,255)',
                          bodyColor: '#858796',
                          borderColor: '#dddfeb',
                          borderWidth: 1,
                          titleColor: '#6e707e',
                          callbacks: {
                            label: function(context) {
                              return 'Pérdidas: ' + (context.parsed.y ?? 0).toLocaleString();
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return value.toLocaleString();
                            }
                          },
                          grid: {
                            color: 'rgb(234, 236, 244)',
                          }
                        },
                        x: {
                          ticks: {
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 45
                          },
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="text-center text-muted py-4">
                  No hay datos disponibles para el periodo seleccionado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPerdidasNuevo;
