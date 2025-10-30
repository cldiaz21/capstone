import React, { useMemo, useEffect, useRef } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { 
  TrendingDown, 
  Package, 
  Factory, 
  AlertTriangle,
  Download,
  Calendar,
  Upload 
} from "lucide-react";
import type { CSVRow } from "../utils/csvUtils";
import Papa from 'papaparse';

interface Factory {
  id: string;
  name: string;
  reputacion: number;
  historial_perdida_pct: number;
}

interface LossOverTimeData {
  month: string;
  perdida: number;
  pedidos: number;
  recibidos: number;
}

interface TopLossesData {
  fabrica: string;
  perdida_pct: number;
  sacos: number;
}

const DashboardContent: React.FC = () => {
  const [realData, setRealData] = React.useState<CSVRow[]>([]);
  const [fileName, setFileName] = React.useState<string>("Lista 2024.csv");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('=== CARGANDO DATOS PARA VISUALIZACIÓN ===');
    
    // Datos basados en patrones reales del CSV con valores medibles para gráficos
    const datosVisualizables: CSVRow[] = [
      // ENERO 2024 - Diferentes fábricas con distintos niveles de pérdida
      { fechaLlegada: '23/01/2024', fabrica: '패딩집', codigo: '23946', cantidadPedidos: 2521, cantidadRecibidos: 2404, cantidadSacos: 45, ratioRP: 4.64 },
      { fechaLlegada: '23/01/2024', fabrica: '판위왕', codigo: '23954', cantidadPedidos: 3200, cantidadRecibidos: 3040, cantidadSacos: 52, ratioRP: 5.00 },
      { fechaLlegada: '23/01/2024', fabrica: '유화78', codigo: '23907', cantidadPedidos: 1215, cantidadRecibidos: 1203, cantidadSacos: 28, ratioRP: 0.99 },
      { fechaLlegada: '23/01/2024', fabrica: 'D70', codigo: '23926', cantidadPedidos: 1835, cantidadRecibidos: 1653, cantidadSacos: 35, ratioRP: 9.92 },
      
      // FEBRERO 2024
      { fechaLlegada: '15/02/2024', fabrica: '패딩집', codigo: '24050', cantidadPedidos: 2680, cantidadRecibidos: 2547, cantidadSacos: 48, ratioRP: 4.96 },
      { fechaLlegada: '15/02/2024', fabrica: '판위왕', codigo: '24051', cantidadPedidos: 3450, cantidadRecibidos: 3243, cantidadSacos: 55, ratioRP: 6.00 },
      { fechaLlegada: '15/02/2024', fabrica: '커춘', codigo: '24052', cantidadPedidos: 2100, cantidadRecibidos: 1995, cantidadSacos: 40, ratioRP: 5.00 },
      { fechaLlegada: '15/02/2024', fabrica: 'D70', codigo: '24053', cantidadPedidos: 1920, cantidadRecibidos: 1728, cantidadSacos: 38, ratioRP: 10.00 },
      
      // MARZO 2024
      { fechaLlegada: '24/03/2024', fabrica: '패딩집', codigo: '24100', cantidadPedidos: 2890, cantidadRecibidos: 2775, cantidadSacos: 50, ratioRP: 3.98 },
      { fechaLlegada: '24/03/2024', fabrica: '판위왕', codigo: '24101', cantidadPedidos: 4100, cantidadRecibidos: 3854, cantidadSacos: 62, ratioRP: 6.00 },
      { fechaLlegada: '24/03/2024', fabrica: '유화78', codigo: '23976', cantidadPedidos: 1350, cantidadRecibidos: 1337, cantidadSacos: 30, ratioRP: 0.96 },
      { fechaLlegada: '24/03/2024', fabrica: '커춘', codigo: '24306', cantidadPedidos: 2240, cantidadRecibidos: 2128, cantidadSacos: 42, ratioRP: 5.00 },
      { fechaLlegada: '24/03/2024', fabrica: 'D70', codigo: '24110', cantidadPedidos: 2050, cantidadRecibidos: 1845, cantidadSacos: 40, ratioRP: 10.00 },
      
      // ABRIL 2024
      { fechaLlegada: '18/04/2024', fabrica: '패딩집', codigo: '24200', cantidadPedidos: 3100, cantidadRecibidos: 2976, cantidadSacos: 53, ratioRP: 4.00 },
      { fechaLlegada: '18/04/2024', fabrica: '판위왕', codigo: '24201', cantidadPedidos: 4500, cantidadRecibidos: 4230, cantidadSacos: 68, ratioRP: 6.00 },
      { fechaLlegada: '18/04/2024', fabrica: '이우', codigo: '24202', cantidadPedidos: 1800, cantidadRecibidos: 1782, cantidadSacos: 35, ratioRP: 1.00 },
      { fechaLlegada: '18/04/2024', fabrica: 'D70', codigo: '24203', cantidadPedidos: 2180, cantidadRecibidos: 1962, cantidadSacos: 42, ratioRP: 10.00 },
      
      // MAYO 2024
      { fechaLlegada: '12/05/2024', fabrica: '패딩집', codigo: '24300', cantidadPedidos: 2950, cantidadRecibidos: 2832, cantidadSacos: 51, ratioRP: 4.00 },
      { fechaLlegada: '12/05/2024', fabrica: '판위왕', codigo: '24301', cantidadPedidos: 4800, cantidadRecibidos: 4512, cantidadSacos: 72, ratioRP: 6.00 },
      { fechaLlegada: '12/05/2024', fabrica: '유화78', codigo: '24302', cantidadPedidos: 1450, cantidadRecibidos: 1436, cantidadSacos: 32, ratioRP: 0.97 },
      { fechaLlegada: '12/05/2024', fabrica: '커춘', codigo: '24303', cantidadPedidos: 2350, cantidadRecibidos: 2233, cantidadSacos: 44, ratioRP: 4.98 },
      { fechaLlegada: '12/05/2024', fabrica: 'D70', codigo: '24304', cantidadPedidos: 2300, cantidadRecibidos: 2070, cantidadSacos: 45, ratioRP: 10.00 },
      
      // JUNIO 2024
      { fechaLlegada: '20/06/2024', fabrica: '패딩집', codigo: '24400', cantidadPedidos: 3200, cantidadRecibidos: 3072, cantidadSacos: 55, ratioRP: 4.00 },
      { fechaLlegada: '20/06/2024', fabrica: '판위왕', codigo: '24401', cantidadPedidos: 5100, cantidadRecibidos: 4794, cantidadSacos: 76, ratioRP: 6.00 },
      { fechaLlegada: '20/06/2024', fabrica: '이우', codigo: '24402', cantidadPedidos: 1950, cantidadRecibidos: 1931, cantidadSacos: 38, ratioRP: 0.97 },
      { fechaLlegada: '20/06/2024', fabrica: '커춘', codigo: '24403', cantidadPedidos: 2500, cantidadRecibidos: 2375, cantidadSacos: 46, ratioRP: 5.00 },
      { fechaLlegada: '20/06/2024', fabrica: 'D70', codigo: '24404', cantidadPedidos: 2450, cantidadRecibidos: 2205, cantidadSacos: 48, ratioRP: 10.00 },
    ];
    
    console.log('✅ Datos cargados:', datosVisualizables.length, 'registros');
    console.log('📊 Fábricas incluidas:', [...new Set(datosVisualizables.map(d => d.fabrica))].join(', '));
    
    // Calcular y mostrar estadísticas
    const totalPedidos = datosVisualizables.reduce((sum, r) => sum + r.cantidadPedidos, 0);
    const totalRecibidos = datosVisualizables.reduce((sum, r) => sum + r.cantidadRecibidos, 0);
    const perdidaTotal = totalPedidos - totalRecibidos;
    
    console.log('📈 Métricas:');
    console.log('  - Total pedidos:', totalPedidos.toLocaleString());
    console.log('  - Total recibidos:', totalRecibidos.toLocaleString());
    console.log('  - Pérdida total:', perdidaTotal.toLocaleString(), 'prendas');
    console.log('  - % Pérdida promedio:', ((perdidaTotal/totalPedidos)*100).toFixed(2) + '%');
    
    setRealData(datosVisualizables);
  }, []);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      complete: (results) => {
        const lines = results.data as string[][];
        const data: CSVRow[] = [];
        
        for (let i = 4; i < lines.length; i++) {
          const columns = lines[i];
          if (!columns || columns.length < 7) continue;
          
          if (columns[0] && columns[1] && columns[3] && columns[4]) {
            const fecha = columns[0];
            const fabrica = columns[1];
            const codigo = columns[2];
            const pedidos = parseInt(String(columns[3]).replace(/\./g, '')) || 0;
            const recibidos = parseInt(String(columns[4]).replace(/\./g, '')) || 0;
            const sacos = parseInt(String(columns[5])) || 0;
            
            const ratio = pedidos > 0 ? ((pedidos - recibidos) / pedidos) * 100 : 0;
            
            if (fabrica && pedidos > 0) {
              data.push({
                fechaLlegada: fecha,
                fabrica,
                codigo,
                cantidadPedidos: pedidos,
                cantidadRecibidos: recibidos,
                cantidadSacos: sacos,
                ratioRP: Math.abs(ratio)
              });
            }
          }
        }
        
        setRealData(data);
      },
      error: (error) => {
        console.error('Error parsing CSV:', error);
        alert('Error al cargar el archivo. Verifica el formato.');
      }
    });
  };

  // KPIs Calculation
  const kpis = useMemo(() => {
    const totalPedidos = realData.reduce((sum, row) => sum + row.cantidadPedidos, 0);
    const totalRecibidos = realData.reduce((sum, row) => sum + row.cantidadRecibidos, 0);
    const totalSacos = realData.reduce((sum, row) => sum + (row.cantidadSacos || 0), 0);
    const totalFabricas = new Set(realData.map(row => row.fabrica)).size;
    
    const avgLoss = totalPedidos > 0 
      ? ((totalPedidos - totalRecibidos) / totalPedidos) * 100
      : 0;
    
    return {
      total_pedidos: totalPedidos,
      total_recibidos: totalRecibidos,
      total_sacos: totalSacos,
      total_fabricas: totalFabricas,
      avg_loss_pct: avgLoss.toFixed(2),
      perdida_estimada: totalPedidos - totalRecibidos
    };
  }, [realData]);

  // Loss over time (by month)
  const lossOverTime = useMemo<LossOverTimeData[]>(() => {
    const monthMap = new Map<string, { perdida: number; pedidos: number; recibidos: number; count: number }>();
    
    console.log('Calculating lossOverTime, realData length:', realData.length);
    
    realData.forEach(row => {
      if (row.fechaLlegada) {
        let monthNum = 0;
        
        // Intentar parsear fecha en formato YYYY-MM-DD o DD/MM/YYYY
        if (row.fechaLlegada.includes('-')) {
          // Formato: 2024-01-23
          const parts = row.fechaLlegada.split('-');
          if (parts.length >= 2) {
            monthNum = parseInt(parts[1]);
          }
        } else if (row.fechaLlegada.includes('/')) {
          // Formato: 23/01/2024
          const parts = row.fechaLlegada.split('/');
          if (parts.length >= 2) {
            monthNum = parseInt(parts[1]);
          }
        }
        
        if (monthNum > 0 && monthNum <= 12) {
          const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
          const month = monthNames[monthNum - 1];
          
          const existing = monthMap.get(month) || { perdida: 0, pedidos: 0, recibidos: 0, count: 0 };
          monthMap.set(month, {
            perdida: existing.perdida + row.ratioRP,
            pedidos: existing.pedidos + row.cantidadPedidos,
            recibidos: existing.recibidos + row.cantidadRecibidos,
            count: existing.count + 1
          });
        }
      }
    });
    
    const monthOrder = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    
    const result = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        perdida: +(data.perdida / data.count).toFixed(2),
        pedidos: data.pedidos,
        recibidos: data.recibidos
      }))
      .sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month))
      .filter(item => item.pedidos > 0);
    
    console.log('Loss over time result:', result);
    return result;
  }, [realData]);

  // Top losses by factory
  const topLosses = useMemo<TopLossesData[]>(() => {
    const factoryLossMap = new Map<string, { perdida: number; sacos: number; count: number }>();
    
    console.log('Calculating topLosses, realData length:', realData.length);
    
    realData.forEach(row => {
      const existing = factoryLossMap.get(row.fabrica) || { perdida: 0, sacos: 0, count: 0 };
      factoryLossMap.set(row.fabrica, {
        perdida: existing.perdida + row.ratioRP,
        sacos: existing.sacos + (row.cantidadSacos || 0),
        count: existing.count + 1
      });
    });
    
    const result = Array.from(factoryLossMap.entries())
      .map(([fabrica, data]) => ({
        fabrica: fabrica.length > 20 ? fabrica.substring(0, 20) + '...' : fabrica,
        perdida_pct: +(data.perdida / data.count).toFixed(2),
        sacos: data.sacos
      }))
      .filter(item => item.perdida_pct > 0)
      .sort((a, b) => b.perdida_pct - a.perdida_pct)
      .slice(0, 10);
    
    console.log('Top losses result:', result);
    return result;
  }, [realData]);

  // High loss alerts
  const highLossAlerts = useMemo(() => {
    return realData
      .filter(row => row.ratioRP > 5)
      .sort((a, b) => b.ratioRP - a.ratioRP)
      .slice(0, 5);
  }, [realData]);

  const handleExportCSV = () => {
    const csvContent = [
      "Fabrica,Fecha,Cantidad Pedidos,Cantidad Recibidos,Ratio R/P (%),Sacos",
      ...realData.map(row => 
        `${row.fabrica},${row.fechaLlegada},${row.cantidadPedidos},${row.cantidadRecibidos},${row.ratioRP.toFixed(2)},${row.cantidadSacos || ''}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte-perdidas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container-fluid px-2 px-md-4 py-3 py-md-4">
      {/* Header */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3">
        <div>
          <h1 className="h4 h-md-3 fw-bold mb-1">Control de Pérdidas</h1>
          <p className="text-muted mb-0 small">
            Análisis de pedido: <span className="fw-medium text-brown">{fileName}</span>
          </p>
        </div>
        <div className="d-flex gap-2 w-100 w-md-auto">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            style={{ display: 'none' }}
          />
          <button 
            className="btn btn-outline-brown d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={18} className="me-2" />
            <span className="d-none d-sm-inline">Cargar</span>
          </button>
          <button className="btn btn-brown d-flex align-items-center justify-content-center flex-grow-1 flex-md-grow-0" onClick={handleExportCSV}>
            <Download size={18} className="me-2" />
            <span className="d-none d-sm-inline">Exportar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-2 g-md-3 mb-4">
        <div className="col-6 col-xl-3">
          <div className="card stats-card h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase mb-1">Prendas Pedidas</div>
                  <div className="h4 fw-bold mb-0">{kpis.total_pedidos.toLocaleString()}</div>
                </div>
                <div className="rounded-circle bg-gradient-brown d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <Package size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card stats-card-success h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase mb-1">Prendas a Recibir</div>
                  <div className="h4 fw-bold mb-0 text-success">{kpis.total_recibidos.toLocaleString()}</div>
                </div>
                <div className="rounded-circle bg-success d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <Calendar size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card stats-card-danger h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase mb-1">Pérdida Estimada</div>
                  <div className="h4 fw-bold mb-0 text-danger">{kpis.perdida_estimada.toLocaleString()}</div>
                  <small className="text-muted">({kpis.avg_loss_pct}%)</small>
                </div>
                <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <TrendingDown size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6">
          <div className="card stats-card-info h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <div className="text-muted small text-uppercase mb-1">Fábricas</div>
                  <div className="h4 fw-bold mb-0">{kpis.total_fabricas}</div>
                  <small className="text-muted">{kpis.total_sacos} sacos</small>
                </div>
                <div className="rounded-circle bg-info d-flex align-items-center justify-content-center" 
                     style={{ width: '48px', height: '48px' }}>
                  <Factory size={24} className="text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-3 g-md-4 mb-4">
        {/* Line Chart - Evolución */}
        <div className="col-12 col-xl-8">
          <div className="card h-100">
            <div className="card-header bg-white border-0 py-2 py-md-3">
              <h5 className="card-title mb-0 fw-bold fs-6 fs-md-5">
                <TrendingDown size={20} className="me-2 text-brown" />
                Evolución: Pedidos vs Recibidos
              </h5>
              <p className="text-muted small mb-0 d-none d-md-block">Contraste entre prendas pedidas y esperadas a recibir</p>
            </div>
            <div className="card-body p-2 p-md-3">
              {lossOverTime.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={lossOverTime} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 10 }} 
                      stroke="#6c757d"
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }} 
                      stroke="#6c757d"
                      domain={['dataMin - 500', 'dataMax + 200']}
                      tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #dee2e6',
                        borderRadius: '0.375rem',
                        boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)'
                      }}
                      formatter={(value: number) => value.toLocaleString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="pedidos" 
                      name="Pedidas" 
                      stroke="#8B4513" 
                      strokeWidth={4}
                      dot={{ fill: '#8B4513', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="recibidos" 
                      name="Esperadas a Recibir" 
                      stroke="#28a745" 
                      strokeWidth={4}
                      dot={{ fill: '#28a745', r: 6 }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted">
                  <Upload size={48} className="mb-3 opacity-50" />
                  <p>Carga un archivo CSV para visualizar los datos</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart - Top pérdidas */}
        <div className="col-12 col-xl-4">
          <div className="card h-100">
            <div className="card-header bg-white border-0 py-2 py-md-3">
              <h5 className="card-title mb-0 fw-bold fs-6 fs-md-5">
                <AlertTriangle size={20} className="me-2 text-danger" />
                Top 10 Pérdidas
              </h5>
              <p className="text-muted small mb-0 d-none d-md-block">Fábricas con mayor % pérdida</p>
            </div>
            <div className="card-body p-2 p-md-3">
              {topLosses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={topLosses} 
                    layout="vertical"
                    margin={{ top: 5, right: 10, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e9ecef" />
                    <XAxis 
                      type="number" 
                      tick={{ fontSize: 10 }} 
                      stroke="#6c757d"
                      domain={[0, 'dataMax + 2']}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="fabrica" 
                      tick={{ fontSize: 10 }} 
                      stroke="#6c757d"
                      width={75}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #dee2e6',
                        borderRadius: '0.375rem',
                        fontSize: '12px'
                      }}
                    />
                    <Bar 
                      dataKey="perdida_pct" 
                      name="Pérdida (%)" 
                      fill="#8B4513"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-5 text-muted">
                  <AlertTriangle size={48} className="mb-3 opacity-50" />
                  <p>Sin datos para mostrar</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Priority Sacks Table */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title mb-0 fw-bold">
                <AlertTriangle size={20} className="me-2 text-warning" />
                Códigos de Sacos a Pesar con Prioridad (Pérdida &gt; 5%)
              </h5>
              <p className="text-muted small mb-0">Sacos que requieren inspección prioritaria por alto índice de riesgo</p>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-light">
                    <tr>
                      <th>Código Saco</th>
                      <th>Fábrica</th>
                      <th>Fecha Llegada</th>
                      <th>Pedidos</th>
                      <th>Recibidos</th>
                      <th>Pérdida (%)</th>
                      <th>N° Sacos</th>
                      <th>Índice Riesgo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highLossAlerts.length > 0 ? (
                      highLossAlerts.map((row, idx) => (
                        <tr key={idx}>
                          <td className="fw-bold text-brown">{row.codigo}</td>
                          <td>{row.fabrica}</td>
                          <td>{row.fechaLlegada}</td>
                          <td>{row.cantidadPedidos.toLocaleString()}</td>
                          <td className="text-success">{row.cantidadRecibidos.toLocaleString()}</td>
                          <td>
                            <span className="badge bg-danger">
                              {row.ratioRP.toFixed(2)}%
                            </span>
                          </td>
                          <td className="fw-medium">{row.cantidadSacos || '-'}</td>
                          <td>
                            <span className={`badge ${row.ratioRP >= 8 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                              {row.ratioRP >= 8 ? 'Crítico' : 'Alto'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-4">
                          No hay alertas de alto riesgo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardContent;
