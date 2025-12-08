#include <HX711.h>
#include <LiquidCrystal_I2C.h>

HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);

float peso_actual = 0.0;
float peso_objetivo = 0.0;
float diferencia = 0.0;

// --- Calibración establecida ---
const float SCALE_VALOR = 98500.0;
const long OFFSET_VALOR = -91830;

unsigned long ultimoEnvio = 0;
unsigned long ultimoHeartbeat = 0;

void setup() {
  Serial.begin(9600);
  while (!Serial) {
    ; // esperar a que el puerto serie se conecte. Necesario para USB nativo
  }
  Serial.println("Arduino listo.");

  scale.begin(8, 9);  // DT, SCK
  scale.set_scale(SCALE_VALOR);
  scale.set_offset(OFFSET_VALOR);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Balanza lista");
  delay(1000);
  lcd.clear();
}

void loop() {
  // --- HEARTBEAT ---
  // Envía un latido cada 2 segundos para saber si el Arduino está vivo
  if (millis() - ultimoHeartbeat > 2000) {
    ultimoHeartbeat = millis();
    Serial.println("HEARTBEAT");
  }

  // Lectura estable promediando 10 muestras
  if (scale.is_ready()) {
    peso_actual = scale.get_units(10);
    diferencia = peso_actual - peso_objetivo;

    // Enviar datos al Serial solo si hay una nueva lectura
    if (millis() - ultimoEnvio > 500) {
      ultimoEnvio = millis();
      Serial.print("OBJ:");
      Serial.print(peso_objetivo, 3);
      Serial.print(";ACT:");
      Serial.print(peso_actual, 3);
      Serial.print(";DIF:");
      Serial.println(diferencia, 3);

      // Mostrar en LCD
      lcd.setCursor(0, 0);
      lcd.print("O:");
      lcd.print(peso_objetivo, 2);
      lcd.print(" A:");
      lcd.print(peso_actual, 2);
      lcd.print("   "); // limpia restos

      lcd.setCursor(0, 1);
      lcd.print("D:");
      lcd.print(diferencia, 3);
      lcd.print("   ");
    }
  } else {
    // Descomenta la siguiente línea si quieres un log constante cuando no está listo.
    // ¡CUIDADO! Puede inundar el puerto serial.
    // Serial.println("Scale not ready");
  }

  // Comandos desde el navegador
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd.startsWith("OBJ:")) {
      peso_objetivo = cmd.substring(4).toFloat();
      Serial.print("Nuevo objetivo: ");
      Serial.println(peso_objetivo);
    } 
    else if (cmd == "TARE") {
      scale.tare();
      peso_objetivo = 0;
      Serial.println("Tara realizada");
      lcd.clear();
      lcd.print("Tara OK");
      delay(800);
      lcd.clear();
    }
  }
}