import tkinter as tk
from tkinter import ttk, messagebox, simpledialog
import serial, threading, csv
from datetime import datetime
import os

# --- Configuración de conexión ---
PORT = 'COM6'
BAUD = 9600
arduino = None
running = True

# --- Datos de producto ---
PRODUCTOS = {
    "ATUN": {"nombre": "Saco de 5 latas de Atún", "unidades": 5},
    "PALMITO": {"nombre": "Saco de 3 latas de Palmitos", "unidades": 3}
}

# Variables globales
producto_actual = None
peso_base = None
ultimo_peso = 0.0
peso_objetivo = 0.0
tolerancia = 0.03  # por defecto 3%

# --- Funciones seriales ---
def conectar_serial():
    global arduino
    try:
        if arduino and arduino.is_open:
            arduino.close()
        arduino = serial.Serial(PORT, BAUD, timeout=1)
        arduino.reset_input_buffer()
        lbl_status.config(text=f"✅ Conectado a {PORT}", foreground="green")
    except Exception as e:
        lbl_status.config(text=f"❌ Error al conectar: {e}", foreground="red")

def enviar_cmd(cmd):
    if arduino and arduino.is_open:
        arduino.write((cmd + '\n').encode())

def leer_serial():
    global ultimo_peso, peso_objetivo
    while running:
        if arduino and arduino.in_waiting:
            try:
                data = arduino.readline().decode().strip()
                if data.startswith("OBJ:"):
                    partes = data.split(";")
                    obj = float(partes[0].split(":")[1])
                    act = float(partes[1].split(":")[1])
                    dif = float(partes[2].split(":")[1])
                    ultimo_peso = act
                    actualizar_pesos(obj, act, dif)
            except:
                pass

# --- Funciones GUI ---
def mostrar_pantalla(frame):
    for f in [frame_menu, frame_muestra, frame_pesaje]:
        f.pack_forget()
    frame.pack(fill="both", expand=True)

def seleccionar_producto(key):
    global producto_actual, peso_base
    producto_actual = key
    peso_base = None
    lbl_muestra_info.config(text=f"Seleccionado: {PRODUCTOS[key]['nombre']}")
    mostrar_pantalla(frame_muestra)

def tomar_muestra():
    global peso_base
    peso_base = ultimo_peso / 2  # promedio de 2 unidades
    lbl_base.config(text=f"Peso base: {peso_base:.3f} kg")
    messagebox.showinfo("Muestra tomada", f"Peso base registrado: {peso_base:.3f} kg")
    btn_continuar_pesaje.config(state="normal")

def continuar_a_pesaje():
    global peso_objetivo
    unidades = PRODUCTOS[producto_actual]["unidades"]
    peso_objetivo = peso_base * unidades
    enviar_cmd(f"OBJ:{peso_objetivo:.3f}")
    lbl_peso_obj.config(text=f"OBJ: {peso_objetivo:.3f} kg")
    mostrar_pantalla(frame_pesaje)

def actualizar_pesos(obj, act, dif):
    lbl_peso_act.config(text=f"ACT: {act:.3f} kg")
    lbl_peso_dif.config(text=f"DIF: {dif:.3f} kg")
    try:
        porc = abs(dif) / obj if obj > 0 else 0
        if porc <= tolerancia:
            estado = "✅ Dentro de tolerancia"
            color = "green"
        else:
            estado = "⚠️ Fuera de tolerancia"
            color = "red"
        lbl_estado.config(text=f"{estado} (±{tolerancia*100:.1f}%)", foreground=color)
    except:
        lbl_estado.config(text="...", foreground="black")

def guardar_csv():
    if not producto_actual or peso_base is None:
        messagebox.showerror("Error", "No hay datos para guardar.")
        return

    diferencia = ultimo_peso - peso_objetivo
    unidades_faltantes = diferencia / peso_base if peso_base > 0 else 0
    porcentaje_diferencia = (abs(diferencia) / peso_objetivo) * 100 if peso_objetivo > 0 else 0
    resultado = "ACEPTADO" if porcentaje_diferencia <= (tolerancia * 100) else "RECHAZADO"

    fecha = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    nombre = PRODUCTOS[producto_actual]['nombre']

    with open("registro_inventario.csv", "a", newline='') as f:
        writer = csv.writer(f)
        if f.tell() == 0:
            writer.writerow([
                "Fecha",
                "Saco Identificado",
                "Peso Base (kg)",
                "Peso Objetivo (kg)",
                "Peso Actual (kg)",
                "Unidades Faltantes/Sobrantes",
                "Tolerancia",
                "Resultado"
            ])
        writer.writerow([
            fecha,
            nombre,
            f"{peso_base:.3f}",
            f"{peso_objetivo:.3f}",
            f"{ultimo_peso:.3f}",
            f"{unidades_faltantes:.2f}",
            f"±{tolerancia*100:.1f}%",
            resultado
        ])

    messagebox.showinfo("Guardado", f"Registro guardado exitosamente.\nEstado: {resultado}")
    messagebox.showinfo("Ubicación del archivo", f"CSV guardado en:\n{os.path.abspath('registro_inventario.csv')}")
    volver_menu()

def volver_menu():
    enviar_cmd("TARE")
    mostrar_pantalla(frame_menu)

def tare():
    enviar_cmd("TARE")
    messagebox.showinfo("Tara", "Balanza puesta a cero.")

def cambiar_tolerancia():
    global tolerancia
    win = tk.Toplevel(root)
    win.title("Cambiar tolerancia")
    win.geometry("300x200")

    tk.Label(win, text="Selecciona un tipo de tolerancia:", font=("Arial", 11, "bold")).pack(pady=10)

    def set_tol(valor, txt):
        global tolerancia
        tolerancia = valor
        messagebox.showinfo("Tolerancia cambiada", f"Tolerancia ajustada a {txt}")
        win.destroy()

    ttk.Button(win, text="±2% → Reglamento Sanitario", command=lambda: set_tol(0.02, "±2% (RSA)")).pack(fill="x", pady=5)
    ttk.Button(win, text="±3% → INN ISO 2859", command=lambda: set_tol(0.03, "±3% (ISO 2859)")).pack(fill="x", pady=5)

    def custom_tol():
        try:
            val = float(simpledialog.askstring("Tolerancia personalizada", "Ingresa valor de tolerancia (%):"))
            if val <= 0:
                raise ValueError
            set_tol(val / 100, f"±{val:.1f}% personalizado")
        except:
            messagebox.showerror("Error", "Valor no válido")

    ttk.Button(win, text="🔧 Personalizado", command=custom_tol).pack(fill="x", pady=5)

# --- INTERFAZ ---
root = tk.Tk()
root.title("📦 Sistema de Control de Peso - Proyecto Final")
root.geometry("400x520")

lbl_status = ttk.Label(root, text="Conectando...", foreground="blue")
lbl_status.pack(pady=5)
ttk.Button(root, text="🔌 Conectar", command=conectar_serial).pack()

# --- Frame: Menú Principal ---
frame_menu = ttk.Frame(root, padding=15)
ttk.Label(frame_menu, text="Menú Principal", font=("Arial", 14, "bold")).pack(pady=10)

for key, val in PRODUCTOS.items():
    ttk.Button(frame_menu, text=val['nombre'], command=lambda k=key: seleccionar_producto(k)).pack(fill="x", pady=5)

ttk.Button(frame_menu, text="↩️ Tare / Cero", command=tare).pack(fill="x", pady=5)
ttk.Button(frame_menu, text="⚙️ Cambiar tolerancia", command=cambiar_tolerancia).pack(fill="x", pady=5)
ttk.Button(frame_menu, text="💾 Ver CSV", command=lambda: messagebox.showinfo("CSV", "El archivo se guarda como 'registro_inventario.csv'")).pack(fill="x", pady=5)

# --- Frame: Tomar muestra ---
frame_muestra = ttk.Frame(root, padding=15)
lbl_muestra_info = ttk.Label(frame_muestra, text="", font=("Arial", 11))
lbl_muestra_info.pack(pady=5)
ttk.Label(frame_muestra, text="Coloca 2 unidades de muestra y presiona 'Tomar muestra'").pack(pady=10)
ttk.Button(frame_muestra, text="📏 Tomar muestra", command=tomar_muestra).pack(pady=5)
ttk.Button(frame_muestra, text="↩️ Tare / Cero", command=tare).pack(fill="x", pady=5)
lbl_base = ttk.Label(frame_muestra, text="Peso base: --", font=("Arial", 12))
lbl_base.pack(pady=10)
btn_continuar_pesaje = ttk.Button(frame_muestra, text="Continuar al pesaje total", state="disabled", command=continuar_a_pesaje)
btn_continuar_pesaje.pack(pady=10)

# --- Frame: Pesaje total ---
frame_pesaje = ttk.Frame(root, padding=15)
ttk.Label(frame_pesaje, text="Pesaje total", font=("Arial", 14, "bold")).pack(pady=10)
lbl_peso_obj = ttk.Label(frame_pesaje, text="OBJ: -- kg", font=("Arial", 12))
lbl_peso_act = ttk.Label(frame_pesaje, text="ACT: -- kg", font=("Arial", 16, "bold"), foreground="#6A0DAD")
lbl_peso_dif = ttk.Label(frame_pesaje, text="DIF: -- kg", font=("Arial", 12))
lbl_estado = ttk.Label(frame_pesaje, text="...", font=("Arial", 11))
lbl_peso_obj.pack()
lbl_peso_act.pack()
lbl_peso_dif.pack()
lbl_estado.pack(pady=5)
ttk.Button(frame_pesaje, text="↩️ Tare / Cero", command=tare).pack(fill="x", pady=5)
ttk.Button(frame_pesaje, text="💾 Guardar CSV", command=guardar_csv).pack(fill="x", pady=5)
ttk.Button(frame_pesaje, text="🏠 Volver al menú", command=volver_menu).pack(fill="x", pady=5)

mostrar_pantalla(frame_menu)

# --- Hilo serial ---
threading.Thread(target=leer_serial, daemon=True).start()

def on_close():
    global running
    running = False
    if arduino:
        arduino.close()
    root.destroy()

root.protocol("WM_DELETE_WINDOW", on_close)
root.mainloop()
