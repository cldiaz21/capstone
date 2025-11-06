# 🔗 Arduino Weight Bridge - Integración con Dashboard

Este directorio contiene los archivos necesarios para conectar el sistema de pesaje Arduino con el Dashboard Web a través de Supabase.

## 📋 Contenido

```
arduino-weight-sensor/
├── arduino_code.ino         # Código para cargar en el Arduino
├── arduino_bridge.py         # Script Python que conecta Arduino → Supabase
├── supabase_schema.sql       # Schema de la tabla en Supabase
├── requirements.txt          # Dependencias de Python
├── .env.example             # Plantilla de configuración
└── README.md                # Esta guía
```

## 🛠️ Requisitos

### Hardware
- **Arduino Uno/Nano** con sensor de peso HX711
- **Display LCD I2C** (0x27, 16x2)
- **Cable USB** para conectar Arduino a la PC

### Software
- **Python 3.8+** instalado en el sistema
- **Arduino IDE** para cargar el código al Arduino
- **Cuenta de Supabase** con proyecto creado

## 🚀 Instalación Paso a Paso

### 1. Configurar Arduino

1. Abre `arduino_code.ino` en Arduino IDE
2. Instala las librerías necesarias:
   - `HX711` (por Bogdan Necula)
   - `LiquidCrystal_I2C` (por Frank de Brabander)
3. Conecta tu Arduino al PC
4. Verifica y sube el código al Arduino
5. Abre el **Monitor Serial** (9600 baudios) para verificar que funciona

### 2. Configurar Supabase

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `supabase_schema.sql`
4. Ejecuta el script para crear la tabla `pesajes_tiempo_real`
5. Verifica que la tabla se creó correctamente en **Table Editor**

### 3. Instalar Python y Dependencias

```powershell
# Verificar que Python está instalado
python --version

# Navegar al directorio
cd arduino-weight-sensor

# Instalar dependencias
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

```powershell
# Copiar plantilla de configuración
copy .env.example .env

# Editar .env con tus credenciales
notepad .env
```

**Configuración de `.env`:**

```env
SUPABASE_URL=https://xxxxxx.supabase.co
SUPABASE_KEY=tu-anon-key-de-supabase
ARDUINO_PORT=COM3  # Cambiar según tu puerto
CODIGO_SACO=SAC001
FABRICA=Fábrica Principal
```

**¿Cómo encontrar el puerto del Arduino?**

- **Windows:** 
  1. Abre "Administrador de dispositivos"
  2. Busca "Puertos (COM y LPT)"
  3. Busca "Arduino Uno" o "USB Serial Port (COMx)"
  4. Anota el número del puerto (ej: COM3, COM4)

- **Mac:**
  ```bash
  ls /dev/cu.usbserial-*
  # o
  ls /dev/tty.usbserial-*
  ```

- **Linux:**
  ```bash
  ls /dev/ttyUSB* /dev/ttyACM*
  ```

### 5. Ejecutar el Bridge

```powershell
# Asegúrate de estar en el directorio arduino-weight-sensor
python arduino_bridge.py
```

**Salida esperada:**

```
============================================================
🔗 ARDUINO → DASHBOARD BRIDGE
============================================================

✅ Conectado a Supabase
✅ Conectado a Arduino en COM3

✅ Sistema listo. Esperando datos del Arduino...
Presiona Ctrl+C para detener.

📊 Peso registrado: 1.234 kg | Dif: +0.034 kg | SAC001
📊 Peso registrado: 1.198 kg | Dif: -0.002 kg | SAC001
```

### 6. Ver Datos en el Dashboard

1. Abre el dashboard en tu navegador
2. Inicia sesión con tus credenciales
3. Ve a la pestaña **"Pesaje en Vivo"** en el menú lateral
4. ¡Deberías ver los datos en tiempo real! ⚖️

## 📊 Flujo de Datos

```
Arduino HX711 Sensor
       ↓ (USB Serial)
Python Bridge Script
       ↓ (Supabase API)
Supabase Database
       ↓ (Real-time Subscription)
React Dashboard
```

## 🔧 Solución de Problemas

### ❌ Error: "No se puede abrir el puerto COMx"

- **Causa:** El puerto está ocupado o el Arduino no está conectado
- **Solución:**
  1. Desconecta y reconecta el Arduino
  2. Cierra Arduino IDE si está abierto
  3. Verifica que el puerto es correcto en `.env`
  4. Prueba con otro puerto COM

### ❌ Error: "Error conectando a Supabase"

- **Causa:** Credenciales incorrectas o tabla no creada
- **Solución:**
  1. Verifica `SUPABASE_URL` y `SUPABASE_KEY` en `.env`
  2. Asegúrate de haber ejecutado `supabase_schema.sql`
  3. Verifica la conexión a internet

### ❌ No aparecen datos en el dashboard

- **Causa:** El bridge no está corriendo o hay un error de conexión
- **Solución:**
  1. Verifica que `arduino_bridge.py` esté ejecutándose sin errores
  2. Revisa el Monitor Serial del Arduino (debe mostrar JSON)
  3. Verifica en Supabase > Table Editor > pesajes_tiempo_real que se están insertando datos

### 📡 Arduino no envía JSON

- **Causa:** El código antiguo está cargado en el Arduino
- **Solución:**
  1. Asegúrate de subir `arduino_code.ino` (el de este directorio)
  2. Verifica en Monitor Serial que aparecen líneas como: `{"peso":1.234,...}`

## 🔐 Seguridad

- ⚠️ **NUNCA** subas el archivo `.env` a GitHub
- ⚠️ Usa el archivo `.env.example` como plantilla
- ✅ El archivo `.gitignore` ya está configurado para ignorar `.env`

## 📝 Mantenimiento

Para mantener el bridge corriendo continuamente:

### Opción 1: Ventana de PowerShell (Manual)
```powershell
# Mantén la ventana abierta mientras necesites el bridge
python arduino_bridge.py
```

### Opción 2: Servicio de Windows (Avanzado)
Considera usar herramientas como:
- **NSSM** (Non-Sucking Service Manager)
- **PM2** (si usas Node.js)
- **Task Scheduler** de Windows

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección de "Solución de Problemas"
2. Verifica los logs del bridge
3. Consulta la documentación de Supabase
4. Contacta al equipo de desarrollo

---

**Desarrollado para:** Comercial Marisol  
**Proyecto:** Dashboard de Control de Pérdidas  
**Versión:** 1.0.0
