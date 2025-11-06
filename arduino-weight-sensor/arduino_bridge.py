"""
Arduino Weight Bridge - Lee datos del Arduino y los envía a Supabase
Autor: Dashboard Comercial Marisol
Fecha: Noviembre 2025
"""

import serial
import json
import time
from datetime import datetime
import os
from supabase import create_client, Client

# ==================== CONFIGURACIÓN ====================

# Puerto serial del Arduino (cambiar según tu sistema)
# Windows: 'COM3', 'COM4', etc.
# Mac/Linux: '/dev/ttyUSB0', '/dev/cu.usbserial', etc.
ARDUINO_PORT = 'COM3'  # ⚠️ CAMBIAR ESTO
BAUD_RATE = 9600

# Credenciales de Supabase (obtener del dashboard)
SUPABASE_URL = "https://tu-proyecto.supabase.co"  # ⚠️ CAMBIAR ESTO
SUPABASE_KEY = "tu-anon-key-aqui"  # ⚠️ CAMBIAR ESTO

# ========================================================

def inicializar_supabase() -> Client:
    """Inicializa el cliente de Supabase"""
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Conectado a Supabase")
        return supabase
    except Exception as e:
        print(f"❌ Error conectando a Supabase: {e}")
        return None

def inicializar_arduino() -> serial.Serial:
    """Inicializa la conexión serial con Arduino"""
    try:
        ser = serial.Serial(ARDUINO_PORT, BAUD_RATE, timeout=1)
        time.sleep(2)  # Esperar a que Arduino se inicialice
        print(f"✅ Conectado a Arduino en {ARDUINO_PORT}")
        return ser
    except Exception as e:
        print(f"❌ Error conectando a Arduino: {e}")
        print("Puertos disponibles:")
        import serial.tools.list_ports
        for port in serial.tools.list_ports.comports():
            print(f"  - {port.device}: {port.description}")
        return None

def enviar_a_supabase(supabase: Client, datos: dict):
    """Envía los datos del peso a Supabase"""
    try:
        # Preparar datos para insertar
        registro = {
            'peso_actual': datos['peso'],
            'peso_objetivo': datos['objetivo'],
            'diferencia': datos['diferencia'],
            'codigo_saco': datos['codigo_saco'],
            'fabrica': datos['fabrica'],
            'timestamp': datetime.now().isoformat(),
            'estado': 'OK' if abs(datos['diferencia']) <= 0.005 else 'FUERA_RANGO'
        }
        
        # Insertar en la tabla
        response = supabase.table('pesajes_tiempo_real').insert(registro).execute()
        
        print(f"📊 Peso registrado: {datos['peso']:.3f} kg | Dif: {datos['diferencia']:+.3f} kg | {datos['codigo_saco']}")
        return True
        
    except Exception as e:
        print(f"⚠️ Error enviando a Supabase: {e}")
        return False

def main():
    """Función principal"""
    print("\n" + "="*60)
    print("🔗 ARDUINO → DASHBOARD BRIDGE")
    print("="*60 + "\n")
    
    # Inicializar conexiones
    supabase = inicializar_supabase()
    arduino = inicializar_arduino()
    
    if not arduino or not supabase:
        print("\n❌ No se pudo inicializar. Verifica la configuración.")
        return
    
    print("\n✅ Sistema listo. Esperando datos del Arduino...")
    print("Presiona Ctrl+C para detener.\n")
    
    try:
        while True:
            if arduino.in_waiting > 0:
                linea = arduino.readline().decode('utf-8', errors='ignore').strip()
                
                # Buscar líneas que contengan JSON
                if linea.startswith('{') and linea.endswith('}'):
                    try:
                        datos = json.loads(linea)
                        
                        # Validar que tenga los campos necesarios
                        if all(k in datos for k in ['peso', 'objetivo', 'diferencia']):
                            enviar_a_supabase(supabase, datos)
                        
                    except json.JSONDecodeError:
                        pass  # Ignorar líneas que no sean JSON válido
                else:
                    # Mostrar otros mensajes del Arduino
                    if linea and not linea.startswith("Peso:"):
                        print(f"[Arduino] {linea}")
            
            time.sleep(0.1)  # Pequeña pausa para no saturar CPU
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Bridge detenido por el usuario")
    except Exception as e:
        print(f"\n❌ Error: {e}")
    finally:
        if arduino:
            arduino.close()
            print("🔌 Puerto serial cerrado")

if __name__ == "__main__":
    main()
