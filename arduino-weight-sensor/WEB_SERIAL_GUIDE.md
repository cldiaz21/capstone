# 🌐 Integración Arduino con Dashboard Web (Web Serial API)

## 📝 Descripción

El sistema de pesaje ahora funciona **completamente desde el navegador web**, sin necesidad de scripts Python intermedios. Usa la **Web Serial API** para conectar y comunicarse directamente con el Arduino desde cualquier computador.

---

## ✨ Ventajas de esta Implementación

✅ **Sin instalación de software**: No necesitas Python ni dependencias  
✅ **Multiplataforma**: Funciona en Windows, Mac y Linux  
✅ **Multi-usuario**: Cualquier computador puede conectar su propio Arduino  
✅ **Plug and Play**: Solo conecta el USB y haz clic en "Conectar Arduino"  
✅ **Tiempo Real**: Los pesos se leen instantáneamente del hardware  
✅ **Base de datos integrada**: Guarda automáticamente en Supabase  

---

## 🔧 Requisitos

### Navegador Compatible
- **Google Chrome** 89+ (Recomendado)
- **Microsoft Edge** 89+
- **Opera** 75+

⚠️ **NO soportado en:**
- Firefox
- Safari
- Internet Explorer

### Hardware
- Arduino Uno/Nano con sensor HX711
- Display LCD I2C (opcional, para visualización local)
- Cable USB para conectar al computador

### Firmware Arduino
Debe estar cargado el sketch que envía datos en formato:
```
OBJ:5.250;ACT:5.380;DIF:0.130\n
```

---

## 🚀 Cómo Usar

### Paso 1: Conectar el Arduino

1. **Conecta el Arduino** al puerto USB del computador
2. Ve a la pestaña **"Pesaje Tiempo Real"** en el dashboard
3. Haz clic en el botón **"Conectar Arduino"**
4. En el popup, selecciona el puerto serial (ej: `Arduino Uno (COM3)`)
5. Click en **"Conectar"**

✅ Verás el badge cambiar a **"● Arduino Conectado"** (verde)

### Paso 2: Escanear o Ingresar Código de Pedido

1. En el panel de control, ingresa el código del pedido (ej: `TEST-001`)
2. Click en **"Buscar"** o presiona `Enter`
3. El sistema validará que el pedido existe en la base de datos
4. Se muestra la información del pedido (producto, cantidad, fábrica)

### Paso 3: Tomar Muestra Base

1. Coloca **2 unidades** del producto en la báscula
2. Espera a que el peso se estabilice
3. Click en **"Tomar Muestra Base"**
4. El sistema calcula el peso promedio por unidad

### Paso 4: Pesar Saco Completo

1. Retira las 2 unidades de muestra
2. Coloca el **saco completo** en la báscula
3. Espera a que el peso se estabilice
4. Click en **"Guardar Pesaje"**

✅ El pesaje se guarda automáticamente en Supabase  
✅ Aparece en el historial de la misma página  
✅ Se puede ver en la vista "Sacos" del dashboard  

### Paso 5: Continuar Pesando

El sistema se reinicia automáticamente después de guardar y puedes pesar el siguiente saco.

---

## 📊 Interfaz del Dashboard

### Panel Principal

```
┌─────────────────────────────────────────────────────┐
│  Pesaje en Tiempo Real    [● Arduino Conectado]    │
│                            [Desconectar]            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────┐  ┌─────────────────────────┐ │
│  │  Peso Actual     │  │  Control de Pesaje      │ │
│  │                  │  │                         │ │
│  │    5.380 kg      │  │  Paso 1: Escanear       │ │
│  │                  │  │  [TEST-001] [Buscar]    │ │
│  │  Peso Base:      │  │                         │ │
│  │  0.265 kg/unidad │  │  o                      │ │
│  │                  │  │                         │ │
│  │  Objetivo:       │  │  Paso 2: Muestra        │ │
│  │  1.325 kg        │  │  [Tomar Muestra Base]   │ │
│  │                  │  │                         │ │
│  │  Diferencia:     │  │  o                      │ │
│  │  +0.055 kg       │  │                         │ │
│  │                  │  │  Paso 3: Pesar          │ │
│  └──────────────────┘  │  [Guardar Pesaje]       │ │
│                        └─────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│  Historial de Pesajes (Últimos 10)                 │
│  ┌───────────────────────────────────────────────┐ │
│  │ Hora     │ Código │ Peso │ Obj │ Dif │ Estado │ │
│  │ 10:30:15 │ SAC-01 │ 5.38 │ 5.3 │+0.05│ Fuera  │ │
│  │ 10:25:42 │ SAC-02 │ 5.32 │ 5.3 │+0.02│   OK   │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## 🔍 Flujo de Datos Técnico

```
┌─────────────┐
│   Arduino   │ 
│   (HX711)   │
└──────┬──────┘
       │ USB Serial (9600 baud)
       │ "OBJ:5.250;ACT:5.380;DIF:0.130\n"
       ↓
┌─────────────────────────┐
│  Navegador Web (Chrome) │
│  ┌───────────────────┐  │
│  │  Web Serial API   │  │
│  │  navigator.serial │  │
│  └─────────┬─────────┘  │
│            ↓             │
│  ┌───────────────────┐  │
│  │ React Component   │  │
│  │ PesajeTiempoReal  │  │
│  │ - Lee datos       │  │
│  │ - Parsea JSON     │  │
│  │ - Calcula estado  │  │
│  └─────────┬─────────┘  │
└────────────┼─────────────┘
             ↓
   ┌──────────────────┐
   │  Supabase API    │
   │  (PostgreSQL)    │
   │                  │
   │  INSERT INTO     │
   │  sacos (...)     │
   └─────────┬────────┘
             ↓
   ┌──────────────────┐
   │  Dashboard Views │
   │  - Sacos         │
   │  - Pérdidas      │
   │  - Reportes      │
   └──────────────────┘
```

---

## ⚙️ Configuración del Arduino

### Firmware Requerido

El Arduino debe enviar datos en este formato exacto:

```cpp
// En el loop() de Arduino
Serial.print("OBJ:");
Serial.print(pesoObjetivo, 3);  // 3 decimales
Serial.print(";ACT:");
Serial.print(pesoActual, 3);
Serial.print(";DIF:");
Serial.print(diferencia, 3);
Serial.println();  // \n al final
```

**Ejemplo de salida:**
```
OBJ:5.250;ACT:5.380;DIF:0.130
OBJ:5.250;ACT:5.375;DIF:0.125
OBJ:5.250;ACT:5.382;DIF:0.132
```

### Baudrate
- **9600 baud** (configurado en el código React)

### Protocolo
- Datos enviados cada 500ms-1s (configurable)
- Formato texto plano (ASCII)
- Terminador: `\n` (newline)

---

## 🐛 Troubleshooting

### ❌ "Tu navegador no soporta Web Serial API"

**Causa:** Estás usando un navegador incompatible

**Solución:**
- Descarga e instala Google Chrome: https://www.google.com/chrome/
- O usa Microsoft Edge (incluido en Windows 10/11)

---

### ❌ No aparece el botón "Conectar Arduino"

**Causa:** Web Serial API no está disponible

**Solución:**
```
1. Verifica que estás usando Chrome/Edge
2. Asegúrate de que el sitio esté en HTTPS (en producción)
3. En desarrollo, debe ser localhost o 127.0.0.1
```

---

### ❌ "Failed to open serial port"

**Causa:** El puerto está ocupado por otro programa

**Solución:**
```
1. Cierra Arduino IDE (Serial Monitor)
2. Cierra otros programas que usen puertos seriales
3. En Windows, cierra PuTTY, TeraTerm, etc.
4. Desconecta y reconecta el Arduino
5. Intenta nuevamente
```

---

### ❌ No se leen datos del Arduino

**Causa:** Baudrate incorrecto o formato de datos incorrecto

**Solución:**
```cpp
// Verifica en Arduino sketch:
void setup() {
  Serial.begin(9600);  // ← Debe ser 9600
}

// Y que envíe en formato correcto:
Serial.print("OBJ:5.250;ACT:5.380;DIF:0.130\n");
```

**Test en Serial Monitor:**
```
1. Abre Arduino IDE → Tools → Serial Monitor
2. Configura 9600 baud
3. Deberías ver líneas como: "OBJ:5.250;ACT:5.380;DIF:0.130"
```

---

### ❌ "Pedido no encontrado"

**Causa:** El código no existe en la tabla `pedidos`

**Solución:**
```sql
-- Crear pedido de prueba en Supabase SQL Editor:
INSERT INTO pedidos (codigo, fabrica_id, producto, cantidad, estado)
VALUES ('TEST-001', NULL, 'ATUN', 5, 'pendiente');

-- Verificar:
SELECT * FROM pedidos WHERE codigo = 'TEST-001';
```

---

### ❌ Datos guardados pero no aparecen en dashboard

**Causa:** Caché o error de sincronización

**Solución:**
```
1. Recarga la página (F5)
2. Verifica en Supabase Table Editor → sacos
3. Revisa la consola del navegador (F12) para errores
```

---

## 🔐 Seguridad

### HTTPS Requerido en Producción

Web Serial API **requiere HTTPS** en producción:
- ✅ `https://tu-dashboard.vercel.app` → Funciona
- ❌ `http://tu-dashboard.com` → NO funciona
- ✅ `http://localhost:5173` → Funciona (desarrollo)

### Permisos del Navegador

El usuario debe **aceptar explícitamente** conectar el Arduino:
- Popup de selección de puerto serial
- Permiso se recuerda para futuras sesiones
- Se puede revocar en configuración del navegador

---

## 📱 Compatibilidad Móvil

⚠️ **Web Serial API NO está disponible en dispositivos móviles:**
- ❌ Android Chrome/Firefox
- ❌ iOS Safari/Chrome
- ❌ Tablets iPad/Android

**Alternativa para móvil:**
- Usar el script Python original (`arduino_supabase_integration.py`)
- O implementar BLE (Bluetooth Low Energy) en lugar de Serial

---

## 🚀 Ventajas vs Script Python

| Característica | Web Serial (Navegador) | Script Python |
|----------------|------------------------|---------------|
| **Instalación** | ❌ Ninguna | ✅ Python + deps |
| **Multiplataforma** | ✅ Windows/Mac/Linux | ✅ Windows/Mac/Linux |
| **Multi-usuario** | ✅ Cada PC su Arduino | ❌ Solo 1 PC |
| **Actualización** | ✅ Auto (Vercel) | ❌ Manual |
| **Interfaz** | ✅ Dashboard web | ⚠️ Tkinter básico |
| **Navegador necesario** | ✅ Chrome/Edge | ❌ No |
| **HTTPS requerido** | ⚠️ Solo producción | ❌ No |
| **Móvil** | ❌ No soportado | ❌ No |

---

## 📚 Recursos

### Web Serial API
- Documentación oficial: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API
- Can I Use: https://caniuse.com/web-serial
- Ejemplos: https://web.dev/serial/

### Arduino
- Guía HX711: https://randomnerdtutorials.com/arduino-load-cell-hx711/
- Serial Communication: https://www.arduino.cc/reference/en/language/functions/communication/serial/

### Supabase
- Realtime: https://supabase.com/docs/guides/realtime
- JavaScript Client: https://supabase.com/docs/reference/javascript

---

## 🔄 Migración desde Script Python

Si ya estabas usando `arduino_supabase_integration.py`:

### Mantener Ambos Sistemas

Puedes usar ambos simultáneamente:
- **Web**: Para operadores en planta con navegador
- **Python**: Para testing o si no hay Chrome/Edge

Ambos guardan en la misma tabla `sacos` de Supabase.

### Solo Web

1. Ya no necesitas ejecutar script Python
2. Solo conecta Arduino vía USB al computador
3. Abre dashboard en Chrome
4. Click "Conectar Arduino"
5. ¡Listo!

---

## ✅ Checklist de Verificación

Antes de usar en producción:

- [ ] Navegador Chrome/Edge instalado
- [ ] Arduino conectado y firmware cargado
- [ ] Serial Monitor muestra datos correctos (9600 baud)
- [ ] Dashboard en HTTPS (producción) o localhost (dev)
- [ ] Pedidos de prueba creados en Supabase
- [ ] Tabla `sacos` existe y tiene permisos
- [ ] Test de conexión exitoso desde navegador
- [ ] Flujo completo probado: escanear → muestra → pesar → guardar
- [ ] Datos aparecen en historial y vista "Sacos"

---

**Versión:** 2.0.0  
**Última actualización:** Noviembre 2024  
**Tecnología:** Web Serial API + React + Supabase