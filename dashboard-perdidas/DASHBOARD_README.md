# Dashboard de Control de Pérdidas - Comercial Marisol

Dashboard profesional basado en Argon Dashboard para el control y análisis de pérdidas en el proceso de recepción de sacos.

## 🎨 Diseño

Este dashboard está inspirado en **Argon Dashboard** y utiliza los colores corporativos de Comercial Marisol:

- **Blanco** (#FFFFFF) - Color principal de fondos y tarjetas
- **Negro** (#000000) - Texto y elementos de énfasis
- **Marrón** (#8B4513) - Color corporativo principal para botones y elementos destacados

## 🚀 Características

- ✅ Visualización de KPIs principales (Prendas, Sacos, Fábricas, Pérdida Promedio)
- ✅ Gráfico de líneas para evolución de pérdidas en el tiempo
- ✅ Gráfico de barras para las 10 fábricas con mayores pérdidas
- ✅ Tabla de alertas de alto riesgo (pérdidas > 5%)
- ✅ Exportación de datos a CSV
- ✅ Navegación por tabs (Dashboard, Fábricas, Sacos, Pérdidas, Reportes, Configuración)
- ✅ Diseño responsive y moderno
- ✅ Datos reales desde archivo CSV (`Lista 2024.csv`)

## 📂 Estructura del Proyecto

```
dashboard-perdidas/
├── public/
│   └── assets/
│       └── logo.png          ← Coloca tu logo aquí
├── src/
│   ├── components/
│   │   ├── Navbar.tsx        ← Barra de navegación superior
│   │   ├── Sidebar.tsx       ← Menú lateral
│   │   ├── DashboardContent.tsx  ← Contenido principal del dashboard
│   │   └── DashboardControlPerdidas.tsx (versión anterior)
│   ├── utils/
│   │   └── csvUtils.ts       ← Utilidades para parsear CSV
│   ├── argon-theme.css       ← Estilos corporativos
│   ├── Lista 2024.csv        ← Datos reales
│   ├── App.tsx               ← Componente principal
│   └── main.tsx              ← Punto de entrada
├── package.json
└── README.md
```

## 🖼️ Agregar el Logo

Para agregar tu logo corporativo:

1. Coloca tu archivo de imagen (preferiblemente PNG con fondo transparente) en:
   ```
   public/assets/logo.png
   ```

2. Dimensiones recomendadas:
   - Alto: 40-50 píxeles
   - Formato: PNG con fondo transparente
   - Peso: < 100KB para carga rápida

3. El logo aparecerá automáticamente en la barra de navegación superior.

## 📊 Datos

El dashboard lee datos desde `src/Lista 2024.csv` que contiene:

- Fecha de llegada
- Nombre de fábrica
- Código
- Cantidad de pedidos
- Cantidad recibida
- Cantidad de sacos
- Ratio de pérdida (calculado)

## 🛠️ Instalación y Uso

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build
```

## 📈 Visualizaciones

### Gráfico de Líneas
Muestra la evolución mensual de las pérdidas promedio y la cantidad de sacos procesados.

### Gráfico de Barras
Presenta las 10 fábricas con mayor porcentaje de pérdida.

### Tabla de Alertas
Lista los registros con pérdidas superiores al 5%, ordenados de mayor a menor.

## 🎯 KPIs Mostrados

1. **Total Prendas**: Suma de todas las prendas pedidas
2. **Total Sacos**: Cantidad total de sacos procesados
3. **Fábricas Activas**: Número de fábricas únicas en los registros
4. **Pérdida Promedio**: Promedio del porcentaje de pérdida de todas las fábricas

## 🔧 Tecnologías

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **Bootstrap 5** - Framework CSS
- **Recharts** - Librería de gráficos
- **Lucide React** - Iconos
- **PapaParse** - Parser de CSV

## 📝 Notas

- El sidebar es completamente funcional con navegación entre tabs
- El navbar incluye búsqueda y notificaciones (UI preparada para funcionalidad futura)
- El diseño es completamente responsive
- Los colores corporativos están definidos en `argon-theme.css`

## 👤 Autor

Desarrollado para Comercial Marisol

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025
