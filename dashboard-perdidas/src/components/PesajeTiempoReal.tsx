import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Scale, CheckCircle, AlertTriangle, Usb, StopCircle, Save, RotateCcw, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface PesajeEnVivo {
  id: string;
  codigo: string;
  pedido_id: string;
  fabrica_id: string;
  peso_objetivo: number;
  peso_real: number;
  diferencia: number;
  estado: 'OK' | 'FUERA_RANGO';
  fecha_pesaje: string;
}

// Tipos auxiliares: Arduino envía JSON, manejamos directamente en runtime

interface Fabrica {
  id: string;
  nombre: string;
  codigo: string;
}

const PesajeTiempoReal: React.FC = () => {
  // Estados de conexión Arduino
  const [port, setPort] = useState<SerialPort | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  // reader puede devolver Uint8Array (desde serial) o string (si se usa TextDecoderStream).
  const readerRef = useRef<ReadableStreamDefaultReader<any> | null>(null);
  const leyendoRef = useRef<boolean>(false); // Ref para controlar el loop de lectura
  const ultimaActualizacionRef = useRef<Date>(new Date());
  
  // Estados para calibración interactiva del Arduino
  const [modoCalibacion, setModoCalibacion] = useState(false);
  const [esperandoPesoConocido, setEsperandoPesoConocido] = useState(false);
  const [esperandoConfirmacion, setEsperandoConfirmacion] = useState(false);
  const [pesoConocidoInput, setPesoConocidoInput] = useState('');
  const [mensajeArduino, setMensajeArduino] = useState('');
  
  // Estados de datos del pesaje
  const [pesoActual, setPesoActual] = useState(0);
  const [pesoObjetivo, setPesoObjetivo] = useState(0);
  const [diferencia, setDiferencia] = useState(0);
  
  // Estados del flujo simplificado
  const [fabricas, setFabricas] = useState<Fabrica[]>([]);
  const [fabricaSeleccionada, setFabricaSeleccionada] = useState<string>('');
  const [numeroSaco, setNumeroSaco] = useState('');
  const [listo, setListo] = useState(false);
  
  // Estados adicionales del Arduino
  const [codigoSacoArduino, setCodigoSacoArduino] = useState<string>('');
  const [fabricaArduino, setFabricaArduino] = useState<string>('');
  const [ultimaLectura, setUltimaLectura] = useState<Date | null>(null);
  const [datosRecibidos, setDatosRecibidos] = useState<boolean>(false);
  const [actualizacionKey, setActualizacionKey] = useState<number>(0); // Para forzar re-render
  
  // Estados de historial
  const [historialPesajes, setHistorialPesajes] = useState<PesajeEnVivo[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState<'success' | 'error' | 'info'>('info');

  // Estados para gráfico en tiempo real
  const [datosGrafico, setDatosGrafico] = useState<Array<{tiempo: string, peso: number, objetivo: number}>>([]);
  const maxPuntosGrafico = 50; // Últimos 50 puntos

  // Estados para configuración
  const [mostrarConfigObjetivo, setMostrarConfigObjetivo] = useState(false);
  const [nuevoObjetivo, setNuevoObjetivo] = useState('');

  // Verificar soporte Web Serial API
  const isSerialSupported = 'serial' in navigator;

  // Conectar Arduino
  const conectarArduino = async () => {
    console.log('🎬 conectarArduino() llamada - iniciando conexión...');
    setConnectionStatus('connecting');
    
    try {
      if (!isSerialSupported) {
        console.error('❌ Navegador no soporta Web Serial API');
        mostrarMensaje('error', 'Tu navegador no soporta Web Serial API. Usa Chrome o Edge.');
        setConnectionStatus('error');
        return;
      }

      console.log('📋 Solicitando puerto serial al usuario...');
      const selectedPort = await (navigator as any).serial.requestPort();
      console.log('🔌 Puerto seleccionado, abriendo a 9600 baud...');
      await selectedPort.open({ baudRate: 9600 });
      console.log('✅ Puerto abierto exitosamente');
      
      setPort(selectedPort);
      setConnectionStatus('connected');
      mostrarMensaje('success', '✅ Arduino conectado correctamente');
      
      console.log('📖 Iniciando lectura de datos...');
      // Iniciar lectura de datos
      iniciarLectura(selectedPort);
    } catch (error: any) {
      console.error('❌ Error conectando Arduino:', error);
      mostrarMensaje('error', 'Error al conectar Arduino: ' + error.message);
      setConnectionStatus('error');
    }
  };

  // Enviar comando al Arduino
  const enviarComandoArduino = async (comando: string) => {
    if (!port || connectionStatus !== 'connected') {
      mostrarMensaje('error', 'Arduino no está conectado');
      return false;
    }

    try {
      const writer = port.writable?.getWriter();
      if (writer) {
        const encoder = new TextEncoder();
        await writer.write(encoder.encode(comando + '\n'));
        writer.releaseLock();
        console.log('✅ Comando enviado:', comando);
        return true;
      }
    } catch (error: any) {
      console.error('❌ Error enviando comando:', error);
      mostrarMensaje('error', 'Error enviando comando: ' + error.message);
      return false;
    }
    return false;
  };

  // Hacer Tara (resetear peso a cero)
  const hacerTara = async () => {
    const exito = await enviarComandoArduino('TARE');
    if (exito) {
      mostrarMensaje('success', '✅ Tara realizada correctamente');
      setPesoActual(0);
      setDiferencia(0);
    }
  };

  // Configurar peso objetivo
  const configurarPesoObjetivo = async () => {
    const objetivo = parseFloat(nuevoObjetivo);
    if (isNaN(objetivo) || objetivo < 0) {
      mostrarMensaje('error', 'Ingresa un peso objetivo válido');
      return;
    }

    const exito = await enviarComandoArduino(`OBJ:${objetivo.toFixed(3)}`);
    if (exito) {
      setPesoObjetivo(objetivo);
      setMostrarConfigObjetivo(false);
      setNuevoObjetivo('');
      mostrarMensaje('success', `✅ Peso objetivo configurado: ${objetivo} kg`);
    }
  };

  // Desconectar Arduino
  const desconectarArduino = async () => {
    try {
      // Detener el loop de lectura
      leyendoRef.current = false;
      
      if (readerRef.current) {
        try {
          await readerRef.current.cancel();
        } catch (e) {
          // Ignorar errores al cancelar
        }
        try {
          readerRef.current.releaseLock();
        } catch (e) {
          // Ignorar errores al liberar
        }
        readerRef.current = null;
      }
      
      if (port) {
        try {
          await port.close();
        } catch (e) {
          console.error('Error cerrando puerto:', e);
        }
        setPort(null);
      }
      
      setConnectionStatus('disconnected');
      setDatosRecibidos(false);
      mostrarMensaje('info', 'Arduino desconectado');
    } catch (error: any) {
      console.error('Error desconectando:', error);
      mostrarMensaje('error', 'Error al desconectar: ' + error.message);
      setConnectionStatus('error');
    }
  };

  // Leer datos del Arduino de forma continua
  const iniciarLectura = async (serialPort: SerialPort) => {
    console.log('🚀 iniciarLectura() llamada');
    leyendoRef.current = true;

    // Usar el reader directamente y decodificar bytes a texto
    console.log('📡 Obteniendo reader del puerto...');
    const reader = serialPort.readable!.getReader() as ReadableStreamDefaultReader<Uint8Array>;
    readerRef.current = reader;
    const decoder = new TextDecoder('utf-8');
    console.log('✅ Reader obtenido, iniciando loop de lectura continua...');

    let buffer = '';

    // Función recursiva para leer continuamente
    const leerContinuamente = async () => {
      while (leyendoRef.current) {
        try {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log('⚠️ Stream terminado');
            leyendoRef.current = false;
            break;
          }

          if (value && value.length > 0) {
            // Decodificar bytes a texto
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;

            // Procesar todas las líneas completas (separadas por \n o \r\n)
            const lines = buffer.split(/\r?\n/);
            // Guardar la última línea (potencialmente incompleta) en el buffer
            buffer = lines.pop() || '';

            // Procesar cada línea completa
            for (const line of lines) {
              const trimmedLine = line.trim();
              if (trimmedLine) {
                // Llamar a la función de procesamiento usando la ref
                if (procesarDatoArduinoRef.current) {
                  procesarDatoArduinoRef.current(trimmedLine);
                }
              }
            }
          }
        } catch (readError: any) {
          // Si el error es por cancelación, salir
          if (readError.name === 'AbortError' || 
              readError.message?.includes('cancel') || 
              readError.message?.includes('release') ||
              readError.message?.includes('aborted')) {
            console.log('📴 Lectura cancelada por usuario');
            break;
          }
          console.error('❌ Error en lectura:', readError);
          leyendoRef.current = false; // Detener el loop en caso de error inesperado
          setConnectionStatus('error');
          mostrarMensaje('error', 'Error de lectura: ' + readError.message);
          break; // Salir del loop
        }
      }
      console.log('🛑 Loop de lectura terminado.');
    };

    // Iniciar lectura continua
    try {
      await leerContinuamente();
    } catch (error: any) {
      console.error('❌ Error en loop de lectura:', error);
      if (!error.message?.includes('cancel') && !error.message?.includes('abort')) {
        mostrarMensaje('error', 'Error de lectura: ' + error.message);
      }
    } finally {
      console.log('🧹 Limpiando recursos de lectura...');
      leyendoRef.current = false;
      
      try {
        if (readerRef.current) {
          await readerRef.current.cancel();
        }
      } catch {
        console.log('⚠️ Error al cancelar reader (esperado si ya estaba cerrado)');
      }
      
      try {
        if (readerRef.current) {
          readerRef.current.releaseLock();
        }
      } catch {
        console.log('⚠️ Error al liberar lock (esperado si ya estaba liberado)');
      }
      
      readerRef.current = null;
      console.log('✅ Recursos limpiados');
    }
  };

  // Procesar datos del Arduino - función que se llama desde el loop de lectura
  // Esta función actualiza los estados para mostrar los datos en tiempo real
  const procesarDatoArduinoRef = useRef<(data: string) => void>(() => {});

  // Inicializar la función de procesamiento
  useEffect(() => {
    procesarDatoArduinoRef.current = (data: string) => {
      const trimmedData = data.trim();
      if (!trimmedData) return;

      console.log('📥 Procesando datos:', trimmedData.substring(0, 80));
      
      // Ignorar mensajes informativos del Arduino
      if (trimmedData === 'HEARTBEAT' || 
          trimmedData === 'Arduino listo.' ||
          trimmedData.startsWith('Nuevo objetivo:') ||
          trimmedData === 'Tara realizada') {
        console.log('ℹ️ Mensaje informativo:', trimmedData);
        return;
      }
      
      // 🔧 DETECCIÓN DE MENSAJES DE CALIBRACIÓN (OPCIONAL - solo si tu Arduino los envía)
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
      
      try {
        // Intentar parsear JSON completo primero (formato que envía el Arduino)
        // El Arduino envía: {"peso":X,"objetivo":X,"diferencia":X,"codigo_saco":"...","fabrica":"...","timestamp":X}
        if (trimmedData.startsWith('{') && trimmedData.endsWith('}')) {
          try {
            const jsonData = JSON.parse(trimmedData);
            
            // Validar que tenga al menos el campo peso
            if (jsonData.peso !== undefined && jsonData.peso !== null) {
              const ahora = new Date();
              
              // Actualizar peso actual - SIEMPRE actualizar para mostrar en tiempo real
              const peso = parseFloat(jsonData.peso) || 0;
              setPesoActual(peso); // Actualizar directamente para mostrar en tiempo real
              
              // Actualizar peso objetivo
              if (jsonData.objetivo !== undefined && jsonData.objetivo !== null) {
                const objetivo = parseFloat(jsonData.objetivo) || 0;
                setPesoObjetivo(objetivo);
              }
              
              // Actualizar diferencia
              if (jsonData.diferencia !== undefined && jsonData.diferencia !== null) {
                const diferencia = parseFloat(jsonData.diferencia) || 0;
                setDiferencia(diferencia);
              }
              
              // Actualizar código de saco desde Arduino
              if (jsonData.codigo_saco !== undefined && jsonData.codigo_saco) {
                const codigo = String(jsonData.codigo_saco).trim();
                if (codigo && codigo !== 'SIN-CODIGO') {
                  setCodigoSacoArduino(codigo);
                  // Auto-completar el campo de número de saco si está vacío
                  setNumeroSaco(prev => prev.trim() ? prev : codigo);
                }
              }
              
              // Actualizar fábrica desde Arduino
              if (jsonData.fabrica !== undefined && jsonData.fabrica) {
                const fabricaNombre = String(jsonData.fabrica).trim();
                setFabricaArduino(fabricaNombre);
              }
              
              // Marcar que recibimos datos y actualizar timestamp
              setDatosRecibidos(true);
              setUltimaLectura(ahora);
              ultimaActualizacionRef.current = ahora;
              
              // Forzar re-render para asegurar que la UI se actualice
              setActualizacionKey(prev => prev + 1);

              // Agregar punto al gráfico
              setDatosGrafico(prev => {
                const obj = parseFloat(jsonData.objetivo) || 0;
                const nuevoPunto = {
                  tiempo: ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                  peso: peso,
                  objetivo: obj
                };
                const nuevosDatos = [...prev, nuevoPunto];
                // Mantener solo los últimos maxPuntosGrafico puntos
                return nuevosDatos.slice(-maxPuntosGrafico);
              });

              console.log(`✅ [${ahora.toLocaleTimeString()}] Peso: ${peso.toFixed(3)} kg | Obj: ${jsonData.objetivo || 0} kg | Dif: ${jsonData.diferencia || 0} kg`);
              return;
            }
          } catch (jsonError: any) {
            console.warn('⚠️ Error parseando JSON completo:', jsonError.message);
          }
        }
        
        // Intentar buscar JSON parcial en la línea (por si viene con texto adicional)
        const jsonMatch = trimmedData.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/);
        if (jsonMatch && jsonMatch[0]) {
          try {
            const jsonData = JSON.parse(jsonMatch[0]);
            
            if (jsonData.peso !== undefined) {
              setPesoActual(parseFloat(jsonData.peso) || 0);
            }
            if (jsonData.objetivo !== undefined) {
              setPesoObjetivo(parseFloat(jsonData.objetivo) || 0);
            }
            if (jsonData.diferencia !== undefined) {
              setDiferencia(parseFloat(jsonData.diferencia) || 0);
            }
            if (jsonData.codigo_saco) {
              setCodigoSacoArduino(String(jsonData.codigo_saco));
            }
            if (jsonData.fabrica) {
              setFabricaArduino(String(jsonData.fabrica));
            }
            
            setDatosRecibidos(true);
            setUltimaLectura(new Date());
            return;
          } catch (e: any) {
            console.warn('⚠️ Error parseando JSON parcial:', e.message);
          }
        }
        
        // Si no es JSON, intentar formato texto: OBJ:X;ACT:X;DIF:X
        const textMatch = trimmedData.match(/OBJ:([-\d.]+);ACT:([-\d.]+);DIF:([-\d.]+)/);
        if (textMatch) {
          const ahora = new Date();
          const objetivo = parseFloat(textMatch[1]) || 0;
          const actual = parseFloat(textMatch[2]) || 0;
          const dif = parseFloat(textMatch[3]) || 0;
          
          setPesoObjetivo(objetivo);
          setPesoActual(actual);
          setDiferencia(dif);
          setDatosRecibidos(true);
          setUltimaLectura(ahora);
          ultimaActualizacionRef.current = ahora;
          
          // Forzar re-render
          setActualizacionKey(prev => prev + 1);
          
          // Agregar punto al gráfico
          setDatosGrafico(prev => {
            const nuevoPunto = {
              tiempo: ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              peso: actual,
              objetivo: objetivo
            };
            const nuevosDatos = [...prev, nuevoPunto];
            return nuevosDatos.slice(-maxPuntosGrafico);
          });
          
          console.log(`⚖️ [${ahora.toLocaleTimeString()}] Peso: ${actual.toFixed(3)} kg | Obj: ${objetivo.toFixed(3)} kg | Dif: ${dif.toFixed(3)} kg`);
          return;
        }
        
        // Ignorar mensajes que no son datos de pesaje (como mensajes del menú)
        if (!trimmedData.includes('Peso:') && 
            !trimmedData.includes('MENU') && 
            !trimmedData.includes('Tara') &&
            !trimmedData.includes('Calibración')) {
          // Solo loguear si no es un mensaje conocido
          console.warn('⚠️ Formato no reconocido (ignorando):', trimmedData.substring(0, 50));
        }
      } catch (error: any) {
        console.error('❌ Error general parseando datos:', error.message, 'Data:', trimmedData.substring(0, 50));
      }
    };
  }, []);

  // Cargar fábricas al montar
  useEffect(() => {
    const cargarFabricas = async () => {
      const { data } = await supabase
        .from('fabricas')
        .select('id, nombre, codigo')
        .order('nombre', { ascending: true });

      if (data) {
        setFabricas(data);
        if (data.length > 0) {
          setFabricaSeleccionada(data[0].id);
        }
      }
    };

    const cargarHistorial = async () => {
      const { data } = await supabase
        .from('sacos')
        .select('*')
        .order('fecha_pesaje', { ascending: false })
        .limit(10);

      if (data) {
        setHistorialPesajes(data);
      }
    };

    cargarFabricas();
    cargarHistorial();
  }, []);

  // Efecto para actualizar tiempo transcurrido y verificar recepción de datos
  useEffect(() => {
    if (connectionStatus !== 'connected') return;

    const interval = setInterval(() => {
      if (ultimaLectura) {
        const ahora = new Date();
        const diff = ahora.getTime() - ultimaLectura.getTime();
        // Si no hay datos en los últimos 7 segundos (Arduino envía cada 2s), mostrar advertencia
        // Esto da un margen de seguridad
        if (diff > 7000) {
          setDatosRecibidos(false);
        } else if (diff < 3000) {
          // Si recibimos datos recientemente, marcar como recibidos
          setDatosRecibidos(true);
        }
      } else if (connectionStatus === 'connected') {
        // Si estamos conectados pero nunca recibimos datos, mantener el estado
        setDatosRecibidos(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionStatus, ultimaLectura]);

  // Calcular estado basado en peso objetivo y diferencia (usar tolerancia del Arduino: 0.005 kg = 5g)
  const calcularEstado = () => {
    if (pesoObjetivo <= 0) return 'NORMAL';
    
    // Tolerancia del Arduino: 0.005 kg (5 gramos)
    const toleranciaAbsoluta = 0.005;
    const diferenciaAbsoluta = Math.abs(diferencia);
    
    return diferenciaAbsoluta <= toleranciaAbsoluta ? 'OK' : 'FUERA_RANGO';
  };

  // Formatear tiempo transcurrido desde última lectura
  const formatearTiempoTranscurrido = () => {
    if (!ultimaLectura) return 'N/A';
    const ahora = new Date();
    const diff = Math.floor((ahora.getTime() - ultimaLectura.getTime()) / 1000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `Hace ${diff}s`;
    return `Hace ${Math.floor(diff / 60)}m`;
  };

  // Guardar pesaje simplificado
  const confirmarPeso = async () => {
    if (!fabricaSeleccionada || !numeroSaco.trim()) {
      mostrarMensaje('error', 'Selecciona una fábrica e ingresa el número de saco');
      return;
    }

    if (pesoActual <= 0) {
      mostrarMensaje('error', 'El peso actual debe ser mayor a 0');
      return;
    }

    const codigoSaco = `${numeroSaco.trim()}`;
    // Usar la misma tolerancia del Arduino: 0.005 kg (5 gramos)
    const toleranciaAbsoluta = 0.005;
    
    // Si hay objetivo configurado en Arduino
    let estado = 'OK';
    if (pesoObjetivo > 0) {
      const diferenciaAbsoluta = Math.abs(diferencia);
      estado = diferenciaAbsoluta <= toleranciaAbsoluta ? 'OK' : 'FUERA_RANGO';
    }

    try {
      const { data, error } = await supabase
        .from('sacos')
        .insert({
          codigo: codigoSaco,
          fabrica_id: fabricaSeleccionada,
          peso_objetivo: pesoObjetivo || 0,
          peso_real: pesoActual,
          diferencia: diferencia,
          estado: estado,
          fecha_pesaje: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      mostrarMensaje('success', '✅ Peso guardado exitosamente');
      setListo(true);
      
      // Agregar al historial local
      setHistorialPesajes(prev => [data, ...prev.slice(0, 9)]);
      
      // Reiniciar después de 2 segundos
      setTimeout(() => {
        setNumeroSaco('');
        setListo(false);
        setMensaje('');
      }, 2000);
    } catch (error: any) {
      console.error('Error guardando pesaje:', error);
      mostrarMensaje('error', 'Error al guardar: ' + error.message);
    }
  };

  // 🔧 FUNCIONES DE CALIBRACIÓN INTERACTIVA
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
      mostrarMensaje('success', `Peso enviado: ${peso} kg. Esperando confirmación del Arduino...`);
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

  // Mostrar mensaje temporal
  const mostrarMensaje = (tipo: 'success' | 'error' | 'info', texto: string) => {
    setTipoMensaje(tipo);
    setMensaje(texto);
    setTimeout(() => setMensaje(''), 5000);
  };

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="container-fluid py-4">
      {/* Header con botón de conexión */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0 text-gray-800">
          <Scale size={28} className="me-2" style={{ verticalAlign: 'middle', color: '#8B4513' }} />
          Pesaje en Tiempo Real
        </h1>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {connectionStatus === 'connected' && datosRecibidos && (
            <span className="badge bg-info">
              📡 Datos recibidos {formatearTiempoTranscurrido()}
            </span>
          )}
          {connectionStatus === 'connected' && !datosRecibidos && (
            <span className="badge bg-warning text-dark">
              ⚠️ Esperando datos...
            </span>
          )}
          <span
            className={`badge ${
              connectionStatus === 'connected' ? 'bg-success' :
              connectionStatus === 'connecting' ? 'bg-warning text-dark' :
              connectionStatus === 'error' ? 'bg-danger' : 'bg-secondary'
            }`}
          >
            {connectionStatus === 'connected' ? '● Conectado' :
             connectionStatus === 'connecting' ? '● Conectando...' :
             connectionStatus === 'error' ? '● Error' : '○ Desconectado'}
          </span>
          {connectionStatus !== 'connected' ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={conectarArduino}
              disabled={!isSerialSupported || connectionStatus === 'connecting'}
            >
              <Usb size={16} className="me-1" />
              {connectionStatus === 'connecting' ? 'Conectando...' : 'Conectar Arduino'}
            </button>
          ) : (
            <>
              <button
                className="btn btn-warning btn-sm"
                onClick={hacerTara}
                title="Hacer tara (resetear peso a cero)"
              >
                <RotateCcw size={16} className="me-1" />
                Tara
              </button>
              <button
                className="btn btn-info btn-sm"
                onClick={() => setMostrarConfigObjetivo(!mostrarConfigObjetivo)}
                title="Configurar peso objetivo"
              >
                <Target size={16} className="me-1" />
                Objetivo
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={desconectarArduino}
              >
                <StopCircle size={16} className="me-1" />
                Desconectar
              </button>
            </>
          )}
        </div>
      </div>

      {/* Modal de Calibración Interactiva */}
      {modoCalibacion && connectionStatus === 'connected' && (
        <div className="card shadow mb-4 border-warning" style={{ borderWidth: '3px' }}>
          <div className="card-body">
            <h5 className="card-title text-warning">
              ⚙️ Calibración del Arduino
            </h5>
            
            {mensajeArduino && (
              <div className="alert alert-info mb-3">
                <strong>Arduino dice:</strong> {mensajeArduino}
              </div>
            )}

            {/* Esperando peso conocido */}
            {esperandoPesoConocido && (
              <div>
                <p className="mb-3">El Arduino solicita que ingreses un <strong>peso conocido</strong> para calibración.</p>
                <div className="row align-items-end">
                  <div className="col-md-8">
                    <label className="form-label">Peso conocido (kg):</label>
                    <input
                      type="number"
                      step="0.001"
                      className="form-control form-control-lg"
                      placeholder="Ej: 5.250"
                      value={pesoConocidoInput}
                      onChange={(e) => setPesoConocidoInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          enviarPesoConocido();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="col-md-4">
                    <button
                      className="btn btn-warning w-100 btn-lg"
                      onClick={enviarPesoConocido}
                    >
                      📤 Enviar Peso
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Esperando confirmación "ok" */}
            {esperandoConfirmacion && (
              <div className="text-center">
                <p className="mb-3">El Arduino solicita <strong>confirmación</strong> para continuar.</p>
                <button
                  className="btn btn-success btn-lg px-5"
                  onClick={enviarConfirmacion}
                >
                  ✅ Confirmar (OK)
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para configurar peso objetivo */}
      {mostrarConfigObjetivo && connectionStatus === 'connected' && !modoCalibacion && (
        <div className="card shadow mb-4 border-info">
          <div className="card-body">
            <h5 className="card-title text-info">
              <Target size={20} className="me-2" />
              Configurar Peso Objetivo
            </h5>
            <div className="row align-items-end">
              <div className="col-md-8">
                <label className="form-label">Peso objetivo (kg):</label>
                <input
                  type="number"
                  step="0.001"
                  className="form-control"
                  placeholder="Ej: 50.000"
                  value={nuevoObjetivo}
                  onChange={(e) => setNuevoObjetivo(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      configurarPesoObjetivo();
                    }
                  }}
                />
              </div>
              <div className="col-md-4">
                <button
                  className="btn btn-info w-100"
                  onClick={configurarPesoObjetivo}
                >
                  Configurar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje de alerta/éxito */}
      {mensaje && (
        <div className={`alert alert-${tipoMensaje === 'success' ? 'success' : tipoMensaje === 'error' ? 'danger' : 'info'} alert-dismissible fade show`} role="alert">
          {mensaje}
          <button type="button" className="btn-close" onClick={() => setMensaje('')}></button>
        </div>
      )}

      {!isSerialSupported && (
        <div className="alert alert-warning">
          <strong>⚠️ Navegador no compatible</strong>
          <p className="mb-0">Tu navegador no soporta Web Serial API. Usa Google Chrome o Microsoft Edge para conectar el Arduino.</p>
        </div>
      )}

      {/* Panel de Pesaje Principal */}
      {connectionStatus === 'connected' ? (
        <div className="row mb-4">
          {/* Peso Actual en Grande */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow border-0" style={{ 
              borderLeft: `0.5rem solid ${calcularEstado() === 'OK' ? '#1CC88A' : calcularEstado() === 'FUERA_RANGO' ? '#E74A3B' : '#36B9CC'}` 
            }}>
              <div className="card-body py-4">
                <div className="text-center">
                  <div className="d-flex justify-content-center align-items-center gap-2 mb-2">
                    <h5 className="text-muted mb-0">Peso Actual</h5>
                    {datosRecibidos && (
                      <span className="badge bg-success animate-pulse" style={{ animation: 'pulse 2s infinite' }}>
                        ● En vivo
                      </span>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <h1 
                      key={`peso-${actualizacionKey}`}
                      style={{ 
                        fontSize: '4rem', 
                        fontWeight: 700, 
                        color: datosRecibidos ? '#0066cc' : '#5A5C69',
                        transition: 'color 0.3s ease-in-out',
                        margin: 0,
                        lineHeight: 1.2
                      }}
                    >
                      {pesoActual.toFixed(3)}
                    </h1>
                    {datosRecibidos && ultimaLectura && (
                      <div 
                        style={{ 
                          position: 'absolute',
                          top: '-5px',
                          right: '-40px',
                          fontSize: '1.5rem',
                          animation: 'pulse 2s ease-in-out infinite'
                        }}
                      >
                        ⚖️
                      </div>
                    )}
                  </div>
                  <p className="text-muted mb-0" style={{ fontSize: '1.5rem' }}>kilogramos</p>
                  
                  {/* Indicador de estado */}
                  {pesoObjetivo > 0 && (
                    <div className="mt-3">
                      <p className="mb-1">
                        <strong>Peso Objetivo:</strong> {pesoObjetivo.toFixed(3)} kg
                      </p>
                      <p className="mb-2">
                        <strong>Diferencia:</strong> 
                        <span className={Math.abs(diferencia) <= 0.005 ? 'text-success' : 'text-danger'}>
                          {' '}{diferencia >= 0 ? '+' : ''}{diferencia.toFixed(3)} kg
                        </span>
                      </p>
                      {calcularEstado() === 'OK' && (
                        <span className="badge bg-success fs-6">
                          ✓ Dentro de tolerancia (±5g)
                        </span>
                      )}
                      {calcularEstado() === 'FUERA_RANGO' && (
                        <span className="badge bg-danger fs-6">
                          ⚠ Fuera de tolerancia
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Información del Arduino */}
                  {(codigoSacoArduino || fabricaArduino) && (
                    <div className="mt-3 pt-3 border-top">
                      <small className="text-muted d-block mb-1">
                        <strong>Datos del Arduino:</strong>
                      </small>
                      {codigoSacoArduino && (
                        <small className="text-muted d-block">
                          Código Saco: <code>{codigoSacoArduino}</code>
                        </small>
                      )}
                      {fabricaArduino && (
                        <small className="text-muted d-block">
                          Fábrica: <strong>{fabricaArduino}</strong>
                        </small>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Control del Proceso */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow">
              <div className="card-header py-3">
                <h6 className="m-0 font-weight-bold text-primary">Control de Pesaje</h6>
              </div>
              <div className="card-body">
                {!listo ? (
                  <div>
                    <h5 className="mb-3">Datos del Pesaje</h5>
                    
                    {/* Seleccionar Fábrica */}
                    <div className="mb-3">
                      <label className="form-label"><strong>Fábrica:</strong></label>
                      <select 
                        className="form-select"
                        value={fabricaSeleccionada}
                        onChange={(e) => setFabricaSeleccionada(e.target.value)}
                      >
                        {fabricas.map((fab) => (
                          <option key={fab.id} value={fab.id}>
                            {fab.nombre} ({fab.codigo})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Número de Saco */}
                    <div className="mb-3">
                      <label className="form-label"><strong>N° de Saco:</strong></label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ej: SAC-001"
                        value={numeroSaco}
                        onChange={(e) => setNumeroSaco(e.target.value)}
                      />
                    </div>

                    {/* Información del Peso Actual */}
                    <div className={`alert ${datosRecibidos ? 'alert-info' : 'alert-warning'} mb-3`}>
                      <p className="mb-1">
                        <strong>Peso Actual:</strong> {pesoActual.toFixed(3)} kg
                        {datosRecibidos && (
                          <span className="badge bg-success ms-2">● En vivo</span>
                        )}
                      </p>
                      {pesoObjetivo > 0 && (
                        <>
                          <p className="mb-1"><strong>Peso Objetivo:</strong> {pesoObjetivo.toFixed(3)} kg</p>
                          <p className="mb-1">
                            <strong>Diferencia:</strong>{' '}
                            <span className={Math.abs(diferencia) <= 0.005 ? 'text-success' : 'text-danger'}>
                              {diferencia >= 0 ? '+' : ''}{diferencia.toFixed(3)} kg
                            </span>
                            {Math.abs(diferencia) <= 0.005 && (
                              <span className="badge bg-success ms-2">✓ OK</span>
                            )}
                          </p>
                        </>
                      )}
                      {!datosRecibidos && connectionStatus === 'connected' && (
                        <p className="mb-0 small text-muted">
                          ⚠️ Esperando datos del Arduino...
                        </p>
                      )}
                    </div>
                    
                    {/* Mostrar información del Arduino si está disponible */}
                    {(codigoSacoArduino || fabricaArduino) && (
                      <div className="alert alert-secondary mb-3">
                        <small>
                          <strong>Datos desde Arduino:</strong>
                          {codigoSacoArduino && (
                            <div>Código Saco: <code>{codigoSacoArduino}</code></div>
                          )}
                          {fabricaArduino && (
                            <div>Fábrica: <strong>{fabricaArduino}</strong></div>
                          )}
                        </small>
                      </div>
                    )}

                    {/* Botón Confirmar Peso */}
                    <button 
                      className="btn btn-primary btn-lg w-100"
                      onClick={confirmarPeso}
                      disabled={!fabricaSeleccionada || !numeroSaco.trim() || pesoActual <= 0}
                    >
                      <Save size={20} className="me-2" />
                      Confirmar y Guardar Peso
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle size={64} className="text-success mb-3" />
                    <h4 className="text-success mb-3">¡Peso Guardado Exitosamente!</h4>
                    <p className="text-muted">Listo para el siguiente saco...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow border-0" style={{ borderLeft: '0.5rem solid #E74A3B' }}>
              <div className="card-body py-5">
                <div className="text-center">
                  <AlertTriangle size={64} className="text-warning mb-3" />
                  <h3 className="mb-3" style={{ color: '#5A5C69', fontWeight: 700 }}>
                    ⚠️ Arduino No Conectado
                  </h3>
                  <p className="text-muted mb-4" style={{ fontSize: '1.1rem' }}>
                    Conecta el Arduino usando el botón de arriba para comenzar a pesar
                  </p>
                  <div className="alert alert-info mx-auto" style={{ maxWidth: '600px' }}>
                    <strong>Pasos para conectar:</strong>
                    <ol className="text-start mt-2 mb-0">
                      <li>Conecta el Arduino al puerto USB del computador</li>
                      <li>Haz clic en el botón "Conectar Arduino"</li>
                      <li>Selecciona el puerto serial correcto en el popup</li>
                      <li>¡Listo! Ya puedes comenzar a pesar</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico en Tiempo Real */}
      {connectionStatus === 'connected' && datosGrafico.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow">
              <div className="card-header py-3" style={{ backgroundColor: '#F8F9FC', borderBottom: '1px solid #E3E6F0' }}>
                <h6 className="m-0 font-weight-bold" style={{ color: '#0066cc', fontSize: '1rem', fontWeight: 700 }}>
                  📊 Gráfico de Peso en Tiempo Real
                </h6>
              </div>
              <div className="card-body" style={{ height: '350px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={datosGrafico}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis
                      dataKey="tiempo"
                      stroke="#5A5C69"
                      tick={{ fontSize: 12 }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      stroke="#5A5C69"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Peso (kg)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`${value.toFixed(3)} kg`, '']}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="peso"
                      stroke="#0066cc"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                      name="Peso Actual"
                    />
                    {pesoObjetivo > 0 && (
                      <Line
                        type="monotone"
                        dataKey="objetivo"
                        stroke="#28a745"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                        name="Peso Objetivo"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historial de Pesajes */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header py-3" style={{ backgroundColor: '#F8F9FC', borderBottom: '1px solid #E3E6F0' }}>
              <h6 className="m-0 font-weight-bold" style={{ color: '#8B4513', fontSize: '1rem', fontWeight: 700 }}>
                Historial de Pesajes (Últimos 10)
              </h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead style={{ backgroundColor: '#F8F9FC' }}>
                    <tr>
                      <th className="py-3 px-4">Hora</th>
                      <th className="py-3">Código Saco</th>
                      <th className="py-3 text-end">Peso Real</th>
                      <th className="py-3 text-end">Objetivo</th>
                      <th className="py-3 text-end">Diferencia</th>
                      <th className="py-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historialPesajes.length > 0 ? (
                      historialPesajes.map((pesaje) => (
                        <tr key={pesaje.id}>
                          <td className="px-4 py-3">
                            <small>{formatearFecha(pesaje.fecha_pesaje)}</small>
                          </td>
                          <td className="py-3">
                            <code>{pesaje.codigo}</code>
                          </td>
                          <td className="py-3 text-end">
                            <strong>{pesaje.peso_real.toFixed(3)} kg</strong>
                          </td>
                          <td className="py-3 text-end">{pesaje.peso_objetivo.toFixed(3)} kg</td>
                          <td className="py-3 text-end">
                            <span className={pesaje.diferencia >= 0 ? 'text-danger' : 'text-success'}>
                              {pesaje.diferencia >= 0 ? '+' : ''}{pesaje.diferencia.toFixed(3)} kg
                            </span>
                          </td>
                          <td className="py-3 text-center">
                            {pesaje.estado === 'OK' ? (
                              <span className="badge bg-success">OK</span>
                            ) : (
                              <span className="badge bg-danger">Fuera</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-5 text-muted">
                          No hay pesajes registrados aún
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PesajeTiempoReal;
