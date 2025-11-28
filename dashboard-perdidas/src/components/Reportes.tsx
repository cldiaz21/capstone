import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import * as XLSX from 'xlsx';

interface ReporteConfig {
  tipo: 'pedidos' | 'perdidas' | 'fabricas' | 'sacos' | 'consolidado';
  fechaInicio: string;
  fechaFin: string;
  fabricaId?: string;
}

const Reportes: React.FC = () => {
  const [config, setConfig] = useState<ReporteConfig>({
    tipo: 'pedidos',
    fechaInicio: '',
    fechaFin: '',
    fabricaId: ''
  });
  const [fabricas, setFabricas] = useState<any[]>([]);
  const [generando, setGenerando] = useState(false);

  useEffect(() => {
    cargarFabricas();
  }, []);

  const cargarFabricas = async () => {
    const { data } = await supabase
      .from('fabricas')
      .select('id, nombre')
      .eq('activa', true)
      .order('nombre');
    
    if (data) setFabricas(data);
  };

  const generarReporte = async () => {
    if (!config.fechaInicio || !config.fechaFin) {
      alert('Por favor selecciona un rango de fechas');
      return;
    }

    setGenerando(true);

    try {
      let datos: any[] = [];
      let nombreReporte = '';

      switch (config.tipo) {
        case 'pedidos': {
          const { data: pedidos } = await supabase
            .from('pedidos')
            .select('*, fabricas(nombre)')
            .gte('fecha_llegada', config.fechaInicio)
            .lte('fecha_llegada', config.fechaFin)
            .order('fecha_llegada', { ascending: false });
          
          datos = (pedidos || []).map(p => ({
            'Fecha Llegada': p.fecha_llegada,
            'Fábrica': p.fabricas?.nombre || '',
            'Código': p.codigo,
            'Cantidad Pedidos': p.cantidad_pedidos,
            'Cantidad Recibidos': p.cantidad_recibidos,
            'Cantidad Sacos': p.cantidad_sacos,
            'Ratio R/P': p.ratio_rp.toFixed(2) + '%',
            'Tipo Lista': p.tipo_lista
          }));
          nombreReporte = `Reporte_Pedidos_${config.fechaInicio}_a_${config.fechaFin}`;
          break;
        }

        case 'perdidas':
          const { data: perdidas } = await supabase
            .from('perdidas')
            .select('*, fabricas(nombre)')
            .gte('fecha', config.fechaInicio)
            .lte('fecha', config.fechaFin)
            .order('fecha', { ascending: false });
          
          datos = (perdidas || []).map(p => ({
            'Fecha': p.fecha,
            'Fábrica': p.fabricas?.nombre || '',
            'Cantidad Perdida': p.cantidad_perdida,
            '% Pérdida': p.porcentaje_perdida.toFixed(2) + '%',
            'Valor Estimado': '$' + p.valor_estimado.toLocaleString(),
            'Tipo': p.tipo
          }));
          nombreReporte = `Reporte_Perdidas_${config.fechaInicio}_a_${config.fechaFin}`;
          break;

        case 'fabricas':
          const { data: estadisticas } = await supabase
            .from('estadisticas_fabricas')
            .select('*');
          
          datos = (estadisticas || []).map(f => ({
            'Fábrica': f.nombre_fabrica,
            'Tipo': f.tipo,
            'Total Pedidos': f.total_pedidos,
            'Total Recibidos': f.total_recibidos,
            'Total Sacos': f.total_sacos,
            '% Pérdida Promedio': f.promedio_ratio.toFixed(2) + '%',
            'Pérdida Total': f.perdida_total
          }));
          nombreReporte = `Reporte_Fabricas_${new Date().toISOString().split('T')[0]}`;
          break;

        case 'sacos':
          let querySacos = supabase
            .from('sacos')
            .select('*, fabricas(nombre), pedidos(codigo)')
            .order('fecha_pesaje', { ascending: false });

          if (config.fechaInicio && config.fechaFin) {
            querySacos = querySacos
              .gte('fecha_pesaje', config.fechaInicio)
              .lte('fecha_pesaje', config.fechaFin);
          }

          const { data: sacos } = await querySacos;
          
          datos = (sacos || []).map(s => ({
            'Código Saco': s.codigo,
            'Fábrica': s.fabricas?.nombre || '',
            'Pedido': s.pedidos?.codigo || '',
            'Peso Objetivo (kg)': s.peso_objetivo,
            'Peso Real (kg)': s.peso_real,
            'Diferencia (kg)': s.diferencia,
            'Estado': s.estado,
            'Fecha Pesaje': s.fecha_pesaje,
            'Lote': s.lote
          }));
          nombreReporte = `Reporte_Sacos_${config.fechaInicio}_a_${config.fechaFin}`;
          break;

        case 'consolidado':
          // Reporte consolidado con todas las tablas
          const { data: pedidosC } = await supabase
            .from('pedidos')
            .select('*, fabricas(nombre)')
            .gte('fecha_llegada', config.fechaInicio)
            .lte('fecha_llegada', config.fechaFin);

          const { data: perdidasC } = await supabase
            .from('perdidas')
            .select('*, fabricas(nombre)')
            .gte('fecha', config.fechaInicio)
            .lte('fecha', config.fechaFin);

          const { data: estadisticasC } = await supabase
            .from('estadisticas_fabricas')
            .select('*');

          // Crear workbook con múltiples hojas
          const wb = XLSX.utils.book_new();

          // Hoja Pedidos
          const datosPedidos = (pedidosC || []).map(p => ({
            'Fecha': p.fecha_llegada,
            'Fábrica': p.fabricas?.nombre || '',
            'Código': p.codigo,
            'Pedidos': p.cantidad_pedidos,
            'Recibidos': p.cantidad_recibidos,
            'Sacos': p.cantidad_sacos,
            'Ratio': p.ratio_rp.toFixed(2) + '%'
          }));
          const wsPedidos = XLSX.utils.json_to_sheet(datosPedidos);
          XLSX.utils.book_append_sheet(wb, wsPedidos, 'Pedidos');

          // Hoja Pérdidas
          const datosPerdidas = (perdidasC || []).map(p => ({
            'Fecha': p.fecha,
            'Fábrica': p.fabricas?.nombre || '',
            'Cantidad': p.cantidad_perdida,
            'Porcentaje': p.porcentaje_perdida.toFixed(2) + '%',
            'Valor': '$' + p.valor_estimado.toLocaleString()
          }));
          const wsPerdidas = XLSX.utils.json_to_sheet(datosPerdidas);
          XLSX.utils.book_append_sheet(wb, wsPerdidas, 'Pérdidas');

          // Hoja Fábricas
          const datosFabricas = (estadisticasC || []).map(f => ({
            'Fábrica': f.nombre_fabrica,
            'Tipo': f.tipo,
            'Pedidos': f.total_pedidos,
            'Recibidos': f.total_recibidos,
            'Sacos': f.total_sacos,
            'Pérdida %': f.promedio_ratio.toFixed(2) + '%'
          }));
          const wsFabricas = XLSX.utils.json_to_sheet(datosFabricas);
          XLSX.utils.book_append_sheet(wb, wsFabricas, 'Fábricas');

          // Descargar
          XLSX.writeFile(wb, `Reporte_Consolidado_${config.fechaInicio}_a_${config.fechaFin}.xlsx`);
          
          setGenerando(false);
          alert('¡Reporte consolidado generado exitosamente!');
          return; // Exit early para consolidado
      }

      // Para reportes simples (no consolidado)
      if (datos.length === 0) {
        alert('No hay datos para generar el reporte');
        setGenerando(false);
        return;
      }

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, config.tipo.charAt(0).toUpperCase() + config.tipo.slice(1));
      XLSX.writeFile(wb, `${nombreReporte}.xlsx`);

      alert('¡Reporte generado exitosamente!');
    } catch (error) {
      console.error('Error generando reporte:', error);
      alert('Error al generar el reporte');
    } finally {
      setGenerando(false);
    }
  };

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <FileText size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#8B4513' }} />
          Generador de Reportes
        </h1>
      </div>

      {/* Configuración del Reporte */}
      <div className="card shadow mb-4">
        <div className="card-header py-3" style={{ backgroundColor: '#8B4513', color: 'white' }}>
          <h6 className="m-0 font-weight-bold">
            <Filter size={18} className="me-2" />
            Configuración del Reporte
          </h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Tipo de Reporte</label>
              <select 
                className="form-select"
                value={config.tipo}
                onChange={(e) => setConfig({...config, tipo: e.target.value as any})}
              >
                <option value="pedidos">📦 Pedidos</option>
                <option value="perdidas">📉 Pérdidas</option>
                <option value="fabricas">🏭 Fábricas</option>
                <option value="sacos">📊 Sacos</option>
                <option value="consolidado">📋 Consolidado (Todas las tablas)</option>
              </select>
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha Inicio</label>
              <input 
                type="date"
                className="form-control"
                value={config.fechaInicio}
                onChange={(e) => setConfig({...config, fechaInicio: e.target.value})}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label">Fecha Fin</label>
              <input 
                type="date"
                className="form-control"
                value={config.fechaFin}
                onChange={(e) => setConfig({...config, fechaFin: e.target.value})}
              />
            </div>

            <div className="col-md-2 d-flex align-items-end">
              <button 
                className="btn btn-success w-100"
                onClick={generarReporte}
                disabled={generando}
              >
                {generando ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Generando...
                  </>
                ) : (
                  <>
                    <Download size={18} className="me-2" />
                    Generar Excel
                  </>
                )}
              </button>
            </div>
          </div>

          {config.tipo !== 'fabricas' && config.tipo !== 'consolidado' && (
            <div className="row mt-3">
              <div className="col-md-6">
                <label className="form-label">Filtrar por Fábrica (opcional)</label>
                <select 
                  className="form-select"
                  value={config.fabricaId}
                  onChange={(e) => setConfig({...config, fabricaId: e.target.value})}
                >
                  <option value="">Todas las fábricas</option>
                  {fabricas.map(f => (
                    <option key={f.id} value={f.id}>{f.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Descripción de Reportes */}
      <div className="row">
        <div className="col-lg-6 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3" style={{ backgroundColor: '#4E73DF', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">Tipos de Reportes Disponibles</h6>
            </div>
            <div className="card-body">
              <ul className="list-unstyled">
                <li className="mb-3">
                  <strong>📦 Pedidos:</strong> Detalle de todos los pedidos registrados, incluyendo fechas, fábricas, cantidades y ratios.
                </li>
                <li className="mb-3">
                  <strong>📉 Pérdidas:</strong> Análisis de pérdidas por fecha y fábrica, con porcentajes y valores estimados.
                </li>
                <li className="mb-3">
                  <strong>🏭 Fábricas:</strong> Estadísticas consolidadas por fábrica con totales y promedios.
                </li>
                <li className="mb-3">
                  <strong>📊 Sacos:</strong> Detalle del pesaje de sacos con diferencias y estados.
                </li>
                <li className="mb-3">
                  <strong>📋 Consolidado:</strong> Reporte completo con múltiples hojas (Pedidos, Pérdidas, Fábricas).
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="col-lg-6 mb-4">
          <div className="card shadow h-100">
            <div className="card-header py-3" style={{ backgroundColor: '#1CC88A', color: 'white' }}>
              <h6 className="m-0 font-weight-bold">
                <Calendar size={18} className="me-2" />
                Instrucciones
              </h6>
            </div>
            <div className="card-body">
              <ol>
                <li className="mb-2">Selecciona el tipo de reporte que deseas generar</li>
                <li className="mb-2">Especifica el rango de fechas (obligatorio para pedidos, pérdidas y sacos)</li>
                <li className="mb-2">Opcionalmente, filtra por una fábrica específica</li>
                <li className="mb-2">Haz clic en "Generar Excel" para descargar el archivo</li>
                <li className="mb-2">El archivo se descargará automáticamente en formato .xlsx</li>
              </ol>
              <div className="alert alert-info mb-0 mt-3">
                <strong>💡 Tip:</strong> El reporte consolidado incluye múltiples hojas de cálculo en un solo archivo.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;
