-- SQL para crear la tabla de pesajes en tiempo real
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS pesajes_tiempo_real (
  id BIGSERIAL PRIMARY KEY,
  peso_actual DECIMAL(10, 3) NOT NULL,
  peso_objetivo DECIMAL(10, 3) NOT NULL,
  diferencia DECIMAL(10, 3) NOT NULL,
  codigo_saco VARCHAR(100) NOT NULL,
  fabrica VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  estado VARCHAR(20) CHECK (estado IN ('OK', 'FUERA_RANGO')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_pesajes_timestamp ON pesajes_tiempo_real(timestamp DESC);
CREATE INDEX idx_pesajes_codigo ON pesajes_tiempo_real(codigo_saco);
CREATE INDEX idx_pesajes_fabrica ON pesajes_tiempo_real(fabrica);

-- Habilitar Row Level Security (RLS)
ALTER TABLE pesajes_tiempo_real ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura a usuarios autenticados
CREATE POLICY "Permitir lectura a usuarios autenticados"
ON pesajes_tiempo_real FOR SELECT
TO authenticated
USING (true);

-- Política para permitir inserción (para el bridge de Arduino)
CREATE POLICY "Permitir inserción desde service role"
ON pesajes_tiempo_real FOR INSERT
TO anon
WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE pesajes_tiempo_real IS 'Registro en tiempo real de pesajes desde Arduino';
COMMENT ON COLUMN pesajes_tiempo_real.peso_actual IS 'Peso medido en kg';
COMMENT ON COLUMN pesajes_tiempo_real.peso_objetivo IS 'Peso objetivo en kg';
COMMENT ON COLUMN pesajes_tiempo_real.diferencia IS 'Diferencia entre actual y objetivo';
COMMENT ON COLUMN pesajes_tiempo_real.codigo_saco IS 'Código del saco pesado';
COMMENT ON COLUMN pesajes_tiempo_real.estado IS 'OK si está dentro de tolerancia, FUERA_RANGO si no';
