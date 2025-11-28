// Script para importar Lista 2024.csv a Supabase
// Ejecutar con: node importar-lista-2024.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Leer el archivo .env manualmente
const envPath = path.join(__dirname, '.env');
let SUPABASE_URL = '';
let SUPABASE_KEY = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  
  lines.forEach(line => {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      SUPABASE_URL = line.split('=')[1].trim();
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      SUPABASE_KEY = line.split('=')[1].trim();
    }
  });
}

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: No se encontraron las credenciales de Supabase en el archivo .env');
  console.error('Por favor verifica que existan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Credenciales de Supabase cargadas correctamente');
console.log(`📡 URL: ${SUPABASE_URL}\n`);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Leer CSV
const csvPath = path.join(__dirname, 'src', 'Lista 2024.csv');

// Verificar que el archivo existe
if (!fs.existsSync(csvPath)) {
  console.error(`❌ Error: No se encontró el archivo CSV en: ${csvPath}`);
  process.exit(1);
}

console.log(`📂 Leyendo CSV desde: ${csvPath}`);
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parsear CSV (estructura compleja con 3 secciones)
const lines = csvContent.split('\n');
console.log(`📊 Total de líneas en CSV: ${lines.length}\n`);

async function importarDatos() {
  console.log('🚀 Iniciando importación de Lista 2024...\n');

  const fabricasMap = new Map();
  const pedidos = [];

  // Procesar líneas desde la 4 (saltar headers)
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const columns = line.split(',');

    // Sección 1: China Contados (columnas 0-7)
    if (columns[0] && columns[1]) {
      const fecha = columns[0];
      const fabrica = columns[1];
      const codigo = columns[2];
      const cantidadPedidos = parseInt(columns[3]) || 0;
      const cantidadRecibidos = parseInt(columns[4]) || 0;
      const cantidadSacos = parseInt(columns[5]) || 0;

      if (cantidadPedidos > 0) {
        // Agregar fábrica al map
        if (!fabricasMap.has(fabrica)) {
          fabricasMap.set(fabrica, {
            nombre: fabrica,
            codigo: fabrica.substring(0, 10),
            tipo: 'China Contados',
            activa: true
          });
        }

        // Agregar pedido
        pedidos.push({
          fecha_llegada: fecha,
          fabrica_nombre: fabrica,
          codigo: codigo,
          cantidad_pedidos: cantidadPedidos,
          cantidad_recibidos: cantidadRecibidos,
          cantidad_sacos: cantidadSacos,
          ratio_rp: cantidadPedidos > 0 ? 
            ((cantidadPedidos - cantidadRecibidos) / cantidadPedidos) * 100 : 0,
          tipo_lista: 'China Contados'
        });
      }
    }

    // Sección 2: China No Contados (columnas 13-19)
    if (columns[13] && columns[14]) {
      const fecha = columns[13];
      const fabrica = columns[14];
      const codigo = columns[15];
      const cantidadPedidos = parseInt(columns[16]) || 0;
      const cantidadLlegados = parseInt(columns[17]) || 0;
      const cantidadSacos = parseInt(columns[18]) || 0;

      if (cantidadPedidos > 0) {
        if (!fabricasMap.has(fabrica)) {
          fabricasMap.set(fabrica, {
            nombre: fabrica,
            codigo: fabrica.substring(0, 10),
            tipo: 'China No Contados',
            activa: true
          });
        }

        pedidos.push({
          fecha_llegada: fecha,
          fabrica_nombre: fabrica,
          codigo: codigo,
          cantidad_pedidos: cantidadPedidos,
          cantidad_recibidos: cantidadLlegados,
          cantidad_sacos: cantidadSacos,
          ratio_rp: cantidadPedidos > 0 ? 
            ((cantidadPedidos - cantidadLlegados) / cantidadPedidos) * 100 : 0,
          tipo_lista: 'China No Contados'
        });
      }
    }

    // Sección 3: Otros (columnas 20-25)
    if (columns[20] && columns[21]) {
      const fecha = columns[20];
      const fabrica = columns[21];
      const codigo = columns[22];
      const cantidadPedidos = parseInt(columns[23]) || 0;
      const cantidadLlegados = parseInt(columns[24]) || 0;
      const cantidadSacos = parseInt(columns[25]) || 0;

      if (cantidadPedidos > 0) {
        if (!fabricasMap.has(fabrica)) {
          fabricasMap.set(fabrica, {
            nombre: fabrica,
            codigo: fabrica.substring(0, 10),
            tipo: 'Otros',
            activa: true
          });
        }

        pedidos.push({
          fecha_llegada: fecha,
          fabrica_nombre: fabrica,
          codigo: codigo,
          cantidad_pedidos: cantidadPedidos,
          cantidad_recibidos: cantidadLlegados,
          cantidad_sacos: cantidadSacos,
          ratio_rp: cantidadPedidos > 0 ? 
            ((cantidadPedidos - cantidadLlegados) / cantidadPedidos) * 100 : 0,
          tipo_lista: 'Otros'
        });
      }
    }
  }

  // Insertar Fábricas
  console.log(`📦 Insertando ${fabricasMap.size} fábricas...`);
  const fabricasArray = Array.from(fabricasMap.values());
  
  // Primero, obtener fábricas existentes
  const { data: fabricasExistentes } = await supabase
    .from('fabricas')
    .select('id, nombre');
  
  const existentesMap = new Map();
  (fabricasExistentes || []).forEach(f => {
    existentesMap.set(f.nombre, f.id);
  });

  // Insertar solo las fábricas nuevas
  const fabricasNuevas = fabricasArray.filter(f => !existentesMap.has(f.nombre));
  
  let fabricasInsertadas = [];
  if (fabricasNuevas.length > 0) {
    console.log(`  → Insertando ${fabricasNuevas.length} fábricas nuevas...`);
    const { data, error: errorFabricas } = await supabase
      .from('fabricas')
      .insert(fabricasNuevas)
      .select();

    if (errorFabricas) {
      console.error('❌ Error insertando fábricas:', errorFabricas);
      return;
    }
    fabricasInsertadas = data || [];
  }

  console.log(`✅ ${fabricasNuevas.length} fábricas nuevas insertadas`);
  console.log(`✅ ${existentesMap.size} fábricas ya existían`);
  console.log(`✅ Total: ${fabricasNuevas.length + existentesMap.size} fábricas\n`);

  // Crear mapa de IDs de fábricas (combinar existentes + nuevas)
  const fabricaIdMap = new Map(existentesMap);
  fabricasInsertadas.forEach(f => {
    fabricaIdMap.set(f.nombre, f.id);
  });

  // Agregar fabrica_id a pedidos
  pedidos.forEach(p => {
    p.fabrica_id = fabricaIdMap.get(p.fabrica_nombre);
  });

  // Insertar Pedidos en lotes de 100
  console.log(`📦 Insertando ${pedidos.length} pedidos...`);
  const batchSize = 100;
  let insertados = 0;

  for (let i = 0; i < pedidos.length; i += batchSize) {
    const batch = pedidos.slice(i, i + batchSize);
    const { error } = await supabase.from('pedidos').insert(batch);
    
    if (error) {
      console.error(`❌ Error en lote ${i / batchSize + 1}:`, error.message);
    } else {
      insertados += batch.length;
      console.log(`  ✓ Lote ${i / batchSize + 1}: ${insertados}/${pedidos.length}`);
    }
  }

  console.log(`\n✅ ${insertados} pedidos insertados`);

  // Calcular pérdidas
  console.log('\n📊 Calculando pérdidas...');
  const { error: errorPerdidas } = await supabase.rpc('calcular_perdidas');
  
  if (errorPerdidas) {
    console.error('❌ Error calculando pérdidas:', errorPerdidas);
  } else {
    console.log('✅ Pérdidas calculadas');
  }

  console.log('\n🎉 ¡Importación completada!');
  console.log('\n📊 Estadísticas:');
  console.log(`   Fábricas: ${fabricasMap.size}`);
  console.log(`   Pedidos: ${insertados}`);
  
  process.exit(0);
}

// Ejecutar
importarDatos().catch(console.error);
