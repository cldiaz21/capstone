import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import {
  TrendingDown,
  Package,
  Factory,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Activity
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
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
  cantidad_sacos: number;
  ratio_rp: number;
  tipo_lista: string;
  fabricas: {
    id: number;
    nombre: string;
  };
}

interface MonthData {
  mes: string;
  pedidos: number;
  recibidos: number;
  perdidas: number;
  ratio: number;
}

interface FactoryLoss {
  fabrica: string;
  perdida: number;
  ratio: number;
}

interface TipoDistribution {
  tipo: string;
  cantidad: number;
  porcentaje: number;
  [key: string]: string | number; // Índice para compatibilidad con Recharts
}

const DashboardContentNuevo: React.FC = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pedidos')
        .select('*, fabricas(id, nombre)')
        .order('fecha_llegada', { ascending: true });

      if (error) throw error;
      setPedidos(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  // KPIs principales
  const kpis = useMemo(() => {
    const totalPedidos = pedidos.reduce((sum, p) => sum + p.cantidad_pedidos, 0);
    const totalRecibidos = pedidos.reduce((sum, p) => sum + p.cantidad_recibidos, 0);
    const totalSacos = pedidos.reduce((sum, p) => sum + p.cantidad_sacos, 0);
    const totalPerdidas = totalPedidos - totalRecibidos;
    const promedioRatio = totalPedidos > 0 ? (totalPerdidas / totalPedidos) * 100 : 0;
    const totalFabricas = new Set(pedidos.map(p => p.fabricas?.id)).size;

    return {
      totalPedidos,
      totalRecibidos,
      totalSacos,
      totalPerdidas,
      promedioRatio: promedioRatio.toFixed(2),
      totalFabricas,
      totalRegistros: pedidos.length
    };
  }, [pedidos]);

  // Datos por mes
  const datosPorMes = useMemo<MonthData[]>(() => {
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

    const result = Array.from(monthMap.entries())
      .map(([mes, data]) => ({
        mes,
        pedidos: data.pedidos,
        recibidos: data.recibidos,
        perdidas: data.pedidos - data.recibidos,
        ratio: data.pedidos > 0 ? ((data.pedidos - data.recibidos) / data.pedidos) * 100 : 0
      }))
      .slice(-6); // Últimos 6 meses
    
    return result;
  }, [pedidos]);

  // Top 5 fábricas con más pérdidas
  const topFabricasPerdidas = useMemo<FactoryLoss[]>(() => {
    if (!pedidos || pedidos.length === 0) return [];
    
    const factoryMap = new Map<string, { pedidos: number; recibidos: number }>();

    pedidos.forEach(p => {
      const nombre = p.fabricas?.nombre || 'Sin nombre';
      if (!factoryMap.has(nombre)) {
        factoryMap.set(nombre, { pedidos: 0, recibidos: 0 });
      }
      const data = factoryMap.get(nombre)!;
      data.pedidos += p.cantidad_pedidos || 0;
      data.recibidos += p.cantidad_recibidos || 0;
    });

    const result = Array.from(factoryMap.entries())
      .map(([fabrica, data]) => ({
        fabrica,
        perdida: data.pedidos - data.recibidos,
        ratio: data.pedidos > 0 ? ((data.pedidos - data.recibidos) / data.pedidos) * 100 : 0
      }))
      .filter(item => item.perdida > 0) // Solo mostrar fábricas con pérdidas
      .sort((a, b) => b.perdida - a.perdida)
      .slice(0, 5);
    
    return result;
  }, [pedidos]);

  // Distribución por nivel de riesgo de fábricas
  const distribucionTipo = useMemo<TipoDistribution[]>(() => {
    // Calcular el ratio promedio por fábrica
    const factoryMap = new Map<string, { pedidos: number; recibidos: number; count: number }>();

    pedidos.forEach(p => {
      const nombre = p.fabricas?.nombre || 'Sin nombre';
      if (!factoryMap.has(nombre)) {
        factoryMap.set(nombre, { pedidos: 0, recibidos: 0, count: 0 });
      }
      const data = factoryMap.get(nombre)!;
      data.pedidos += p.cantidad_pedidos || 0;
      data.recibidos += p.cantidad_recibidos || 0;
      data.count += 1;
    });

    // Clasificar fábricas por nivel de riesgo
    let sinRiesgo = 0;
    let conRiesgo = 0;

    factoryMap.forEach((data) => {
      const perdida = data.pedidos - data.recibidos;
      const ratio = data.pedidos > 0 ? (perdida / data.pedidos) * 100 : 0;
      
      if (ratio > 2) {
        conRiesgo++;
      } else {
        sinRiesgo++;
      }
    });

    const result = [
      { tipo: 'Sin Riesgo', cantidad: sinRiesgo, porcentaje: ((sinRiesgo / (sinRiesgo + conRiesgo)) * 100) },
      { tipo: 'Con Riesgo', cantidad: conRiesgo, porcentaje: ((conRiesgo / (sinRiesgo + conRiesgo)) * 100) }
    ].filter(item => item.cantidad > 0);
    
    return result;
  }, [pedidos]);

  const COLORS = ['#4E73DF', '#1CC88A', '#36B9CC', '#F6C23E', '#E74A3B'];

  if (loading) {
    return (
      <div className="container-fluid">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
          <p className="mt-3 text-muted">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger" role="alert">
          <AlertTriangle size={20} className="me-2" />
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
          <Activity size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#4E73DF' }} />
          Dashboard General
        </h1>
        <div className="text-muted">
          <Calendar size={18} className="me-2" style={{ verticalAlign: 'middle' }} />
          {kpis.totalRegistros} registros cargados
        </div>
      </div>

      {/* Resumen General - Movido al inicio */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="alert alert-info" role="alert">
            <h5 className="alert-heading">
              <Activity size={20} className="me-2" />
              Resumen General
            </h5>
            <hr />
            <p className="mb-0">
              Se han procesado <strong>{kpis.totalRegistros}</strong> órdenes de <strong>{kpis.totalFabricas}</strong> fábricas diferentes.
              El total de pedidos es de <strong>{kpis.totalPedidos.toLocaleString()}</strong> unidades, 
              de las cuales se recibieron <strong>{kpis.totalRecibidos.toLocaleString()}</strong> unidades.
              La pérdida total acumulada es de <strong>{kpis.totalPerdidas.toLocaleString()}</strong> unidades, 
              lo que representa un <strong>{kpis.promedioRatio}%</strong> del total pedido.
            </p>
          </div>
        </div>
      </div>

      {/* KPIs Row 1 */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow h-100 py-2 stats-card" style={{ borderLeft: '4px solid #4E73DF' }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: '#4E73DF' }}>
                    Total Pedidos
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {kpis.totalPedidos.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {kpis.totalRegistros} órdenes
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
                    Recibidos
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {kpis.totalRecibidos.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {kpis.totalSacos.toLocaleString()} sacos
                  </div>
                </div>
                <div className="col-auto">
                  <TrendingUp size={32} style={{ color: 'rgba(28, 200, 138, 0.2)' }} />
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
                    {kpis.totalPerdidas.toLocaleString()}
                  </div>
                  <div className="text-xs text-danger mt-1">
                    -{kpis.promedioRatio}% promedio
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
                    Fábricas
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {kpis.totalFabricas}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    Activas
                  </div>
                </div>
                <div className="col-auto">
                  <Factory size={32} style={{ color: 'rgba(246, 194, 62, 0.2)' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row mb-4">
        {/* Tendencia por mes */}
        <div className="col-xl-8 col-lg-7 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3 d-flex justify-content-between align-items-center" style={{ backgroundColor: '#4E73DF', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Tendencia de Pedidos vs Recibidos</h6>
            </div>
            <div className="card-body">
              {datosPorMes.length > 0 ? (
                <div style={{ width: '100%', height: '300px', padding: '10px' }}>
                  <Line
                    data={{
                      labels: datosPorMes.map(d => d.mes),
                      datasets: [
                        {
                          label: 'Pedidos',
                          data: datosPorMes.map(d => d.pedidos),
                          borderColor: '#4E73DF',
                          backgroundColor: 'rgba(78, 115, 223, 0.05)',
                          borderWidth: 3,
                          pointRadius: 5,
                          pointBackgroundColor: '#4E73DF',
                          tension: 0.3,
                          fill: true
                        },
                        {
                          label: 'Recibidos',
                          data: datosPorMes.map(d => d.recibidos),
                          borderColor: '#1CC88A',
                          backgroundColor: 'rgba(28, 200, 138, 0.05)',
                          borderWidth: 3,
                          pointRadius: 5,
                          pointBackgroundColor: '#1CC88A',
                          tension: 0.3,
                          fill: true
                        }
                      ]
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
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: 'rgb(234, 236, 244)',
                          }
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
                  <Activity size={48} style={{ opacity: 0.3 }} />
                  <p className="mt-3">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Distribución por nivel de riesgo */}
        <div className="col-xl-4 col-lg-5 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3" style={{ backgroundColor: '#1CC88A', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Fábricas por Nivel de Riesgo</h6>
            </div>
            <div className="card-body">
              {distribucionTipo.length > 0 ? (
                <>
                  <div style={{ width: '100%', height: '250px' }}>
                    <Doughnut 
                      data={{
                        labels: distribucionTipo.map(d => d.tipo),
                        datasets: [{
                          label: 'Fábricas',
                          data: distribucionTipo.map(d => d.cantidad),
                          backgroundColor: ['#1CC88A', '#E74A3B'],
                          borderColor: '#fff',
                          borderWidth: 2,
                          hoverBorderColor: '#fff',
                          hoverOffset: 4
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '70%',
                        plugins: {
                          legend: {
                            display: false
                          },
                          tooltip: {
                            enabled: true,
                            backgroundColor: '#ffffff',
                            titleColor: '#000000',
                            bodyColor: '#000000',
                            borderColor: '#dddfeb',
                            borderWidth: 1,
                            padding: 15,
                            displayColors: true,
                            callbacks: {
                              label: function(context: any) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = (context.dataset.data as number[]).reduce((a: number, b: number) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(0);
                                return `${label}: ${value} (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    {distribucionTipo.map((item, index) => (
                      <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                        <div className="d-flex align-items-center">
                          <div 
                            style={{ 
                              width: '12px', 
                              height: '12px', 
                              backgroundColor: COLORS[index % COLORS.length],
                              borderRadius: '2px',
                              marginRight: '8px'
                            }}
                          />
                          <span className="small">{item.tipo}</span>
                        </div>
                        <span className="badge bg-secondary">{item.cantidad.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-5">No hay datos disponibles</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Fábricas con Pérdidas */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header py-3" style={{ backgroundColor: '#E74A3B', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">
                <AlertTriangle size={18} className="me-2" />
                Top 5 Fábricas con Mayores Pérdidas
              </h6>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center text-muted py-5">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                </div>
              ) : topFabricasPerdidas.length > 0 ? (
                <>
                  {/* GRÁFICO CON CHART.JS */}
                  <div style={{ width: '100%', height: '350px', padding: '20px' }}>
                    <Bar
                      data={{
                        labels: topFabricasPerdidas.map(f => f.fabrica),
                        datasets: [{
                          label: 'Pérdidas',
                          data: topFabricasPerdidas.map(f => f.perdida),
                          backgroundColor: '#E74A3B',
                          hoverBackgroundColor: '#c0392b',
                          borderColor: '#E74A3B',
                        }]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false
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
                            grid: {
                              display: false
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  
                  {/* Tabla de detalles */}
              <div className="table-responsive mt-3">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Fábrica</th>
                      <th className="text-end">Pérdidas</th>
                      <th className="text-end">Ratio %</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topFabricasPerdidas.map((factory, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <Factory size={14} className="me-2" style={{ color: '#E74A3B' }} />
                          <strong>{factory.fabrica}</strong>
                        </td>
                        <td className="text-end">{factory.perdida.toLocaleString()}</td>
                        <td className="text-end">
                          <span className={`badge ${
                            factory.ratio > 5 ? 'bg-danger' : 
                            factory.ratio > 2 ? 'bg-warning' : 
                            'bg-success'
                          }`}>
                            {factory.ratio.toFixed(2)}%
                          </span>
                        </td>
                        <td>
                          {factory.ratio > 5 ? (
                            <span className="badge bg-danger">Crítico</span>
                          ) : factory.ratio > 2 ? (
                            <span className="badge bg-warning">Advertencia</span>
                          ) : (
                            <span className="badge bg-success">Normal</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <AlertTriangle size={48} style={{ opacity: 0.3 }} />
                  <p className="mt-3">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContentNuevo;
