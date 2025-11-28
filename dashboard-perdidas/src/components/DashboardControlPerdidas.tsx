import { useMemo, useState, useEffect } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Download, Database, Activity } from "lucide-react";
import { parseCSVData, transformToSackData, transformToFactoryData } from "../utils/csvUtils";
import type { CSVRow } from "../utils/csvUtils";
// import csvData from "../Lista 2024.csv?raw"; // Archivo obsoleto - datos ahora en Supabase
const csvData = ""; // Placeholder - componente obsoleto
import ListGroup from 'react-bootstrap/ListGroup';
import Badge from 'react-bootstrap/Badge';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';

// --- Types ---
interface Factory {
  id: string;
  name: string;
  reputacion: number;
  historial_perdida_pct: number;
}

interface Sack {
  id: string;
  fecha: string;
  factoryId: string;
  factoryName: string;
  prendas_esperadas: number;
  peso_promedio_prenda: number;
  peso_teorico: number;
  peso_real: number;
  diferencia: number;
}

interface ChartDataItem {
  name: string;
  reputacion: number;
  avgDiff: number;
  count: number;
}

// --- Mock data ---
const GLOBAL_NUMBERS = {
  prendas_anio: 294000,
  sacos_anio: 4088,
  contenedores_anio: 18,
  fabricas: 44,
};

// Example factories with reputación (1-100)
const mockFactories: Factory[] = Array.from({ length: 8 }).map((_, i) => ({
  id: `F-${100 + i}`,
  name: `Fábrica ${String.fromCharCode(65 + i)}`,
  reputacion: [95, 80, 60, 40, 99, 75, 55, 30][i] ?? 70,
  historial_perdida_pct: [0.2, 0.8, 1.8, 4.5, 0.1, 1.0, 2.5, 5.0][i] ?? 1.5,
}));

// Mock sacks
const mockSacks: Sack[] = Array.from({ length: 20 }).map((_, i) => {
  const factory = mockFactories[i % mockFactories.length];
  const prendas = Math.round(40 + Math.random() * 120);
  const promedio = +(0.18 + Math.random() * 0.12).toFixed(3);
  const peso_teorico = +(prendas * promedio).toFixed(3);
  const noiseFactor = 1 + (factory.historial_perdida_pct / 100) * (Math.random() - 0.4);
  const peso_real = +(peso_teorico * noiseFactor).toFixed(3);
  return {
    id: `SACO-${1000 + i}`,
    fecha: `2025-0${1 + (i % 9)}-0${2 + (i % 8)}`,
    factoryId: factory.id,
    factoryName: factory.name,
    prendas_esperadas: prendas,
    peso_promedio_prenda: promedio,
    peso_teorico,
    peso_real,
    diferencia: +(peso_teorico - peso_real).toFixed(3),
  };
});

export default function DashboardControlPerdidas() {
  const [realData, setRealData] = useState<CSVRow[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [sacks, setSacks] = useState<Sack[]>([]);

  useEffect(() => {
    // Parse CSV data on component mount
    try {
      const parsedData = parseCSVData(csvData);
      const factoryData = transformToFactoryData(parsedData);
      const sackData = transformToSackData(parsedData);
      
      setRealData(parsedData);
      setFactories(factoryData);
      setSacks(sackData.slice(0, 50)); // Limit to first 50 for performance
    } catch (error) {
      console.error('Error parsing CSV data:', error);
      // Fallback to mock data if CSV parsing fails
      setFactories(mockFactories);
      setSacks(mockSacks);
    }
  }, []);

  const totals = useMemo(() => {
    const sacos = sacks.length;
    const prendas = sacks.reduce((s, x) => s + x.prendas_esperadas, 0);
    const peso_teorico = sacks.reduce((s, x) => s + x.peso_teorico, 0);
    const peso_real = sacks.reduce((s, x) => s + x.peso_real, 0);
    return { 
      sacos, 
      prendas, 
      peso_teorico: +peso_teorico.toFixed(3), 
      peso_real: +peso_real.toFixed(3) 
    };
  }, [sacks]);

  const kpis = useMemo(() => {
    const totalExpected = sacks.reduce((s, x) => s + x.prendas_esperadas, 0);
    const totalEstimatedByWeight = sacks.reduce((s, x) => s + x.peso_real / x.peso_promedio_prenda, 0);
    const lossPct = totalExpected > 0 ? ((totalExpected - totalEstimatedByWeight) / totalExpected) * 100 : 0;
    
    // Calculate totals from real CSV data
    const totalSacos = realData.reduce((sum, row) => sum + (row.cantidadSacos || 0), 0);
    const totalPrendas = realData.reduce((sum, row) => sum + row.cantidadPedidos, 0);
    
    return {
      prendas_anio: totalPrendas || GLOBAL_NUMBERS.prendas_anio,
      sacos_anio: totalSacos || GLOBAL_NUMBERS.sacos_anio,
      estimated_loss_pct: +(lossPct || 0).toFixed(2),
      sacos_sampled: sacks.length,
    };
  }, [sacks, realData]);

  const chartData = useMemo<ChartDataItem[]>(() => {
    const factoriesToUse = factories.length > 0 ? factories : mockFactories;
    const byFactory = factoriesToUse.map((f) => {
      const related = sacks.filter((s) => s.factoryId === f.id);
      const avgDiff = related.length ? related.reduce((a, b) => a + b.diferencia, 0) / related.length : 0;
      return { 
        name: f.name.substring(0, 10), // Truncate long names for chart
        reputacion: f.reputacion, 
        avgDiff: +avgDiff.toFixed(3), 
        count: related.length 
      };
    });
    return byFactory.slice(0, 10); // Show top 10 factories
  }, [sacks, factories]);

  const flagged = useMemo(() => {
    return sacks.filter(s => Math.abs(s.diferencia) > 0.5);
  }, [sacks]);

  const handleExportCSV = () => {
    const csvContent = [
      "ID,Fecha,Fabrica,Prendas Esperadas,Peso Teorico,Peso Real,Diferencia,Estado",
      ...sacks.map(s => 
        `${s.id},${s.fecha},${s.factoryName},${s.prendas_esperadas},${s.peso_teorico},${s.peso_real},${s.diferencia},${Math.abs(s.diferencia) > 0.5 ? 'ALARMA' : 'OK'}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `dashboard-perdidas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Container fluid className="bg-light min-vh-100 py-4">
      <Row>
        <Col>
          <header className="mb-4">
            <h1 className="display-4 fw-bold text-dark">Control de Pérdidas: Comercial Marisol</h1>
            <p className="lead text-muted">Pesaje PRE Llegada de Sacos</p>
          </header>
        </Col>
      </Row>

      {/* KPI Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="small text-muted fw-medium">Prendas / año</div>
                <div className="h3 fw-bold text-dark mb-0">{kpis.prendas_anio.toLocaleString()}</div>
              </div>
              <Database size={32} className="text-primary" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="small text-muted fw-medium">Sacos / año</div>
                <div className="h3 fw-bold text-dark mb-0">{kpis.sacos_anio.toLocaleString()}</div>
              </div>
              <Activity size={32} className="text-success" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="small text-muted fw-medium">Muestra sacos</div>
                <div className="h3 fw-bold text-dark mb-0">{kpis.sacos_sampled}</div>
              </div>
              <Download size={32} className="text-info" />
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="small text-muted fw-medium">Estimación pérdida (muestra)</div>
              <div className="h3 fw-bold text-danger mb-0">{kpis.estimated_loss_pct}%</div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Chart Section */}
        <Col lg={8}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="card-title mb-0">Diferencia peso teórico vs real (por fábrica)</h5>
            </Card.Header>
            <Card.Body>
              <div style={{ height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
                      labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Bar dataKey="avgDiff" name="Diferencia (kg)" fill="#0d6efd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <h6 className="mt-4 mb-3">Sacos recientes (muestra)</h6>
              <ListGroup as="ol" numbered>
                {sacks.slice(0, 10).map((s) => {
                  const isAlarma = Math.abs(s.diferencia) > 0.5;
                  return (
                    <ListGroup.Item
                      key={s.id}
                      as="li"
                      className={`d-flex justify-content-between align-items-start ${isAlarma ? "border-danger bg-danger-subtle" : ""}`}
                    >
                      <div className="ms-2 me-auto">
                        <div className="fw-bold">{s.factoryName}</div>
                        <small className="text-muted">
                          {s.id} - {s.prendas_esperadas} prendas - Teórico: {s.peso_teorico}kg | Real: {s.peso_real}kg
                        </small>
                      </div>
                      <Badge 
                        bg={isAlarma ? "danger" : "success"} 
                        pill
                        className="ms-2"
                      >
                        {isAlarma ? `⚠️ ${s.diferencia}kg` : "OK"}
                      </Badge>
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Summary Section */}
        <Col lg={4}>
          <Card className="h-100">
            <Card.Header>
              <h5 className="card-title mb-0">Resumen rápido</h5>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Prendas (muestra)</span>
                  <Badge bg="primary" pill>{totals.prendas}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Peso teórico total</span>
                  <Badge bg="info" pill>{totals.peso_teorico} kg</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Peso real total</span>
                  <Badge bg="info" pill>{totals.peso_real} kg</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <span>Sacos marcados (Δ &gt; 0.5kg)</span>
                  <Badge bg="danger" pill>{flagged.length}</Badge>
                </ListGroup.Item>
              </ListGroup>

              <div className="mt-4">
                <button
                  className="btn btn-primary w-100"
                  onClick={handleExportCSV}
                >
                  📥 Exportar CSV
                </button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <footer className="mt-4 text-center">
        <small className="text-muted">
          Datos basados en Lista 2024 - {realData.length > 0 ? `${realData.length} registros de importaciones reales` : 'Datos demo'} - Dashboard Control de Pérdidas v1.0
        </small>
      </footer>
    </Container>
  );
}