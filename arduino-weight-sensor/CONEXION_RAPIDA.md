# 🚀 CONEXIÓN RÁPIDA - Arduino Ya Configurado

## ✅ Tu Arduino ya está configurado y funcionando

No necesitas instalar nada en el Arduino. Solo conectarlo al dashboard.

---

## 📋 PASOS (2 minutos):

### 1. Abre el navegador correcto
⚠️ **Usa Chrome o Edge** (Web Serial API no funciona en Firefox/Safari)

### 2. Ve al dashboard
👉 **http://localhost:5177/**

### 3. Navega a Pesaje
- Click en el menú: **"Pesaje Tiempo Real"**

### 4. Conecta el Arduino
- Click en botón: **"Conectar Arduino"** 🔌
- En la ventana emergente, selecciona el puerto del Arduino
- Click en **"Conectar"**

### 5. ¡Listo! 🎉
- Badge verde: **"● Arduino Conectado"**
- El peso se actualiza en tiempo real
- Selecciona fábrica
- Ingresa número de saco
- Confirma y guarda el peso

---

## ❓ SOLUCIÓN DE PROBLEMAS:

### No aparece el botón "Conectar Arduino"
- ✅ Verifica que estés usando Chrome o Edge
- ✅ El sitio debe estar en `localhost` o `https://`

### No aparece ningún puerto en la ventana
- ✅ Desconecta y vuelve a conectar el Arduino
- ✅ Asegúrate que el cable USB esté bien conectado
- ✅ Prueba con otro puerto USB de la computadora

### Aparece el puerto pero no se conecta
- ✅ Cierra cualquier programa que esté usando el puerto (Arduino IDE Serial Monitor, Python, etc.)
- ✅ Refresca la página del navegador (F5)
- ✅ Desconecta el Arduino, espera 5 segundos, y vuelve a conectar

### El peso no se actualiza (se queda en 0.000)
- ✅ Verifica en la consola del navegador (F12) si hay errores
- ✅ Desconecta y vuelve a conectar con el botón "Desconectar"
- ✅ Verifica que el Arduino esté encendido (LED prendido)

### "Permission denied" o error de permisos
- ✅ Cierra todas las pestañas del navegador y vuelve a abrir
- ✅ En Windows: Ejecuta el navegador como Administrador
- ✅ Verifica que no haya otro programa usando el puerto

---

## 🔍 Verificar que el Arduino envía datos (opcional):

Si quieres confirmar que el Arduino está funcionando correctamente:

1. Descarga Arduino IDE (si no lo tienes): https://www.arduino.cc/en/software
2. Abre Arduino IDE
3. `Tools → Serial Monitor` (Ctrl+Shift+M)
4. Selecciona el puerto del Arduino
5. Configura a **9600 baud**
6. Deberías ver datos JSON cada 2 segundos:
   ```json
   {"peso":0.523,"objetivo":1.200,"diferencia":-0.677,"codigo_saco":"","fabrica":"Balanza-1","timestamp":12345}
   ```

✅ Si ves esto = Arduino funciona perfectamente

⚠️ **IMPORTANTE:** Si abres el Serial Monitor, ciérralo antes de intentar conectar desde el dashboard (el puerto solo puede usarse por un programa a la vez)

---

## 💡 Flujo de trabajo recomendado:

```
1. Arduino conectado al USB ✅
2. Dashboard corriendo (http://localhost:5177) ✅
3. Abrir Chrome/Edge ✅
4. Ir a "Pesaje Tiempo Real" ✅
5. Click "Conectar Arduino" ✅
6. Seleccionar puerto ✅
7. ¡Pesar productos! 🎉
```

---

## 🎯 Usar la balanza:

1. **Seleccionar fábrica** del dropdown (ej: Fábrica A)
2. **Ingresar número de saco** (ej: SAC-001)
3. **Colocar producto** en la balanza
4. **Esperar** a que el peso se estabilice
5. **Click** en "Confirmar y Guardar Peso"
6. ✅ Peso guardado en Supabase
7. Aparece en el **historial** de pesajes

Para el siguiente saco:
- Cambia el número de saco (SAC-002, SAC-003, etc.)
- Coloca el nuevo producto
- Confirma y guarda
- Repite el proceso

---

## 🔄 Comandos útiles:

Si necesitas reiniciar el dashboard:
```powershell
cd "C:\Users\claud\OneDrive\Escritorio\Capstone\dashboard-perdidas"
npx vite
```

Luego abre: http://localhost:5177/

---

## 🆘 ¿Más ayuda?

- **WEB_SERIAL_GUIDE.md** - Guía completa de Web Serial API
- **README.md** - Documentación del proyecto
- Consola del navegador (F12) - Ver errores JavaScript
