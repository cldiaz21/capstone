# ⚡ GUÍA RÁPIDA - Primera Conexión Arduino

## 🔴 PROBLEMA: No veo el peso en el dashboard

### ✅ SOLUCIÓN (10 minutos):

---

## PASO 1: Instalar Arduino IDE
👉 https://www.arduino.cc/en/software
- Descarga e instala Arduino IDE 2.0

---

## PASO 2: Instalar librerías
En Arduino IDE:
- Menú: `Sketch → Include Library → Manage Libraries`
- Instalar:
  - ✅ **HX711** by Bogdan Necula
  - ✅ **LiquidCrystal I2C** by Frank de Brabander

---

## PASO 3: Subir código al Arduino
1. Abre: `arduino_code.ino`
2. `Tools → Board` → Arduino Uno (o tu modelo)
3. `Tools → Port` → COM3/COM4/COM5 (el que aparezca)
4. Click botón ➡️ **Upload**
5. Espera "Done uploading" ✅

---

## PASO 4: Verificar que funciona
En Arduino IDE:
- `Tools → Serial Monitor` (Ctrl+Shift+M)
- Configurar a **9600 baud** (abajo a la derecha)
- Deberías ver datos JSON cada 2 segundos:
  ```json
  {"peso":0.000,"objetivo":0.000,"diferencia":0.000}
  ```

✅ **Si ves esto = Arduino funciona correctamente**

---

## PASO 5: Conectar al Dashboard

### El dashboard ya está corriendo en: http://localhost:5177

1. Abre **Chrome o Edge** (⚠️ NO Firefox/Safari)
2. Ve a: `http://localhost:5177`
3. Pestaña: **"Pesaje Tiempo Real"**
4. Botón: **"Conectar Arduino"**
5. Selecciona el puerto COM del Arduino
6. 🎉 **¡Listo! Verás el peso en tiempo real**

---

## 🎯 Usar la balanza:

1. **Seleccionar fábrica** (dropdown)
2. **Ingresar número de saco** (ej: SAC-001)
3. **Colocar peso** en la balanza
4. **Confirmar y Guardar Peso**
5. ✅ Guardado en Supabase

---

## ❌ Problemas comunes:

### "No veo el puerto COM"
- Verifica cable USB (prueba otro cable)
- Instala drivers: https://www.arduino.cc/en/Guide/DriverInstallation
- Administrador de dispositivos → Debe aparecer "Arduino"

### "Permission denied al subir"
- Cierra Serial Monitor
- Cierra cualquier programa usando el puerto
- Desconecta y reconecta Arduino

### "Botón Conectar Arduino no hace nada"
- Usa Chrome o Edge (Web Serial no funciona en Firefox)
- El sitio debe estar en localhost o HTTPS

### "Peso siempre en 0.000"
- Verifica conexiones HX711
- Haz TARA (presiona 't' en Serial Monitor)
- Revisa calibración (línea 12 del código)

---

## 🆘 Comandos del Serial Monitor:

Una vez cargado el código, puedes enviar comandos:
- `t` = Hacer TARA (poner en cero)
- `1` = Modo 3 latas (1.2 kg)
- `2` = Peso personalizado
- `r` = Reiniciar
- `c` = Calibrar

---

## 💡 Flujo de datos:

```
Arduino HX711
    ↓ (USB)
Computadora
    ↓ (Web Serial API)
Chrome/Edge
    ↓ (React)
Dashboard
    ↓ (API)
Supabase
```

**NO necesitas Python** - La conexión es directa del navegador al Arduino.
