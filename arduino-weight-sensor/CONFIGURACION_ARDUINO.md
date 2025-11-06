# 🔧 Configuración del Arduino - Primera Vez

## ⚠️ IMPORTANTE: Este es tu primer uso del Arduino
Como es la primera vez que conectas el Arduino, necesitas seguir estos pasos:

---

## 📝 PASO 1: Instalar Arduino IDE

1. Descarga Arduino IDE desde: https://www.arduino.cc/en/software
2. Instala el programa en tu computadora
3. Abre Arduino IDE

---

## 📚 PASO 2: Instalar las librerías necesarias

En Arduino IDE:

1. Ve a **Sketch → Include Library → Manage Libraries** (o presiona `Ctrl+Shift+I`)
2. Busca e instala estas librerías:
   - **HX711** by Bogdan Necula (para la celda de carga)
   - **LiquidCrystal I2C** by Frank de Brabander (para la pantalla LCD)

---

## 📤 PASO 3: Subir el código al Arduino

1. Conecta el Arduino a tu computadora por USB
2. En Arduino IDE, abre el archivo: `arduino_code.ino`
3. Selecciona tu placa:
   - Ve a **Tools → Board** 
   - Selecciona "Arduino Uno" (o el modelo que tengas)
4. Selecciona el puerto:
   - Ve a **Tools → Port**
   - Selecciona el puerto COM donde está conectado (ej: COM3, COM4, etc.)
5. Click en el botón **Upload** (flecha →) o presiona `Ctrl+U`
6. Espera a que diga "Done uploading"

---

## 🌐 PASO 4: Probar conexión con el Dashboard

### Opción A: Web Serial (RECOMENDADO - Sin Python)

1. Abre Chrome o Microsoft Edge (no funciona en otros navegadores)
2. Ve a: **http://localhost:5177**
3. Entra a la pestaña **"Pesaje Tiempo Real"**
4. Click en el botón **"Conectar Arduino"**
5. En la ventana que aparece, selecciona el puerto del Arduino
6. ¡El peso debería empezar a aparecer en tiempo real! 🎉

### Opción B: Python Script (Alternativa)

Si prefieres usar Python en lugar de Web Serial:

```powershell
# Instalar dependencias
cd "C:\Users\claud\OneDrive\Escritorio\Capstone\arduino-weight-sensor"
pip install -r requirements.txt

# Configurar variables de entorno
# Edita el archivo .env con tus credenciales de Supabase

# Ejecutar el script
python arduino_supabase_integration.py
```

---

## 🔍 Verificar que el Arduino está enviando datos

Antes de conectar al dashboard, verifica que el Arduino funciona:

1. En Arduino IDE, abre **Tools → Serial Monitor** (o presiona `Ctrl+Shift+M`)
2. Asegúrate que está configurado a **9600 baud**
3. Deberías ver datos en formato JSON cada 2 segundos:
   ```json
   {"peso":0.000,"objetivo":0.000,"diferencia":0.000,"codigo_saco":"","fabrica":"Balanza-1","timestamp":12345}
   ```

---

## ❓ Solución de problemas

### El Arduino no aparece en Ports
- Revisa que el cable USB funcione (prueba con otro cable)
- Instala los drivers del Arduino: https://www.arduino.cc/en/Guide/DriverInstallation
- En Windows, verifica en "Administrador de dispositivos" que aparezca el Arduino

### "Permission denied" al subir código
- Cierra cualquier programa que use el puerto COM (Serial Monitor, Python, etc.)
- Desconecta y vuelve a conectar el Arduino

### No aparece peso en el dashboard
1. Verifica primero en el Serial Monitor que el Arduino envía datos
2. Asegúrate de usar **Chrome o Edge** (Web Serial no funciona en Firefox/Safari)
3. El sitio debe estar en **localhost** o **HTTPS** (Web Serial requiere conexión segura)
4. Verifica en la consola del navegador (F12) si hay errores

### El peso no cambia
- Verifica las conexiones de la celda de carga (HX711)
- Revisa que el factor de calibración sea correcto (línea 12 del código)
- Haz TARA presionando "t" en el Serial Monitor

---

## 🎯 ¿Qué sigue después de configurar?

Una vez que el Arduino esté conectado y enviando datos:

1. Selecciona una **fábrica** del dropdown
2. Ingresa el **número de saco** (ej: SAC-001)
3. Coloca el peso en la balanza
4. Espera a que se estabilice
5. Click en **"Confirmar y Guardar Peso"**
6. ¡Listo! El peso se guardará en Supabase 🎉

---

## 📊 Flujo completo de trabajo

```
Arduino (HX711) 
    ↓ USB
Computadora
    ↓ Web Serial API
Navegador (Chrome/Edge)
    ↓ HTTP
Dashboard React
    ↓ API REST
Supabase Database
```

---

## 🆘 ¿Necesitas ayuda?

Si tienes problemas, revisa:
- **WEB_SERIAL_GUIDE.md** - Guía detallada de Web Serial API
- **README.md** - Información general del proyecto
- Serial Monitor del Arduino IDE - Para debug directo del Arduino
