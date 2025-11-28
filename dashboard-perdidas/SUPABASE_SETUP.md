# 🔐 Configuración de Autenticación con Supabase

Este documento te guiará paso a paso para configurar la autenticación del dashboard de control de pérdidas.

---

## 📋 Prerrequisitos

- Cuenta de GitHub (para registrarse en Supabase)
- Proyecto ya implementado con Supabase instalado ✅

---

## 🚀 Paso 1: Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Haz clic en **"Start your project"** o **"Sign In"** si ya tienes cuenta
3. Autentícate con tu cuenta de GitHub
4. Una vez dentro, haz clic en **"New project"**
5. Completa la información:
   - **Organization**: Selecciona o crea una organización
   - **Project Name**: `dashboard-perdidas` (o el nombre que prefieras)
   - **Database Password**: Genera una contraseña segura (guárdala bien)
   - **Region**: Selecciona la región más cercana (ej: South America - São Paulo)
   - **Pricing Plan**: Selecciona "Free" (suficiente para empezar)
6. Haz clic en **"Create new project"**
7. Espera 1-2 minutos mientras Supabase configura tu proyecto

---

## 🔑 Paso 2: Obtener Credenciales

Una vez creado el proyecto:

1. En el panel lateral izquierdo, ve a **Settings** (⚙️)
2. Haz clic en **API**
3. Encontrarás dos valores importantes:

   **Project URL**
   ```
   https://xxxxxxxxxxxxxxxxxx.supabase.co
   ```

   **anon public key** (en la sección "Project API keys")
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...
   ```

4. **Copia ambos valores** (los necesitarás en el siguiente paso)

---

## 📝 Paso 3: Configurar Variables de Entorno

1. Abre el archivo `.env` en la raíz del proyecto
2. Reemplaza los valores de ejemplo con tus credenciales reales:

```env
VITE_SUPABASE_URL=https://tu-proyecto-id.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-aqui
```

**⚠️ IMPORTANTE**: 
- **NO** compartas estas credenciales públicamente
- **NO** subas el archivo `.env` a Git (ya está en `.gitignore`)
- Usa la **anon key** (pública), NO la **service_role key** (secreta)

---

## 👤 Paso 4: Crear Usuario Administrador

Ahora necesitas crear la primera cuenta de administrador:

1. En el panel de Supabase, ve a **Authentication** (👤) en el menú lateral
2. Haz clic en **Users**
3. Haz clic en **"Add user"** (o **"Invite user"**)
4. Selecciona **"Create user"**
5. Completa los datos:
   - **Email**: admin@tuempresa.com (o el email que prefieras)
   - **Password**: Crea una contraseña segura
   - **Auto Confirm User**: ✅ **Marca esta casilla** (importante)
6. Haz clic en **"Create user"**
7. **Guarda el email y contraseña** - estos serán tus credenciales de acceso

---

## ✅ Paso 5: Probar el Login

1. Asegúrate de que el servidor de desarrollo esté corriendo:
   ```bash
   npm run dev
   ```

2. Abre el navegador en `http://localhost:5174`

3. Deberías ver la pantalla de login:
   - Logo de la empresa (si tienes `/logo.png` en public)
   - Formulario de email y contraseña
   - Fondo marrón corporativo

4. Ingresa las credenciales del administrador que creaste en el Paso 4

5. Si todo está correcto:
   - Serás redirigido al dashboard
   - Verás tu email en la esquina superior derecha del navbar
   - Podrás navegar por todas las secciones

---

## 👥 Paso 6: Crear Más Usuarios (Desde la App)

Una vez que hayas iniciado sesión como administrador:

1. En el dashboard, ve a la pestaña **"Configuración"** (⚙️ en el sidebar)
2. Verás el formulario **"Crear Nuevo Usuario"**
3. Ingresa el email y contraseña del nuevo usuario
4. Haz clic en **"Crear Usuario"**
5. El nuevo usuario recibirá sus credenciales y podrá iniciar sesión

**⚠️ Nota sobre crear usuarios desde la app:**
- La función `supabase.auth.admin.createUser()` requiere permisos de administrador
- Por defecto, esto NO funcionará desde el cliente por seguridad
- **Opciones:**
  1. **Crear usuarios manualmente** desde el panel de Supabase (como en el Paso 4)
  2. **Implementar una Edge Function** en Supabase para crear usuarios de forma segura

---

## 🛡️ Paso 7: Configurar Políticas de Seguridad (Opcional pero Recomendado)

Para una aplicación en producción, deberías configurar Row Level Security (RLS):

1. En Supabase, ve a **Database** > **Tables**
2. Si tienes tablas con datos sensibles, habilita RLS
3. Crea políticas para controlar quién puede ver/editar datos

**Ejemplo de política básica:**
```sql
-- Solo usuarios autenticados pueden leer datos
CREATE POLICY "Usuarios autenticados pueden leer"
ON public.tu_tabla
FOR SELECT
USING (auth.role() = 'authenticated');
```

---

## 🔄 Cerrar Sesión

Para cerrar sesión:
1. Haz clic en tu email en la esquina superior derecha del navbar
2. Selecciona **"Cerrar sesión"**
3. Serás redirigido automáticamente al login

---

## 🐛 Solución de Problemas

### ❌ Error: "Invalid API key"
- Verifica que copiaste correctamente la `anon key` (no la `service_role key`)
- Asegúrate de que el archivo `.env` esté en la raíz del proyecto
- Reinicia el servidor de desarrollo después de editar `.env`

### ❌ Error: "Invalid login credentials"
- Verifica que el email sea exactamente el que configuraste
- Asegúrate de que el usuario esté confirmado (Auto Confirm User activado)
- Verifica en Supabase > Authentication > Users que el usuario exista

### ❌ La app no se conecta a Supabase
- Verifica que las URLs en `.env` comiencen con `VITE_`
- Reinicia el servidor de desarrollo: `Ctrl+C` y luego `npm run dev`
- Abre la consola del navegador (F12) para ver errores específicos

### ❌ No puedo crear usuarios desde la app
- Esto es normal - la función admin requiere permisos especiales
- **Solución 1**: Crea usuarios manualmente desde el panel de Supabase
- **Solución 2**: Implementa una Edge Function (requiere configuración adicional)

---

## 📚 Recursos Adicionales

- [Documentación de Supabase Auth](https://supabase.com/docs/guides/auth)
- [Guía de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions (para crear usuarios de forma segura)](https://supabase.com/docs/guides/functions)

---

## 🎉 ¡Listo!

Ahora tienes un dashboard completamente funcional con autenticación segura. Solo los usuarios que crees podrán acceder al sistema.

**Próximos pasos recomendados:**
1. ✅ Configurar RLS en tablas sensibles
2. ✅ Implementar Edge Function para creación de usuarios
3. ✅ Configurar emails personalizados de Supabase
4. ✅ Agregar recuperación de contraseña
5. ✅ Deployar a producción (Vercel, Netlify, etc.)
