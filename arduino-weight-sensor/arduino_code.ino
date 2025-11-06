#include "HX711.h"
#include <LiquidCrystal_I2C.h>

// Pines HX711
#define DT_PIN 8
#define SCK_PIN 9

HX711 scale;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Factor de calibración
float calibration_factor = -111850.0;

// Variables de estado
float ref_weight = 0;
bool midiendo = false;
bool esperando_peso_personalizado = false;
bool modo_calibracion = false;
String codigo_saco_actual = "";
String fabrica_actual = "Balanza-1";

// Tolerancia en kg (5 g)
const float tolerancia = 0.005;

// Tiempo último envío (para no saturar)
unsigned long ultimo_envio = 0;
const unsigned long intervalo_envio = 2000; // Enviar cada 2 segundos

void mostrarMenu() {
  Serial.println("\n----------------------------------");
  Serial.println("MENU PRINCIPAL:");
  Serial.println("(1) 3 latas de palmitos (1.2 kg)");
  Serial.println("(2) Peso personalizado (1, 2 o 3 kg)");
  Serial.println("(t) TARA");
  Serial.println("(r) Reiniciar/Volver al Menú");
  Serial.println("(c) Calibrar");
  Serial.println("(s) Establecer código de saco");
  Serial.println("(f) Establecer fábrica");
  Serial.println("----------------------------------");

  lcd.clear();
  lcd.print("1: 1.2kg palmitos");
  lcd.setCursor(0, 1);
  lcd.print("2: peso perso.");
}

void setup() {
  Serial.begin(9600);
  lcd.init();
  lcd.backlight();

  lcd.print("Iniciando...");
  scale.begin(DT_PIN, SCK_PIN);

  while (!scale.is_ready()) delay(50);

  scale.set_scale(calibration_factor);
  lcd.clear();
  lcd.print("TARA...");
  for (int i = 0; i < 5; i++) {
    scale.tare();
    delay(100);
  }

  Serial.println("Tara lista (0.00 kg)");
  mostrarMenu();
}

void enviarDatosJSON(float peso, float diferencia) {
  // Envía en formato JSON para que Python lo capture
  Serial.print("{\"peso\":");
  Serial.print(peso, 3);
  Serial.print(",\"objetivo\":");
  Serial.print(ref_weight, 3);
  Serial.print(",\"diferencia\":");
  Serial.print(diferencia, 3);
  Serial.print(",\"codigo_saco\":\"");
  Serial.print(codigo_saco_actual.length() > 0 ? codigo_saco_actual : "SIN-CODIGO");
  Serial.print("\",\"fabrica\":\"");
  Serial.print(fabrica_actual);
  Serial.print("\",\"timestamp\":");
  Serial.print(millis());
  Serial.println("}");
}

void loop() {
  float weight = 0;
  if (scale.is_ready()) {
    long reading = scale.read_average(10);
    weight = (reading / calibration_factor);
  } else {
    Serial.println("HX711 not ready");
    delay(500);
    return;
  }

  // --- Entrada serial ---
  if (Serial.available()) {
    String entrada = Serial.readStringUntil('\n');
    entrada.trim();

    // MODO CALIBRACIÓN
    if (modo_calibracion) {
      float peso_ref = entrada.toFloat();
      if (peso_ref > 0) {
        long lectura_prom = scale.read_average(10);
        calibration_factor = lectura_prom / peso_ref;
        calibration_factor = -abs(calibration_factor);
        Serial.println("\n✅ Calibración completada.");
        Serial.print("Nuevo calibration_factor: ");
        Serial.println(calibration_factor, 2);
        lcd.clear();
        lcd.print("Nuevo factor:");
        lcd.setCursor(0, 1);
        lcd.print(calibration_factor, 0);
        modo_calibracion = false;
        delay(2000);
        mostrarMenu();
      } else {
        Serial.println("Valor inválido. Ingresa peso (ej: 1.2)");
      }
      return;
    }

    char opcion = entrada[0];

    if (opcion == 't' || opcion == 'T') {
      scale.tare();
      Serial.println("Tara aplicada (0.00 kg).");
      return;
    }
    else if (opcion == 'r' || opcion == 'R') {
      midiendo = false;
      mostrarMenu();
      return;
    }
    else if (opcion == 'c' || opcion == 'C') {
      modo_calibracion = true;
      Serial.println("\n--- MODO CALIBRACIÓN ---");
      Serial.println("Coloca un peso conocido y escribe su valor (kg).");
      lcd.clear();
      lcd.print("Modo calibracion");
      lcd.setCursor(0, 1);
      lcd.print("Ingresa peso...");
      return;
    }
    else if (opcion == 's' || opcion == 'S') {
      Serial.println("Ingresa código del saco:");
      String codigo = "";
      while (Serial.available() == 0) { delay(10); }
      codigo = Serial.readStringUntil('\n');
      codigo.trim();
      codigo_saco_actual = codigo;
      Serial.print("Código establecido: ");
      Serial.println(codigo_saco_actual);
      return;
    }
    else if (opcion == 'f' || opcion == 'F') {
      Serial.println("Ingresa nombre de fábrica:");
      String fab = "";
      while (Serial.available() == 0) { delay(10); }
      fab = Serial.readStringUntil('\n');
      fab.trim();
      fabrica_actual = fab;
      Serial.print("Fábrica establecida: ");
      Serial.println(fabrica_actual);
      return;
    }
    else if (opcion == '1') {
      ref_weight = 1.2;
      midiendo = true;
      Serial.println("Objetivo: 1.2 kg (3 latas palmitos).");
    }
    else if (opcion == '2') {
      esperando_peso_personalizado = true;
      Serial.println("Ingrese el peso objetivo (1, 2 o 3 kg):");
      lcd.clear();
      lcd.print("Peso Obj (1-3kg):");
      lcd.setCursor(0, 1);
      lcd.print("r para cancelar");
    }
    else if (esperando_peso_personalizado) {
      float nuevo_peso = entrada.toFloat();
      if (nuevo_peso >= 1 && nuevo_peso <= 3) {
        ref_weight = nuevo_peso;
        midiendo = true;
        esperando_peso_personalizado = false;
        Serial.print("Objetivo: ");
        Serial.print(ref_weight, 2);
        Serial.println(" kg.");
      } else {
        Serial.println("Solo 1, 2 o 3 kg son válidos.");
      }
    }
  }

  // --- Mostrar en pantalla ---
  lcd.setCursor(0, 0);
  lcd.print("Peso: ");
  lcd.print(weight, 2);
  lcd.print(" kg  ");

  // Calcular diferencia (si hay peso de referencia)
  float diferencia = 0;
  if (ref_weight > 0) {
    diferencia = weight - ref_weight;
  }

  // ENVIAR JSON SIEMPRE (cada 2 segundos) para que el dashboard siempre tenga datos
  unsigned long ahora = millis();
  if (ahora - ultimo_envio >= intervalo_envio) {
    enviarDatosJSON(weight, diferencia);
    ultimo_envio = ahora;
  }

  if (midiendo) {
    lcd.setCursor(0, 1);
    if (abs(diferencia) <= tolerancia) {
      lcd.print("Dif: OK!       ");
    } else {
      lcd.print("Dif: ");
      if (diferencia > 0) lcd.print("+");
      lcd.print(diferencia, 3);
      lcd.print("kg ");
    }

    Serial.print("Peso: ");
    Serial.print(weight, 3);
    Serial.print(" kg | Dif: ");
    Serial.println(diferencia, 3);
  } else {
    lcd.setCursor(0, 1);
    lcd.print("Factor:");
    lcd.print(calibration_factor, 0);
    lcd.print("   ");
  }

  delay(200);
}
