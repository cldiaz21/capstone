-- ========================================
-- FIX: POLÍTICAS RLS PARA USUARIOS (Sin recursión infinita)
-- SOLUCIÓN SIMPLE: Deshabilitar RLS en usuarios completamente
-- ========================================
-- EJECUTAR ESTO EN SUPABASE SQL EDITOR

-- PASO 0: ELIMINAR POLÍTICAS QUE CAUSAN RECURSIÓN EN OTRAS TABLAS
DROP POLICY IF EXISTS "Permitir escritura admin fabricas" ON fabricas;
DROP POLICY IF EXISTS "Permitir escritura admin pedidos" ON pedidos;
DROP POLICY IF EXISTS "Permitir escritura operador sacos" ON sacos;

-- 1. ELIMINAR TODAS LAS POLÍTICAS EXISTENTES DE USUARIOS
DROP POLICY IF EXISTS "Permitir lectura admin usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir gestión admin usuarios" ON usuarios;
DROP POLICY IF EXISTS "Permitir primer usuario" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden ver usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden crear usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden actualizar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admins pueden eliminar usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin read usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin insert usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin update usuarios" ON usuarios;
DROP POLICY IF EXISTS "Admin delete usuarios" ON usuarios;

-- 2. DESHABILITAR RLS EN USUARIOS (solución definitiva, sin recursión)
ALTER TABLE usuarios DISABLE ROW LEVEL SECURITY;

-- 3. CREAR TABLA AUXILIAR user_roles SIMPLE
DROP TABLE IF EXISTS user_roles CASCADE;
CREATE TABLE user_roles (
  user_id UUID PRIMARY KEY,
  rol VARCHAR(50) NOT NULL CHECK (rol IN ('admin', 'supervisor', 'operador', 'visualizador')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NO HABILITAR RLS en user_roles (así no hay recursión)

-- 4. MIGRAR DATOS EXISTENTES
INSERT INTO user_roles (user_id, rol)
SELECT id, rol FROM usuarios
ON CONFLICT (user_id) DO UPDATE SET rol = EXCLUDED.rol;

-- 5. TRIGGER para sincronizar user_roles cuando cambie usuarios
DROP TRIGGER IF EXISTS sync_user_roles_trigger ON usuarios;
DROP FUNCTION IF EXISTS sync_user_roles_fn() CASCADE;

CREATE OR REPLACE FUNCTION sync_user_roles_fn()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO user_roles (user_id, rol)
    VALUES (NEW.id, NEW.rol)
    ON CONFLICT (user_id) DO UPDATE SET rol = EXCLUDED.rol;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE user_roles SET rol = NEW.rol WHERE user_id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM user_roles WHERE user_id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER sync_user_roles_trigger
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION sync_user_roles_fn();

-- ========================================
-- RECREAR POLÍTICAS DE OTRAS TABLAS SIN RECURSIÓN
-- ========================================

-- Políticas para FABRICAS (usando user_roles en lugar de usuarios)
CREATE POLICY "Permitir escritura admin fabricas" ON fabricas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND rol IN ('admin', 'supervisor')
    )
  );

-- Políticas para PEDIDOS (usando user_roles)
CREATE POLICY "Permitir escritura admin pedidos" ON pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND rol IN ('admin', 'supervisor', 'operador')
    )
  );

-- Políticas para SACOS (usando user_roles)
CREATE POLICY "Permitir escritura operador sacos" ON sacos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND rol IN ('admin', 'supervisor', 'operador')
    )
  );

-- ========================================
-- INSTRUCCIONES
-- ========================================
-- 1. Ejecuta este script completo en Supabase SQL Editor
-- 2. La tabla usuarios NO tendrá RLS (acceso controlado desde el frontend)
-- 3. Las demás tablas usan user_roles para verificar permisos (sin recursión)
-- 4. IMPORTANTE: El control de acceso a usuarios se hace en el componente React
-- 5. user_roles se sincroniza automáticamente con usuarios mediante trigger
