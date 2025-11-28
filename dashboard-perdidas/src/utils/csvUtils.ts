// Utility to parse CSV data
export interface CSVRow {
  fechaLlegada: string;
  fabrica: string;
  codigo: string;
  cantidadPedidos: number;
  cantidadRecibidos: number;
  cantidadSacos: number;
  ratioRP: number;
}

export function parseCSVData(csvText: string): CSVRow[] {
  const lines = csvText.split('\n');
  const data: CSVRow[] = [];
  
  // Skip header lines (first 4 lines)
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const columns = line.split(',');
    
    // Only process lines with valid data (not empty columns)
    if (columns.length >= 7 && columns[0] && columns[1] && columns[3] && columns[4]) {
      const fecha = columns[0];
      const fabrica = columns[1];
      const codigo = columns[2];
      const pedidos = parseInt(columns[3].replace(/\./g, '')) || 0;
      const recibidos = parseInt(columns[4].replace(/\./g, '')) || 0;
      const sacos = parseInt(columns[5]) || 0;
      
      // Calculate ratio
      const ratio = pedidos > 0 ? ((pedidos - recibidos) / pedidos) * 100 : 0;
      
      if (fecha.includes('2024') && fabrica && pedidos > 0) {
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
  
  return data;
}

export function transformToSackData(csvData: CSVRow[]) {
  return csvData.map((row, index) => {
    const pesoPromedio = 0.15 + Math.random() * 0.1; // 150-250g promedio por prenda
    const pesoTeorico = row.cantidadPedidos * pesoPromedio;
    const factorPerdida = 1 - (row.ratioRP / 100);
    const pesoReal = pesoTeorico * factorPerdida;
    const diferencia = pesoTeorico - pesoReal;
    
    return {
      id: `SACO-${1000 + index}`,
      fecha: row.fechaLlegada,
      factoryId: `F-${row.fabrica}`,
      factoryName: row.fabrica,
      prendas_esperadas: row.cantidadPedidos,
      peso_promedio_prenda: +pesoPromedio.toFixed(3),
      peso_teorico: +pesoTeorico.toFixed(3),
      peso_real: +pesoReal.toFixed(3),
      diferencia: +diferencia.toFixed(3),
    };
  });
}

export function transformToFactoryData(csvData: CSVRow[]) {
  const factoryMap = new Map();
  
  csvData.forEach(row => {
    if (!factoryMap.has(row.fabrica)) {
      factoryMap.set(row.fabrica, {
        id: `F-${row.fabrica}`,
        name: row.fabrica,
        totalPedidos: 0,
        totalRecibidos: 0,
        totalRatio: 0,
        count: 0
      });
    }
    
    const factory = factoryMap.get(row.fabrica);
    factory.totalPedidos += row.cantidadPedidos;
    factory.totalRecibidos += row.cantidadRecibidos;
    factory.totalRatio += row.ratioRP;
    factory.count += 1;
  });
  
  return Array.from(factoryMap.values()).map(factory => ({
    id: factory.id,
    name: factory.name,
    reputacion: Math.max(100 - (factory.totalRatio / factory.count), 50),
    historial_perdida_pct: +(factory.totalRatio / factory.count).toFixed(2)
  }));
}