# 🏗️ ARQUITECTURA DEL SISTEMA - Dashboard Marisol

## 📐 Visión General

Sistema integrado de control de producción y pérdidas que conecta hardware físico (Arduino) con una plataforma web moderna (React + Supabase).

```
┌─────────────────────────────────────────────────────────────────┐
│                        FLUJO COMPLETO                            │
└─────────────────────────────────────────────────────────────────┘

1. HARDWARE          2. BRIDGE           3. DATABASE        4. FRONTEND
   (Arduino)        (Python)             (Supabase)         (React)
      │                  │                    │                 │
      │  Serial 9600     │                    │                 │
   [HX711]────────────>  │                    │                 │
   Load Cell          [pyserial]              │                 │
      │                  │                    │                 │
      │              [Procesa]                │                 │
      │              Calcula:                 │                 │
      │              - peso_objetivo          │                 │
      │              - diferencia             │                 │
      │              - estado                 │                 │
      │                  │                    │                 │
      │                  │    HTTP POST       │                 │
      │                  ├─────────────────>  │                 │
      │                  │   supabase-py   [PostgreSQL]         │
      │                  │                  INSERT INTO          │
      │                  │                  sacos table          │
      │                  │                    │                 │
      │                  │                    │   HTTP GET      │
      │                  │                    │ <───────────────┤
      │                  │                    │  @supabase/js   │
      │                  │                    │                 │
      │              [CSV Backup]             │             [Dashboard]
      │            registro_inv.csv           │             Visualiza:
      │                                       │             - Sacos
      │                                       │             - Pérdidas
      │                                       │             - Reportes
      │                                       │             - Tiempo Real
```

---

## 🔧 COMPONENTES DEL SISTEMA

### 1. CAPA DE HARDWARE (Arduino)

#### Componentes Físicos
```
Arduino Uno
├── HX711 Load Cell Amplifier
│   ├── VCC  → 5V
│   ├── GND  → GND
│   ├── DT   → A1 (Data Pin)
│   └── SCK  → A0 (Clock Pin)
│
├── LCD I2C 16x2 (Dirección 0x27)
│   ├── VCC  → 5V
│   ├── GND  → GND
│   ├── SDA  → A4
│   └── SCL  → A5
│
└── USB → PC (Serial 9600 baud)
```

#### Firmware: `sketch_pesa_intnuev.ino`
```cpp
// Funciones principales:
void setup() {
  // Inicializa:
  // - Serial (9600 baud)
  // - HX711 con calibración
  // - LCD I2C
}

void loop() {
  // 1. Lee comando serial
  // 2. Ejecuta acción (OBJ, TARE)
  // 3. Lee peso actual
  // 4. Envía JSON por serial
}

// Protocolo de comunicación:
// OUT: "OBJ:5.250;ACT:5.380;DIF:0.130\n"
```

**Características:**
- ✅ Calibración precisa (±1g)
- ✅ Promedio de 10 lecturas
- ✅ Auto-tara con comando
- ✅ Display LCD en tiempo real
- ✅ Protocolo JSON simple

---

### 2. CAPA DE INTEGRACIÓN (Python Bridge)

#### Script: `arduino_supabase_integration.py`

```python
┌─────────────────────────────────────────┐
│      PYTHON BRIDGE ARCHITECTURE         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│          TKINTER GUI                    │
│  ┌───────────────────────────────────┐  │
│  │  [Escanear ID Saco]               │  │
│  │  [Dropdown: ATUN / PALMITO]       │  │
│  │  [Iniciar Conteo]                 │  │
│  │  [Guardar en Supabase]            │  │
│  │  Status: Peso: 5.380 kg           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│       BUSINESS LOGIC                    │
│  ┌───────────────────────────────────┐  │
│  │ get_saco_info(codigo)             │  │
│  │   → Query pedidos table           │  │
│  │   → Get fabrica_id, producto      │  │
│  │                                   │  │
│  │ leer_arduino()                    │  │
│  │   → Read serial port              │  │
│  │   → Parse JSON                    │  │
│  │   → Extract pesos                 │  │
│  │                                   │  │
│  │ calcular_estado()                 │  │
│  │   → peso_objetivo = base * qty    │  │
│  │   → diferencia = real - objetivo  │  │
│  │   → estado = OK / FUERA_RANGO     │  │
│  │                                   │  │
│  │ guardar_supabase()                │  │
│  │   → INSERT INTO sacos             │  │
│  │   → Append to CSV                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│       DATA ACCESS LAYER                 │
│  ┌───────────────────────────────────┐  │
│  │ Serial (pyserial)                 │  │
│  │   COM3, 9600 baud                 │  │
│  │                                   │  │
│  │ Supabase (supabase-py)            │  │
│  │   REST API calls                  │  │
│  │   Token: anon/public key          │  │
│  │                                   │  │
│  │ CSV (csv module)                  │  │
│  │   registro_inventario.csv         │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**Responsabilidades:**
1. **Comunicación Serial**: Lee datos de Arduino
2. **Query Database**: Obtiene información de pedidos
3. **Cálculos**: Determina estado y diferencias
4. **Persistencia**: Guarda en Supabase + CSV
5. **UI**: Interfaz gráfica para operador

**Configuración (`.env`):**
```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=eyJxxxx...
ARDUINO_PORT=COM3
```

---

### 3. CAPA DE DATOS (Supabase PostgreSQL)

#### Schema de Base de Datos

```sql
┌─────────────────────────────────────────┐
│            DATABASE SCHEMA              │
└─────────────────────────────────────────┘

fabricas
├── id (uuid, PK)
├── nombre (text)
├── codigo (text)
└── ... otros campos

pedidos
├── id (uuid, PK)
├── codigo (text, UNIQUE)              ← Escaneado por operador
├── fabrica_id (uuid, FK → fabricas)
├── producto (text)
├── cantidad (integer)
├── estado (text)
└── fecha_creacion (timestamptz)

sacos                                    ← ⭐ Tabla principal
├── id (uuid, PK)
├── codigo (text)                        ← Código del saco
├── pedido_id (uuid, FK → pedidos)      ← Referencia pedido
├── fabrica_id (uuid, FK → fabricas)    ← Referencia fábrica
├── peso_objetivo (numeric)             ← Calculado (base * qty)
├── peso_real (numeric)                 ← Leído del Arduino
├── diferencia (numeric)                ← real - objetivo
├── estado (text)                       ← OK | FUERA_RANGO
├── fecha_pesaje (timestamptz)          ← Timestamp automático
└── created_at (timestamptz)

usuarios
├── id (uuid, PK)
├── email (text)
├── nombre (text)
├── rol (text)                          ← admin | supervisor | operador
└── ... campos de autenticación

VIEWS (Calculadas):
├── perdidas_por_fabrica
│   └── Agrupa diferencias por fábrica
│
├── sacos_fuera_rango_hoy
│   └── Filtra estado = FUERA_RANGO + fecha = hoy
│
└── peso_promedio_por_producto
    └── AVG(peso_real) GROUP BY producto
```

#### Row Level Security (RLS)

```sql
-- Tabla usuarios: RLS DISABLED
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- Tabla sacos: RLS ENABLED
ALTER TABLE sacos ENABLE ROW LEVEL SECURITY;

-- Policy: Solo admins pueden eliminar
CREATE POLICY "Admin can delete sacos"
ON sacos FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol = 'admin'
  )
);

-- Policy: Todos pueden ver
CREATE POLICY "Everyone can view sacos"
ON sacos FOR SELECT
TO authenticated
USING (true);

-- Policy: Operadores pueden insertar
CREATE POLICY "Operadores can insert sacos"
ON sacos FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios
    WHERE usuarios.id = auth.uid()
    AND usuarios.rol IN ('admin', 'operador')
  )
);
```

---

### 4. CAPA DE PRESENTACIÓN (React Frontend)

#### Arquitectura Frontend

```typescript
dashboard-perdidas/
│
├── src/
│   ├── main.tsx                    // Entry point
│   ├── App.tsx                     // Router + Layout
│   │
│   ├── contexts/
│   │   └── LanguageContext.tsx    // 🌐 ES / KO translations
│   │
│   ├── lib/
│   │   ├── supabase.ts            // Supabase client config
│   │   └── utils.ts               // Helper functions
│   │
│   ├── components/
│   │   ├── Login.tsx              // Autenticación
│   │   ├── SidebarSB.tsx          // Navegación lateral
│   │   ├── CardNav.tsx            // ⭐ Navbar principal (USAR ESTE)
│   │   ├── NavbarSB.tsx           // (NO USADO)
│   │   │
│   │   ├── DashboardPerdidasNuevo.tsx
│   │   │   └── Layout principal + routing
│   │   │
│   │   ├── DashboardContentNuevo.tsx
│   │   │   └── Vista de estadísticas generales
│   │   │
│   │   ├── SacosNuevo.tsx         // 📦 Lista de sacos
│   │   │   └── Query: SELECT * FROM sacos
│   │   │
│   │   ├── Fabricas2.tsx          // 🏭 Vista de fábricas
│   │   │   └── Query: SELECT * FROM fabricas
│   │   │
│   │   ├── Reportes.tsx           // 📊 Reportes y gráficos
│   │   │   └── Chart.js + filtros
│   │   │
│   │   ├── PesajeTiempoReal.tsx   // ⚡ Tiempo real (Arduino)
│   │   │   └── Query con revalidación
│   │   │
│   │   └── AdministracionUsuarios.tsx
│   │       └── CRUD de usuarios
│   │
│   └── utils/
│       └── csvUtils.ts            // Exportar a CSV
```

#### Flujo de Datos Frontend

```typescript
┌─────────────────────────────────────────┐
│       REACT DATA FLOW                   │
└─────────────────────────────────────────┘

1. AUTHENTICATION
   Login.tsx
      ↓
   supabase.auth.signInWithPassword()
      ↓
   [Token stored in localStorage]
      ↓
   Redirect to Dashboard

2. DATA FETCHING (SacosNuevo.tsx)
   useEffect(() => {
     const fetchSacos = async () => {
       const { data } = await supabase
         .from('sacos')
         .select(`
           *,
           pedido:pedidos(*),
           fabrica:fabricas(*)
         `)
         .order('fecha_pesaje', { ascending: false })
       
       setSacos(data)
     }
     
     fetchSacos()
     
     // Realtime subscription
     const subscription = supabase
       .channel('sacos_changes')
       .on('postgres_changes', {
         event: 'INSERT',
         schema: 'public',
         table: 'sacos'
       }, payload => {
         setSacos(prev => [payload.new, ...prev])
       })
       .subscribe()
   }, [])

3. LANGUAGE CONTEXT
   LanguageProvider (App.tsx)
      ↓
   useLanguage() hook in components
      ↓
   t('key') → Translation string
      ↓
   Render with ES or KO text

4. STATE MANAGEMENT
   - useState for local component state
   - useEffect for side effects / API calls
   - Context API for global state (Language)
   - No Redux needed (simple app)
```

#### Componentes Clave

**CardNav.tsx** (Navbar Principal):
```typescript
interface CardNavProps {
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

// Features:
// - Hamburger menu (toggle sidebar)
// - Logo responsive
// - 🔔 Notificaciones (badge count)
// - 👤 User dropdown
// - 🌐 Language selector (TODO: agregar)

// Notificaciones:
const [notificaciones, setNotificaciones] = useState([])

useEffect(() => {
  const fetchNotificaciones = async () => {
    // Query perdidas > 3%
    const { data } = await supabase
      .from('sacos')
      .select('*')
      .eq('estado', 'FUERA_RANGO')
      .gte('fecha_pesaje', new Date(Date.now() - 24*60*60*1000))
    
    setNotificaciones(data || [])
  }
}, [])
```

**SacosNuevo.tsx** (Vista Principal):
```typescript
// Muestra tabla con:
// - Código del saco
// - Pedido asociado
// - Fábrica
// - Peso objetivo vs peso real
// - Diferencia (con color: verde OK, rojo FUERA_RANGO)
// - Fecha de pesaje
// - Acciones (ver detalle, exportar)

// Features:
// ✅ Búsqueda por código
// ✅ Filtro por fecha
// ✅ Filtro por estado
// ✅ Ordenamiento por columna
// ✅ Paginación
// ✅ Exportar a CSV
// ✅ Actualización en tiempo real
```

**LanguageContext.tsx** (Multilenguaje):
```typescript
const translations = {
  es: {
    nav: {
      dashboard: "Tablero",
      sacos: "Sacos",
      factories: "Fábricas",
      reports: "Reportes",
      users: "Usuarios",
      realtime: "Tiempo Real"
    },
    // ... más traducciones
  },
  ko: {
    nav: {
      dashboard: "대시보드",
      sacos: "자루",
      factories: "공장",
      reports: "보고서",
      users: "사용자",
      realtime: "실시간"
    },
    // ... más traducciones
  }
}

export const useLanguage = () => {
  const [language, setLanguage] = useState<'es' | 'ko'>(
    (localStorage.getItem('app_language') as 'es' | 'ko') || 'es'
  )
  
  const t = (key: string) => {
    const keys = key.split('.')
    let value: any = translations[language]
    
    for (const k of keys) {
      value = value?.[k]
    }
    
    return value || key
  }
  
  return { language, setLanguage, t }
}

// Uso:
const { t, setLanguage } = useLanguage()
<h1>{t('nav.dashboard')}</h1>  // "Tablero" o "대시보드"
```

---

## 🔄 FLUJO DE DATOS COMPLETO

### Caso de Uso: Pesar un Saco

```
1. OPERADOR (Hardware):
   ├─ Escanea código de pedido: "PED-2024-001"
   └─ Coloca 2 unidades ATUN en báscula

2. ARDUINO (Firmware):
   ├─ HX711 lee celda de carga
   ├─ Promedia 10 lecturas: 0.530 kg
   └─ Envía por serial: "OBJ:0.000;ACT:0.530;DIF:0.530\n"

3. PYTHON BRIDGE:
   ├─ Lee serial port (9600 baud)
   ├─ Parse JSON: peso_actual = 0.530 kg
   ├─ Calcula: peso_base = 0.530 / 2 = 0.265 kg/unidad
   └─ Operador click "Iniciar Conteo"

4. OPERADOR:
   ├─ Retira 2 unidades
   └─ Coloca saco completo (5 unidades ATUN)

5. ARDUINO:
   ├─ Lee nuevo peso: 1.380 kg
   └─ Envía: "OBJ:0.000;ACT:1.380;DIF:1.380\n"

6. PYTHON BRIDGE (Cálculo):
   ├─ Query DB: SELECT * FROM pedidos WHERE codigo = 'PED-2024-001'
   │   → fabrica_id = 'uuid-fabrica-001'
   │   → cantidad = 5 unidades
   │
   ├─ Calcula:
   │   peso_objetivo = 0.265 kg/u × 5 = 1.325 kg
   │   peso_real = 1.380 kg (del Arduino)
   │   diferencia = 1.380 - 1.325 = +0.055 kg (+4.15%)
   │
   └─ Determina:
       tolerancia = 3.0%
       4.15% > 3.0% → estado = "FUERA_RANGO"

7. OPERADOR:
   └─ Click "Guardar en Supabase"

8. PYTHON BRIDGE (Persistencia):
   ├─ INSERT INTO sacos:
   │   {
   │     codigo: "SAC-001",
   │     pedido_id: "uuid-pedido",
   │     fabrica_id: "uuid-fabrica-001",
   │     peso_objetivo: 1.325,
   │     peso_real: 1.380,
   │     diferencia: 0.055,
   │     estado: "FUERA_RANGO",
   │     fecha_pesaje: "2024-01-15T10:30:00Z"
   │   }
   │
   └─ Append to CSV: registro_inventario.csv

9. SUPABASE (Database):
   ├─ Row inserted successfully
   ├─ Trigger Realtime event: INSERT on sacos table
   └─ Broadcast to subscribed clients

10. REACT FRONTEND (Real-time Update):
    ├─ Realtime subscription receives event
    ├─ Update state: setSacos([newSaco, ...prevSacos])
    ├─ Re-render SacosNuevo.tsx
    └─ Show notification: "🔴 Nuevo saco FUERA_RANGO"

11. DASHBOARD (Visualización):
    ├─ SacosNuevo.tsx: Muestra nueva fila con badge rojo
    ├─ CardNav.tsx: Incrementa badge de notificaciones (1)
    ├─ Reportes.tsx: Actualiza gráfico de pérdidas
    └─ DashboardContentNuevo.tsx: Actualiza estadística "Sacos fuera de rango"
```

---

## 🔐 SEGURIDAD

### Autenticación y Autorización

```typescript
┌─────────────────────────────────────────┐
│          SECURITY LAYERS                │
└─────────────────────────────────────────┘

1. FRONTEND AUTH (Supabase Auth)
   ├─ Login → supabase.auth.signInWithPassword()
   ├─ Session stored in localStorage
   ├─ Protected routes check session
   └─ Auto refresh token

2. RLS POLICIES (Database)
   ├─ usuarios: RLS DISABLED (aux table)
   ├─ sacos: RLS ENABLED
   │   ├─ SELECT: All authenticated users
   │   ├─ INSERT: admin, operador
   │   ├─ UPDATE: admin, supervisor
   │   └─ DELETE: admin only
   │
   └─ pedidos, fabricas: Similar policies

3. API SECURITY (Supabase)
   ├─ anon/public key for client-side
   ├─ service_role key for server-side (Arduino bridge)
   ├─ JWT tokens with expiration
   └─ HTTPS only

4. ENVIRONMENT VARIABLES
   ├─ .env files NOT committed to git
   ├─ .env.example as template
   ├─ Different keys for dev/prod
   └─ Key rotation policy
```

### Roles y Permisos

| Rol | Dashboard | Sacos View | Sacos Add | Sacos Edit | Sacos Delete | Users Admin |
|-----|-----------|------------|-----------|------------|--------------|-------------|
| **admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **supervisor** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **operador** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **viewer** | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 📊 MÉTRICAS Y MONITOREO

### KPIs del Sistema

```sql
-- 1. Total de sacos pesados hoy
SELECT COUNT(*) as total_hoy
FROM sacos
WHERE DATE(fecha_pesaje) = CURRENT_DATE;

-- 2. Porcentaje de sacos fuera de rango
SELECT 
  COUNT(*) FILTER (WHERE estado = 'FUERA_RANGO') * 100.0 / COUNT(*) as porcentaje_fuera
FROM sacos
WHERE DATE(fecha_pesaje) = CURRENT_DATE;

-- 3. Diferencia promedio por fábrica
SELECT 
  f.nombre,
  AVG(s.diferencia) as diferencia_promedio,
  COUNT(*) as total_sacos
FROM sacos s
JOIN fabricas f ON s.fabrica_id = f.id
WHERE DATE(s.fecha_pesaje) = CURRENT_DATE
GROUP BY f.nombre
ORDER BY diferencia_promedio DESC;

-- 4. Tendencia de pérdidas (últimos 7 días)
SELECT 
  DATE(fecha_pesaje) as fecha,
  COUNT(*) FILTER (WHERE estado = 'FUERA_RANGO') as fuera_rango,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE estado = 'FUERA_RANGO') * 100.0 / COUNT(*) as porcentaje
FROM sacos
WHERE fecha_pesaje >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(fecha_pesaje)
ORDER BY fecha;

-- 5. Peso promedio por producto
SELECT 
  p.producto,
  AVG(s.peso_real) as peso_promedio,
  STDDEV(s.peso_real) as desviacion
FROM sacos s
JOIN pedidos p ON s.pedido_id = p.id
GROUP BY p.producto;
```

### Dashboard Analytics

```typescript
// Implementado en Reportes.tsx
const analytics = {
  totalSacos: number,
  sacosOK: number,
  sacosFueraRango: number,
  porcentajePerdidas: number,
  pesoPromedioObjetivo: number,
  pesoPromedioReal: number,
  diferenciaTotal: number,  // En kg
  costoEstimadoPerdidas: number,  // En $
  
  // Por fábrica
  fabricasConMayorPerdida: [
    { nombre: string, perdida: number }
  ],
  
  // Por producto
  productosConMayorVariacion: [
    { producto: string, variacion: number }
  ],
  
  // Tendencias
  perdiddasPorDia: [
    { fecha: string, porcentaje: number }
  ]
}
```

---

## 🚀 DEPLOYMENT

### Frontend (Vercel)

```bash
# Repositorio GitHub
dashboard-perdidas/
├── Connected to Vercel project
├── Auto-deploy on push to main
└── Environment variables:
    ├── VITE_SUPABASE_URL
    └── VITE_SUPABASE_ANON_KEY

# Build settings:
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Backend (Supabase)

```
Project: Dashboard Perdidas
Region: South America (São Paulo)
Database: PostgreSQL 15
Storage: 500MB (free tier)

Tables:
├── usuarios (1,234 rows)
├── fabricas (15 rows)
├── pedidos (5,678 rows)
└── sacos (12,345 rows)

Functions: 3 active
Policies: 12 active
Indexes: 8 total
```

### Arduino Bridge (On-Premise)

```powershell
# Windows PC en planta de producción
Location: Área de pesaje
Connection: USB to Arduino Uno
Network: Local WiFi (for Supabase API)

Setup:
C:\Produccion\arduino-weight-sensor\
├── python.exe (venv)
├── arduino_supabase_integration.py
├── .env (con credenciales)
└── logs.txt

Auto-start:
Task Scheduler → Run at login
Restart on crash: Yes
Log rotation: Daily
```

---

## 🔄 MANTENIMIENTO

### Tareas Diarias
- ✅ Verificar Arduino conectado
- ✅ Check dashboard accessible
- ✅ Review notificaciones de pérdidas
- ✅ Backup CSV files

### Tareas Semanales
- ✅ Review logs de errores
- ✅ Calibración de báscula (si necesario)
- ✅ Update de dependencias Python
- ✅ Review de usuarios activos

### Tareas Mensuales
- ✅ Backup completo de database
- ✅ Análisis de tendencias de pérdidas
- ✅ Review de capacidad de storage
- ✅ Update de firmware Arduino (si hay)

---

## 📚 TECNOLOGÍAS UTILIZADAS

### Hardware
- **Arduino Uno** (Rev 3)
- **HX711** Load Cell Amplifier
- **LCD I2C** 16x2 (PCF8574)
- **Load Cell** 5kg-10kg

### Firmware
- **Arduino IDE** 1.8.19 / 2.x
- **HX711 Library** v0.7.5
- **LiquidCrystal_I2C** v1.1.2

### Python Bridge
- **Python** 3.11
- **pyserial** 3.5
- **supabase-py** 2.3.0
- **python-dotenv** 1.0.0
- **tkinter** (built-in)

### Frontend
- **React** 18.2
- **TypeScript** 5.2
- **Vite** 5.0
- **TailwindCSS** 3.4
- **Chart.js** 4.4
- **Bootstrap** 5.3 (legacy)
- **@supabase/supabase-js** 2.39

### Backend
- **Supabase** (Platform)
- **PostgreSQL** 15
- **PostgREST** API
- **GoTrue** Auth
- **Realtime** WebSockets

### DevOps
- **Git** / GitHub
- **Vercel** (Frontend hosting)
- **VS Code** (IDE)
- **Windows** Task Scheduler

---

## 📖 DOCUMENTACIÓN ADICIONAL

- `INSTALACION.md` - Guía paso a paso de instalación
- `INTEGRATION_GUIDE.md` - Guía de integración técnica
- `README.md` - Overview del sistema Arduino
- `supabase_schema.sql` - Schema completo de DB
- `.env.example` - Template de configuración

---

**Versión:** 1.0.0  
**Última actualización:** Enero 2025  
**Mantenedor:** Equipo Dashboard Marisol