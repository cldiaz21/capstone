import serial
import sys

# Intentar abrir cada puerto COM
ports = ['COM3', 'COM4', 'COM5', 'COM6', 'COM7']

for port in ports:
    try:
        ser = serial.Serial(port, 9600, timeout=1)
        print(f"✅ {port} - DISPONIBLE y se puede abrir")
        ser.close()
    except serial.SerialException as e:
        print(f"❌ {port} - BLOQUEADO: {e}")
    except Exception as e:
        print(f"⚠️ {port} - Error: {e}")
