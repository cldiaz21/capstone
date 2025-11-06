# 🚀 GUÍA DE INSTALACIÓN - Sistema Arduino Supabase

## 📦 PASO 1: Preparar el Entorno

### 1.1 Verificar Python Instalado

```powershell
python --version
# Debe mostrar: Python 3.8.x o superior
```

Si no tienes Python, descarga desde: https://www.python.org/downloads/

### 1.2 Crear Entorno Virtual (Recomendado)

```powershell
# Navegar a la carpeta del proyecto
cd "C:\Users\claud\OneDrive\Escritorio\Capstone\arduino-weight-sensor"

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Si hay error de permisos, ejecutar primero:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 1.3 Instalar Dependencias

```powershell
# Actualizar pip
python -m pip install --upgrade pip

# Instalar paquetes requeridos
pip install -r requirements.txt
```

**Paquetes instalados:**
- `pyserial==3.5` - Comunicación con Arduino
- `supabase==2.3.0` - Cliente de Supabase
- `python-dotenv==1.0.0` - Variables de entorno

---

## 🔌 PASO 2: Configurar Arduino

### 2.1 Cargar Firmware en Arduino

1. **Abrir Arduino IDE**

2. **Instalar librerías necesarias:**
   - Ve a: `Sketch → Include Library → Manage Libraries`
   - Busca e instala:
     - `HX711` (by Bogdan Necula)
     - `LiquidCrystal_I2C` (by Frank de Brabander)

3. **Abrir el sketch:**
   - `File → Open → sketch_pesa_intnuev.ino`

4. **Configurar Arduino:**
   - `Tools → Board → Arduino Uno`
   - `Tools → Port → COM3` (o tu puerto)
   
   **¿No sabes cuál es tu puerto?**
   ```powershell
   # Listar puertos COM disponibles
   mode
   ```
   O ve a: `Administrador de Dispositivos → Puertos (COM & LPT)`

5. **Subir código:**
   - Click en el botón **Upload** (→)
   - Espera el mensaje: "Done uploading"

6. **Verificar funcionamiento:**
   - `Tools → Serial Monitor`
   - Baudios: **9600**
   - Deberías ver mensajes como:
     ```
     OBJ:0.000;ACT:0.123;DIF:0.123
     ```

---

## 🗄️ PASO 3: Configurar Supabase

### 3.1 Obtener Credenciales

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard

2. Selecciona tu proyecto: **Dashboard Perdidas**

3. Ve a: `Settings → API`

4. Copia estos valores:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3.2 Crear Archivo .env

```powershell
# Copiar plantilla
copy .env.example .env

# Abrir para editar
notepad .env
```

**Contenido del archivo .env:**
```bash
# SUPABASE
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-anon-key-aqui

# ARDUINO
ARDUINO_PORT=COM3  # Cambiar al puerto correcto

# OPCIONAL
CODIGO_SACO=SAC001
FABRICA=Fábrica Principal
```

**⚠️ IMPORTANTE:** 
- Reemplaza `tu-proyecto.supabase.co` con tu URL real
- Reemplaza `tu-anon-key-aqui` con tu clave real
- Cambia `COM3` al puerto donde está tu Arduino

### 3.3 Verificar Tablas en Supabase

Ve a: `Table Editor` en Supabase

Verifica que existan estas tablas:
- ✅ `pedidos` - Con códigos de pedidos
- ✅ `sacos` - Donde se guardarán los pesos
- ✅ `fabricas` - Información de fábricas

**Si no existen:**
```powershell
# Ejecutar en SQL Editor de Supabase
# Copia el contenido de: supabase_schema.sql
```

---

## 🧪 PASO 4: Probar la Integración

### 4.1 Test de Conexión Arduino

```powershell
# Activar entorno (si no está activo)
.\venv\Scripts\Activate.ps1

# Test simple de serial
python -c "import serial; s=serial.Serial('COM3', 9600); print('✅ Arduino conectado'); s.close()"
```

**Si hay error:**
- Verifica que Arduino esté conectado
- Cambia `COM3` al puerto correcto
- Cierra Arduino IDE si está abierto (libera el puerto)

### 4.2 Test de Conexión Supabase

```powershell
python -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv(); print('✅ Supabase conectado' if create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_KEY')) else '❌ Error')"
```

**Si hay error:**
- Verifica credenciales en `.env`
- Revisa que URL no tenga espacios
- Confirma que la KEY sea la `anon/public`

---

## 🎯 PASO 5: Ejecutar el Sistema

### 5.1 Ejecutar Script Completo

```powershell
# Asegúrate de estar en la carpeta correcta
cd "C:\Users\claud\OneDrive\Escritorio\Capstone\arduino-weight-sensor"

# Activar entorno virtual
.\venv\Scripts\Activate.ps1

# Ejecutar script principal
python arduino_supabase_integration.py
```

### 5.2 Flujo de Trabajo

**Interfaz GUI aparecerá con estos pasos:**

#### PASO A: Escanear ID del Saco
1. Click en **"Escanear ID Saco"**
2. Ingresa código de pedido (ej: `TEST-001`)
3. Sistema busca en tabla `pedidos`
4. Si existe, muestra información del pedido

#### PASO B: Seleccionar Producto
1. Selecciona del dropdown: `ATUN` o `PALMITO`
   - **ATUN**: 5 unidades por saco
   - **PALMITO**: 3 unidades por saco

#### PASO C: Tomar Muestra Base
1. Coloca **2 unidades** del producto en la báscula
2. Click en **"Iniciar Conteo"**
3. Espera a que se estabilice el peso
4. Sistema calcula `peso_base` (peso promedio por unidad)

#### PASO D: Pesar Saco Completo
1. Retira las 2 unidades
2. Coloca el **saco completo** en la báscula
3. Sistema lee automáticamente `peso_real`
4. Calcula `peso_objetivo` = peso_base × cantidad_unidades
5. Calcula `diferencia` = peso_real - peso_objetivo
6. Determina `estado`:
   - **OK**: Si diferencia ≤ 3%
   - **FUERA_RANGO**: Si diferencia > 3%

#### PASO E: Guardar Datos
1. Click en **"Guardar en Supabase"**
2. Datos se envían a tabla `sacos`
3. También se guarda en `registro_inventario.csv` (respaldo)
4. Mensaje de confirmación aparece

### 5.3 Verificar Datos Guardados

**En Supabase:**
```sql
-- SQL Editor
SELECT * FROM sacos ORDER BY fecha_pesaje DESC LIMIT 10;
```

**En Dashboard Web:**
- Ve a: `http://localhost:5173/sacos` (desarrollo)
- O: `https://tu-dashboard.vercel.app/sacos` (producción)

**En CSV (respaldo local):**
```powershell
notepad registro_inventario.csv
```

---

## ⚙️ CONFIGURACIÓN AVANZADA

### Cambiar Tolerancia

En `arduino_supabase_integration.py`, línea ~65:
```python
tolerancia = 3.0  # Cambiar valor (ej: 5.0 para 5%)
```

### Agregar Nuevos Productos

En `arduino_supabase_integration.py`, línea ~20:
```python
productos = {
    "ATUN": {"cantidad": 5},
    "PALMITO": {"cantidad": 3},
    "NUEVO_PRODUCTO": {"cantidad": 10}  # Añadir aquí
}
```

### Calibrar Báscula

Si los pesos no son precisos:

1. **Encontrar OFFSET** (tara):
   ```cpp
   // En sketch_pesa_intnuev.ino
   long offset = scale.read_average(20);
   Serial.println(offset);  // Anotar valor
   
   // Actualizar línea ~25
   #define OFFSET -91830  // Tu valor aquí
   ```

2. **Encontrar SCALE_VALOR**:
   - Coloca objeto de peso conocido (ej: 1.000 kg)
   - Ejecuta código:
     ```cpp
     long reading = scale.read_average(20);
     float calibration = (reading - OFFSET) / 1000.0;
     Serial.println(calibration);
     
     // Actualizar línea ~24
     #define SCALE_VALOR 98500.0  // Tu valor aquí
     ```

3. **Re-cargar firmware** en Arduino

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### ❌ "Error: could not open port 'COM3'"

**Causa:** Puerto ocupado o incorrecto

**Solución:**
```powershell
# 1. Ver puertos disponibles
mode

# 2. Cerrar programas que usen el puerto:
# - Arduino IDE (Serial Monitor)
# - Otros scripts Python
# - PuTTY o software serial

# 3. Actualizar .env con puerto correcto
ARDUINO_PORT=COM4  # Tu puerto
```

---

### ❌ "Pedido no encontrado"

**Causa:** Código no existe en tabla `pedidos`

**Solución:**
```sql
-- Crear pedido de prueba en SQL Editor
INSERT INTO pedidos (codigo, fabrica_id, producto, cantidad, estado)
VALUES (
  'TEST-001',
  '00000000-0000-0000-0000-000000000000',  -- UUID válido o NULL
  'ATUN',
  5,
  'pendiente'
);
```

---

### ❌ "Permission denied: 'registro_inventario.csv'"

**Causa:** Archivo CSV abierto en Excel

**Solución:**
- Cierra Excel o el programa que tenga el archivo abierto
- Reinicia el script

---

### ❌ Peso siempre 0.000

**Causa:** Problemas de conexión HX711

**Solución:**
1. Verifica conexiones:
   ```
   Arduino → HX711
   A1      → DT
   A0      → SCK
   5V      → VCC
   GND     → GND
   ```

2. Test en Serial Monitor:
   - Abre Arduino IDE
   - Tools → Serial Monitor (9600 baud)
   - Deberías ver pesos cambiantes

3. Si sigue en 0:
   - Revisa celda de carga conectada
   - Verifica cables no rotos
   - Re-calibra OFFSET y SCALE_VALOR

---

### ❌ Lecturas muy inestables (±100g)

**Causa:** Interferencia electromagnética o superficie inestable

**Solución:**
- ✅ Coloca báscula sobre mesa rígida
- ✅ Aleja de motores, transformadores, Wi-Fi
- ✅ Usa cable USB corto y con ferrita
- ✅ Aumenta muestras de promedio:
  ```cpp
  // En sketch_pesa_intnuev.ino
  pesoObj = scale.get_units(30);  // Cambiar de 10 a 30
  ```

---

### ❌ "Failed to insert into sacos"

**Causa:** Schema de tabla incorrecto o RLS activo

**Solución:**
```sql
-- 1. Verificar schema
\d sacos  -- En psql
-- O en Table Editor → sacos → Definition

-- 2. Deshabilitar RLS temporalmente
ALTER TABLE sacos DISABLE ROW LEVEL SECURITY;

-- 3. Verificar foreign keys válidas
SELECT * FROM fabricas LIMIT 5;
SELECT * FROM pedidos WHERE codigo = 'TEST-001';
```

---

## 📊 MONITOREO Y LOGS

### Ver Logs en Tiempo Real

```powershell
# Ejecutar con logs detallados
python arduino_supabase_integration.py 2>&1 | Tee-Object -FilePath logs.txt
```

### Verificar Datos en Supabase

```sql
-- Últimos 10 pesajes
SELECT 
  codigo,
  peso_objetivo,
  peso_real,
  diferencia,
  estado,
  fecha_pesaje
FROM sacos
ORDER BY fecha_pesaje DESC
LIMIT 10;

-- Sacos fuera de rango
SELECT * FROM sacos WHERE estado = 'FUERA_RANGO';

-- Estadísticas de hoy
SELECT 
  COUNT(*) as total,
  AVG(diferencia) as diferencia_promedio,
  SUM(CASE WHEN estado = 'OK' THEN 1 ELSE 0 END) as ok,
  SUM(CASE WHEN estado = 'FUERA_RANGO' THEN 1 ELSE 0 END) as fuera_rango
FROM sacos
WHERE DATE(fecha_pesaje) = CURRENT_DATE;
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

Antes de reportar problemas, verifica:

- [ ] Python 3.8+ instalado
- [ ] Entorno virtual activado
- [ ] Dependencias instaladas (`pip list`)
- [ ] Arduino conectado y reconocido (Device Manager)
- [ ] Firmware cargado en Arduino
- [ ] Serial Monitor muestra datos (9600 baud)
- [ ] Archivo `.env` creado con credenciales válidas
- [ ] Tablas `pedidos` y `sacos` existen en Supabase
- [ ] Al menos un pedido de prueba creado
- [ ] Puerto COM correcto en `.env`
- [ ] Báscula sobre superficie estable
- [ ] Celda de carga conectada correctamente

---

## 🎓 CAPACITACIÓN DEL EQUIPO

### Flujo Diario de Uso

1. **Al iniciar turno:**
   ```powershell
   cd arduino-weight-sensor
   .\venv\Scripts\Activate.ps1
   python arduino_supabase_integration.py
   ```

2. **Por cada saco:**
   - Escanear código de pedido
   - Seleccionar producto
   - Tomar muestra (2 unidades)
   - Pesar saco completo
   - Guardar en sistema

3. **Al finalizar turno:**
   - Cerrar programa (X en ventana)
   - Verificar datos en dashboard web
   - Reportar anomalías

### Roles y Responsabilidades

| Rol | Responsabilidad |
|-----|-----------------|
| **Operador** | Escanear, pesar, guardar datos |
| **Supervisor** | Verificar dashboard, reportes diarios |
| **IT** | Mantenimiento, calibración, backups |

---

## 📞 SOPORTE

**¿Problemas técnicos?**

1. Revisa esta guía primero
2. Verifica el checklist
3. Ejecuta tests de conexión
4. Revisa logs en consola

**Archivo de soporte:**
- Guarda `logs.txt` con errores
- Screenshot de la pantalla de error
- Contenido (ofuscado) de `.env`
- Resultado de tests de conexión

---

## 🔄 ACTUALIZACIONES

### Actualizar Dependencias

```powershell
pip install --upgrade supabase pyserial python-dotenv
```

### Actualizar Firmware Arduino

1. Descarga nueva versión de `sketch_pesa_intnuev.ino`
2. Abre en Arduino IDE
3. Tools → Upload

### Pull Latest Code

```powershell
cd "C:\Users\claud\OneDrive\Escritorio\Capstone"
git pull origin main
```

---

**Última actualización:** Enero 2025  
**Versión:** 1.0.0  
**Autor:** Sistema Dashboard Marisol