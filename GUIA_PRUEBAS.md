# 🧪 Guía de Pruebas - Sistema de Pesaje Arduino

## 📋 Pre-requisitos

### Hardware Necesario:
- ✅ Arduino conectado por USB con código de pesaje cargado
- ✅ Celda de carga HX711 conectada y calibrada
- ✅ LCD I2C funcionando correctamente

### Software Necesario:
- ✅ Google Chrome o Microsoft Edge (Web Serial API)
- ✅ Dashboard desplegado en Vercel o corriendo localmente

---

## 🚀 Pasos para Probar

### **1. Preparar el Arduino**

```cpp
// Verificar que el código Arduino envíe este formato:
Serial.print("OBJ:");
Serial.print(peso_objetivo, 3);
Serial.print(";ACT:");
Serial.print(peso_actual, 3);
Serial.print(";DIF:");
Serial.println(diferencia, 3);
// Ejemplo: OBJ:0.000;ACT:5.380;DIF:5.380
```

**Checklist Arduino:**
- [ ] Código cargado y corriendo
- [ ] Monitor Serial muestra líneas como `OBJ:X.XXX;ACT:X.XXX;DIF:X.XXX`
- [ ] Baud rate configurado en 9600
- [ ] Cable USB conectado correctamente

---

### **2. Abrir el Dashboard**

#### **Opción A: Vercel (Producción)**
1. Ve a: `https://tu-proyecto.vercel.app`
2. Inicia sesión con tus credenciales

#### **Opción B: Local (Desarrollo)**
```powershell
cd "c:\Users\claud\OneDrive\Escritorio\Capstone\dashboard-perdidas"
npm run dev
```
3. Abre: `http://localhost:5173`

---

### **3. Conectar Arduino al Dashboard**

1. **Clic en "Pesaje Tiempo Real"** en el menú lateral
2. **Clic en botón "Conectar Arduino"** (ícono USB)
3. **Seleccionar puerto serial** en el popup del navegador
   - Busca algo como: `USB Serial Device (COM3)` o similar
4. **Verificar conexión exitosa:**
   - Badge verde que dice "Conectado"
   - Console (F12) muestra: `✅ Puerto abierto exitosamente`

---

### **4. Verificar Datos en Tiempo Real**

#### **✅ Verificación Visual (UI)**
- [ ] El número grande del peso **cambia en tiempo real**
- [ ] El peso objetivo se muestra correctamente
- [ ] La diferencia se calcula y muestra
- [ ] El gráfico se actualiza con nuevos puntos

#### **✅ Verificación en Console (F12)**
Deberías ver logs como:
```
⚖️ [14:23:45] Peso: 5.380 kg | Obj: 0.000 kg | Dif: 5.380 kg
⚖️ [14:23:46] Peso: 5.385 kg | Obj: 0.000 kg | Dif: 5.385 kg
⚖️ [14:23:47] Peso: 5.382 kg | Obj: 0.000 kg | Dif: 5.382 kg
```

**❌ NO deberías ver:**
```
📦 Datos crudos recibidos (Uint8Array): ...  ❌ (Eliminado)
📜 Chunk decodificado: ...                  ❌ (Eliminado)
⏳ Esperando datos del reader...            ❌ (Eliminado)
```

---

### **5. Probar Funcionalidad TARA**

1. **Con peso en la balanza**, clic en botón **"TARA"**
2. **Verificar:**
   - [ ] Arduino recibe comando (LED parpadea si lo programaste)
   - [ ] Peso se resetea a 0.000
   - [ ] Console muestra: `📤 Comando enviado: TARE`

---

### **6. Probar Establecer Peso Objetivo**

1. **Clic en botón "Establecer Peso Objetivo"**
2. **Ingresar valor:** Por ejemplo `5.250`
3. **Clic en "Establecer"**
4. **Verificar:**
   - [ ] Peso objetivo se actualiza en UI
   - [ ] Arduino recibe comando `OBJ:5.250`
   - [ ] Diferencia se calcula correctamente
   - [ ] Console muestra: `📤 Comando enviado: OBJ:5.250`

---

### **7. Probar Guardar Registro**

1. **Con peso estable** (diferencia pequeña)
2. **Llenar campos:**
   - Número de saco
   - Seleccionar fábrica
   - Seleccionar producto
3. **Clic en "Guardar Registro"**
4. **Verificar:**
   - [ ] Mensaje de éxito aparece
   - [ ] Registro aparece en tabla inferior
   - [ ] Datos guardados en Supabase

---

## 🐛 Solución de Problemas Comunes

### **Problema: No se muestra el peso**

#### **Diagnóstico:**
1. Abre Console (F12)
2. Busca logs `⚖️` con datos
3. Si NO aparecen, el problema es de conexión/formato

#### **Soluciones:**
- [ ] Verificar que Arduino esté enviando formato correcto
- [ ] Reconectar Arduino (desconectar y conectar)
- [ ] Refrescar página del dashboard
- [ ] Verificar que no haya otro programa usando el puerto serial

---

### **Problema: Badge dice "Conectado" pero peso en 0.000**

#### **Diagnóstico:**
1. Console (F12) → ¿Hay logs `⚖️`?
2. Monitor Serial Arduino → ¿Se ven líneas `OBJ:X;ACT:X;DIF:X`?

#### **Soluciones:**
- [ ] Verificar formato de datos del Arduino
- [ ] Asegurar que use `Serial.println()` y no solo `Serial.print()`
- [ ] Verificar que termine líneas con `\n`

---

### **Problema: Datos aparecen pero son incorrectos**

#### **Diagnóstico:**
Console muestra `⚖️` con valores pero están mal

#### **Soluciones:**
- [ ] Calibrar Arduino (peso conocido)
- [ ] Verificar `SCALE_VALOR` y `OFFSET_VALOR` en código Arduino
- [ ] Probar TARA con balanza vacía

---

### **Problema: Console muestra "⚠️ Formato no reconocido"**

#### **Soluciones:**
- [ ] Verificar regex en procesarDatoArduinoRef
- [ ] Confirmar formato exacto: `OBJ:0.000;ACT:5.380;DIF:5.380`
- [ ] No debe haber espacios adicionales
- [ ] Números con 3 decimales

---

## 📊 Checklist de Prueba Completa

### **Conexión:**
- [ ] Puerto serial se abre correctamente
- [ ] Badge verde "Conectado" aparece
- [ ] No hay errores en console

### **Recepción de Datos:**
- [ ] Peso se actualiza en tiempo real
- [ ] Logs `⚖️` aparecen cada ~500ms
- [ ] Gráfico se dibuja correctamente

### **Comandos a Arduino:**
- [ ] TARA resetea peso
- [ ] Establecer objetivo funciona
- [ ] Arduino responde a comandos

### **Interfaz de Usuario:**
- [ ] Números se actualizan visualmente
- [ ] Colores cambian según diferencia (verde/amarillo/rojo)
- [ ] Gráfico es legible y útil
- [ ] Botones responden correctamente

### **Guardado de Datos:**
- [ ] Registros se guardan en Supabase
- [ ] Tabla se actualiza automáticamente
- [ ] No hay errores de base de datos

---

## 🎯 Casos de Uso de Ejemplo

### **Caso 1: Pesaje de Saco de Harina**
1. Conectar Arduino
2. Poner recipiente vacío → TARA
3. Establecer objetivo: 50.000 kg
4. Llenar hasta que diferencia sea < 0.100
5. Ingresar código de saco y fábrica
6. Guardar registro

### **Caso 2: Calibración Rápida**
1. Conectar Arduino
2. Poner peso conocido (5 kg)
3. Verificar lectura en dashboard
4. Si no coincide, recalibrar Arduino
5. TARA con balanza vacía

### **Caso 3: Monitoreo Continuo**
1. Conectar Arduino
2. Dejar corriendo sin cerrar pestaña
3. Verificar que siga leyendo datos
4. Revisar estabilidad del gráfico

---

## 📈 Métricas de Rendimiento

### **Tiempos Esperados:**
- Conexión: < 2 segundos
- Primer dato: < 1 segundo
- Actualización UI: ~500ms (cada lectura)
- Guardado registro: < 1 segundo

### **Consumo de Recursos:**
- CPU: < 5% (navegador)
- RAM: < 200 MB
- Red: Mínimo (solo guardado)

---

## 🔍 Debug Avanzado

### **Ver Datos Crudos del Arduino:**
En código, temporalmente agrega:
```typescript
console.log('RAW:', trimmedData);
```
Antes de procesarDatoArduinoRef.current(trimmedData)

### **Ver Estado Completo:**
```typescript
console.log({
  pesoActual,
  pesoObjetivo,
  diferencia,
  conectado,
  datosRecibidos
});
```

---

## ✅ Criterios de Éxito

El sistema pasa todas las pruebas si:
1. ✅ Conecta sin errores
2. ✅ Muestra peso en < 1 segundo
3. ✅ Actualiza en tiempo real (cada ~500ms)
4. ✅ Comandos (TARA, OBJ) funcionan
5. ✅ Guarda registros correctamente
6. ✅ No hay errores en console (salvo warnings normales)
7. ✅ UI responde fluida y rápidamente

---

*Guía de pruebas generada - Sistema de Pesaje Industrial*
*Última actualización: 2025*
