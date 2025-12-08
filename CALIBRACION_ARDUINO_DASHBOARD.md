# 🔧 Calibración Interactiva del Arduino desde el Dashboard

## 📋 ¿Qué es esto?

El Arduino tiene un **proceso de calibración interactivo** cuando se enciende o resetea. El dashboard ahora puede **detectar automáticamente** estos mensajes y mostrar una interfaz para responder sin necesidad de usar el Serial Monitor del Arduino IDE.

---

## 🎯 Cómo Funciona

### Flujo del Arduino (Secuencia de Calibración)

```
1. Arduino se conecta
   ↓
2. Arduino pregunta: "¿Cuál es el peso conocido?"
   ↓
3. Usuario ingresa peso (ej: 5.250)
   ↓
4. Arduino pregunta: "Escribir ok para confirmar"
   ↓
5. Usuario escribe "ok"
   ↓
6. Arduino inicia pesaje continuo
   ↓
7. Dashboard recibe datos: OBJ:X.XXX;ACT:X.XXX;DIF:X.XXX
```

### Flujo del Dashboard (Automatizado)

```
1. Usuario hace click en "Conectar Arduino"
   ↓
2. Dashboard detecta mensaje: "peso conocido"
   ↓
3. Dashboard muestra MODAL AMARILLO con input
   ↓
4. Usuario ingresa peso y hace click "Enviar Peso"
   ↓
5. Dashboard envía el número al Arduino
   ↓
6. Dashboard detecta mensaje: "escribir ok"
   ↓
7. Dashboard muestra BOTÓN VERDE "Confirmar (OK)"
   ↓
8. Usuario hace click
   ↓
9. Dashboard envía "ok" al Arduino
   ↓
10. Modal desaparece ✅
    ↓
11. Dashboard recibe datos normales y muestra peso en tiempo real
```

---

## 🖥️ Interfaz del Dashboard

### 1. Modal de Calibración (Paso 1: Peso Conocido)

Cuando el Arduino pide peso conocido, aparece:

```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Calibración del Arduino                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📢 Arduino dice: "¿Cuál es el peso conocido?"     │
│                                                     │
│  El Arduino solicita que ingreses un peso conocido │
│  para calibración.                                  │
│                                                     │
│  Peso conocido (kg):                                │
│  [ 5.250 ______________ ]  [ 📤 Enviar Peso ]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 2. Modal de Calibración (Paso 2: Confirmación)

Después de enviar el peso:

```
┌─────────────────────────────────────────────────────┐
│ ⚙️ Calibración del Arduino                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📢 Arduino dice: "Escribir ok para confirmar"     │
│                                                     │
│  El Arduino solicita confirmación para continuar.  │
│                                                     │
│              [ ✅ Confirmar (OK) ]                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 3. Calibración Completa

Una vez confirmado, el modal desaparece y muestra:

```
✅ Calibración completada
```

Y el dashboard continúa mostrando el peso en tiempo real normalmente.

---

## 🔍 Detección Automática de Mensajes

El dashboard detecta automáticamente estos mensajes del Arduino:

### Solicitud de Peso Conocido
- `"peso conocido"`
- `"ingrese el peso"`
- `"cual es el peso"`

### Solicitud de Confirmación
- `"escribir ok"`
- `"escriba ok"`
- `"ingrese ok"`

### Calibración Completada
- `"calibracion completa"`
- `"calibración completa"`
- `"listo para pesar"`
- `"iniciando pesaje"`

---

## 💻 Código Implementado

### Estados Agregados

```typescript
// Estados para calibración interactiva del Arduino
const [modoCalibacion, setModoCalibacion] = useState(false);
const [esperandoPesoConocido, setEsperandoPesoConocido] = useState(false);
const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
const [pesoConocidoInput, setPesoConocidoInput] = useState('');
const [mensajeArduino, setMensajeArduino] = useState('');
```

### Funciones Nuevas

```typescript
// Enviar peso conocido al Arduino
const enviarPesoConocido = async () => {
  const peso = parseFloat(pesoConocidoInput);
  if (isNaN(peso) || peso <= 0) {
    mostrarMensaje('error', 'Ingresa un peso válido mayor a 0');
    return;
  }

  const exito = await enviarComandoArduino(peso.toFixed(3));
  if (exito) {
    console.log(`📤 Peso conocido enviado: ${peso} kg`);
    setPesoConocidoInput('');
    setEsperandoPesoConocido(false);
    mostrarMensaje('success', `Peso enviado: ${peso} kg. Esperando confirmación...`);
  }
};

// Enviar confirmación "ok" al Arduino
const enviarConfirmacion = async () => {
  const exito = await enviarComandoArduino('ok');
  if (exito) {
    console.log('✅ Confirmación OK enviada');
    setEsperandoConfirmacion(false);
    mostrarMensaje('success', 'Confirmación enviada. Iniciando pesaje...');
  }
};
```

### Detección en `procesarDatoArduinoRef`

```typescript
// 🔧 DETECCIÓN DE MENSAJES DE CALIBRACIÓN DEL ARDUINO
// Detectar si Arduino está pidiendo peso conocido
if (trimmedData.toLowerCase().includes('peso conocido') || 
    trimmedData.toLowerCase().includes('ingrese el peso') ||
    trimmedData.toLowerCase().includes('cual es el peso')) {
  console.log('⚙️ Arduino solicita peso conocido');
  setModoCalibacion(true);
  setEsperandoPesoConocido(true);
  setEsperandoConfirmacion(false);
  setMensajeArduino(trimmedData);
  return;
}

// Detectar si Arduino está pidiendo confirmación "ok"
if (trimmedData.toLowerCase().includes('escribir ok') ||
    trimmedData.toLowerCase().includes('escriba ok') ||
    trimmedData.toLowerCase().includes('ingrese ok')) {
  console.log('✅ Arduino solicita confirmación OK');
  setModoCalibacion(true);
  setEsperandoPesoConocido(false);
  setEsperandoConfirmacion(true);
  setMensajeArduino(trimmedData);
  return;
}

// Detectar si la calibración terminó
if (trimmedData.toLowerCase().includes('calibracion completa') ||
    trimmedData.toLowerCase().includes('calibración completa') ||
    trimmedData.toLowerCase().includes('listo para pesar') ||
    trimmedData.toLowerCase().includes('iniciando pesaje')) {
  console.log('🎉 Calibración completada');
  setModoCalibacion(false);
  setEsperandoPesoConocido(false);
  setEsperandoConfirmacion(false);
  setMensajeArduino('Calibración completada ✅');
  setTimeout(() => setMensajeArduino(''), 3000);
  return;
}
```

---

## 📝 Instrucciones para el Usuario

### Paso 1: Conectar Arduino

1. Asegúrate de que el Arduino esté conectado por USB
2. En el dashboard, haz click en **"Conectar Arduino"**
3. Selecciona el puerto COM correcto en el diálogo del navegador

### Paso 2: Calibración (Si Aparece)

Si el Arduino pide calibración (modal amarillo aparece):

1. **Ingresa el peso conocido**:
   - Coloca un objeto de peso conocido en la balanza
   - Ingresa el peso en kg (ej: 5.250)
   - Haz click en **"📤 Enviar Peso"** o presiona Enter

2. **Confirma**:
   - Cuando aparezca el botón verde
   - Haz click en **"✅ Confirmar (OK)"**

3. **Listo**:
   - El modal desaparecerá
   - Verás el peso en tiempo real

### Paso 3: Uso Normal

Una vez calibrado:
- El peso se actualiza cada 500ms
- Puedes hacer tara con el botón "Tara"
- Puedes configurar objetivo con el botón "Objetivo"
- Puedes guardar pesajes con el botón "Confirmar Peso"

---

## 🐛 Troubleshooting

### El modal no aparece

**Causa**: El Arduino ya estaba calibrado o no envía mensajes de calibración.

**Solución**: 
1. Desconecta el Arduino del dashboard
2. Resetea el Arduino (botón reset físico)
3. Vuelve a conectar desde el dashboard

### El peso no se actualiza después de calibrar

**Causa**: El Arduino no está enviando datos continuos.

**Solución**:
1. Verifica en la consola del navegador (F12) que estés recibiendo líneas como:
   ```
   📥 Procesando datos: OBJ:0.000;ACT:5.380;DIF:5.380
   ```
2. Si no ves esas líneas, el Arduino no está enviando datos
3. Verifica el código Arduino que esté enviando datos cada 500ms en el `loop()`

### El Arduino no responde a los comandos

**Causa**: Problema de comunicación serial.

**Solución**:
1. Desconecta y reconecta el Arduino
2. Cierra otras aplicaciones que puedan estar usando el puerto COM (Arduino IDE, Putty, etc.)
3. Verifica en la consola que veas: `✅ Comando enviado: [comando]`

---

## ✅ Ventajas de Esta Implementación

1. **No necesitas Arduino IDE**: Todo se hace desde el navegador
2. **Interfaz amigable**: Botones y campos claros
3. **Detección automática**: El dashboard detecta cuando Arduino pide calibración
4. **Logs claros**: En la consola (F12) puedes ver cada paso
5. **Compatible con cualquier Arduino**: Funciona con cualquier código que pida calibración por serial

---

## 🔄 Compatibilidad con Código Arduino

### ✅ Funciona con:
- Código que pide "peso conocido" al inicio
- Código que pide "ok" para confirmar
- Código que envía datos continuos después: `OBJ:X;ACT:X;DIF:X`

### ❌ No funciona con:
- Código que no pide calibración (pero igualmente funciona, solo no muestra el modal)
- Código que envía datos en formato diferente (pero puedes adaptarlo)

---

**Versión**: 1.0.0  
**Fecha**: Diciembre 2025  
**Archivo**: `dashboard-perdidas/src/components/PesajeTiempoReal.tsx`
