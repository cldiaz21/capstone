-- ========================================
-- ESQUEMA COMPLETO PARA DASHBOARD COMERCIAL MARISOL
-- Base de datos para Lista 2024 y gestión integral
-- ========================================

-- 1. TABLA DE FÁBRICAS
CREATE TABLE IF NOT EXISTS fabricas (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  codigo VARCHAR(50),
  tipo VARCHAR(50), -- 'China Contados', 'China No Contados', 'Otros'
  ubicacion VARCHAR(200),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fabricas_nombre ON fabricas(nombre);
CREATE INDEX idx_fabricas_activa ON fabricas(activa);

-- 2. TABLA DE PEDIDOS (Lista 2024 China Contados)
CREATE TABLE IF NOT EXISTS pedidos (
  id BIGSERIAL PRIMARY KEY,
  fecha_llegada DATE NOT NULL,
  fabrica_id BIGINT REFERENCES fabricas(id),
  fabrica_nombre VARCHAR(200),
  codigo VARCHAR(100),
  cantidad_pedidos INTEGER,
  cantidad_recibidos INTEGER,
  cantidad_sacos INTEGER,
  ratio_rp DECIMAL(10, 4), -- Ratio Recibidos/Pedidos
  tipo_lista VARCHAR(50) DEFAULT 'China Contados', -- 'China Contados', 'China No Contados', 'Otros'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_llegada DESC);
CREATE INDEX idx_pedidos_fabrica ON pedidos(fabrica_id);
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);

-- 3. TABLA DE SACOS INDIVIDUALES
CREATE TABLE IF NOT EXISTS sacos (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(100) NOT NULL,
  pedido_id BIGINT REFERENCES pedidos(id),
  fabrica_id BIGINT REFERENCES fabricas(id),
  peso_objetivo DECIMAL(10, 3),
  peso_real DECIMAL(10, 3),
  diferencia DECIMAL(10, 3),
  estado VARCHAR(20) CHECK (estado IN ('OK', 'FUERA_RANGO')),
  fecha_pesaje TIMESTAMPTZ DEFAULT NOW(),
  lote VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sacos_codigo ON sacos(codigo);
CREATE INDEX idx_sacos_fecha ON sacos(fecha_pesaje DESC);
CREATE INDEX idx_sacos_estado ON sacos(estado);

-- 4. TABLA DE USUARIOS CON ROLES
CREATE TABLE IF NOT EXISTS usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nombre_completo VARCHAR(200),
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'supervisor', 'operador', 'visualizador')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES usuarios(id)
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol);

-- 5. TABLA DE REPORTES GENERADOS
CREATE TABLE IF NOT EXISTS reportes (
  id BIGSERIAL PRIMARY KEY,
  nombre VARCHAR(200),
  tipo VARCHAR(50), -- 'Excel', 'PDF', 'CSV'
  usuario_id UUID REFERENCES usuarios(id),
  fecha_inicio DATE,
  fecha_fin DATE,
  url_archivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE PÉRDIDAS CALCULADAS
CREATE TABLE IF NOT EXISTS perdidas (
  id BIGSERIAL PRIMARY KEY,
  fecha DATE NOT NULL,
  fabrica_id BIGINT REFERENCES fabricas(id),
  cantidad_perdida INTEGER,
  porcentaje_perdida DECIMAL(10, 4),
  valor_estimado DECIMAL(15, 2),
  tipo VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_perdidas_fecha ON perdidas(fecha DESC);
CREATE INDEX idx_perdidas_fabrica ON perdidas(fabrica_id);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE fabricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sacos ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE perdidas ENABLE ROW LEVEL SECURITY;

-- Políticas para FABRICAS (todos pueden leer, solo admin puede editar)
CREATE POLICY "Permitir lectura pública fabricas" ON fabricas
  FOR SELECT USING (true);

CREATE POLICY "Permitir escritura admin fabricas" ON fabricas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol IN ('admin', 'supervisor')
    )
  );

-- Políticas para PEDIDOS (todos autenticados pueden leer)
CREATE POLICY "Permitir lectura autenticada pedidos" ON pedidos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escritura admin pedidos" ON pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol IN ('admin', 'supervisor', 'operador')
    )
  );

-- Políticas para SACOS
CREATE POLICY "Permitir lectura autenticada sacos" ON sacos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Permitir escritura operador sacos" ON sacos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM usuarios 
      WHERE usuarios.id = auth.uid() 
      AND usuarios.rol IN ('admin', 'supervisor', 'operador')
    )
  );

-- Políticas para USUARIOS (solo admin puede gestionar)
CREATE POLICY "Permitir lectura admin usuarios" ON usuarios
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() 
      AND u.rol = 'admin'
    )
  );

CREATE POLICY "Permitir gestión admin usuarios" ON usuarios
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() 
      AND u.rol = 'admin'
    )
  );

-- Política especial: Permitir auto-inserción si no existen usuarios (primer usuario)
CREATE POLICY "Permitir primer usuario" ON usuarios
  FOR INSERT WITH CHECK (
    NOT EXISTS (SELECT 1 FROM usuarios) 
    OR 
    EXISTS (
      SELECT 1 FROM usuarios u 
      WHERE u.id = auth.uid() 
      AND u.rol = 'admin'
    )
  );

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista de estadísticas por fábrica
CREATE OR REPLACE VIEW estadisticas_fabricas AS
SELECT 
  f.id,
  f.nombre,
  f.codigo,
  COUNT(DISTINCT p.id) as total_pedidos,
  SUM(p.cantidad_pedidos) as total_cantidad_pedidos,
  SUM(p.cantidad_recibidos) as total_cantidad_recibidos,
  SUM(p.cantidad_pedidos - p.cantidad_recibidos) as total_perdidas,
  CASE 
    WHEN SUM(p.cantidad_pedidos) > 0 
    THEN ((SUM(p.cantidad_recibidos)::DECIMAL / SUM(p.cantidad_pedidos)) * 100)
    ELSE 0 
  END as porcentaje_cumplimiento
FROM fabricas f
LEFT JOIN pedidos p ON f.id = p.fabrica_id
WHERE f.activa = true
GROUP BY f.id, f.nombre, f.codigo;

-- Vista de pérdidas mensuales
CREATE OR REPLACE VIEW perdidas_mensuales AS
SELECT 
  DATE_TRUNC('month', fecha_llegada) as mes,
  SUM(cantidad_pedidos - cantidad_recibidos) as total_perdidas,
  COUNT(*) as num_pedidos,
  AVG(ratio_rp) as ratio_promedio
FROM pedidos
WHERE cantidad_pedidos > 0
GROUP BY DATE_TRUNC('month', fecha_llegada)
ORDER BY mes DESC;

-- ========================================
-- FUNCIONES ÚTILES
-- ========================================

-- Función para calcular pérdidas
CREATE OR REPLACE FUNCTION calcular_perdidas()
RETURNS void AS $$
BEGIN
  TRUNCATE TABLE perdidas;
  
  INSERT INTO perdidas (fecha, fabrica_id, cantidad_perdida, porcentaje_perdida, tipo)
  SELECT 
    fecha_llegada as fecha,
    fabrica_id,
    SUM(cantidad_pedidos - cantidad_recibidos) as cantidad_perdida,
    CASE 
      WHEN SUM(cantidad_pedidos) > 0 
      THEN ((SUM(cantidad_pedidos - cantidad_recibidos)::DECIMAL / SUM(cantidad_pedidos)) * 100)
      ELSE 0 
    END as porcentaje_perdida,
    tipo_lista as tipo
  FROM pedidos
  WHERE cantidad_pedidos > 0
  GROUP BY fecha_llegada, fabrica_id, tipo_lista;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fabricas_updated_at BEFORE UPDATE ON fabricas
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DATOS INICIALES
-- ========================================
-- INSERTAR USUARIO ADMIN INICIAL
-- ========================================
-- NOTA: El usuario admin se creará automáticamente al hacer login por primera vez
-- debido a las políticas RLS configuradas. No es necesario insertar manualmente.

-- Si deseas crear un usuario admin manualmente, ejecuta después del primer login:
-- INSERT INTO usuarios (email, nombre_completo, rol, activo)
-- VALUES ('tu_email@ejemplo.com', 'Administrador', 'admin', true)
-- ON CONFLICT (email) DO UPDATE SET rol = 'admin', activo = true;

-- ========================================
-- COMENTARIOS
-- ========================================

COMMENT ON TABLE fabricas IS 'Catálogo de fábricas proveedoras';
COMMENT ON TABLE pedidos IS 'Registro de pedidos de la Lista 2024';
COMMENT ON TABLE sacos IS 'Registro individual de sacos pesados';
COMMENT ON TABLE usuarios IS 'Usuarios del sistema con roles';
COMMENT ON TABLE reportes IS 'Historial de reportes generados';
COMMENT ON TABLE perdidas IS 'Cálculo de pérdidas por fecha y fábrica';
