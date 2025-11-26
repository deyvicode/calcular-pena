# Calculadora de Penas - Código Penal Peruano

Aplicación web interactiva para el cálculo de penas conforme a los artículos 45, 45-A y 46 del Código Penal Peruano, siguiendo el sistema de tercios y los acuerdos plenarios 1-2023 y 2-2024.

## 🚀 Características

- **Sistema de tercios**: Implementación completa del Art. 45-A para determinación judicial de penas
- **Wizard de 5 pasos**: Interfaz guiada para captura de datos del delito, circunstancias e institutos
- **Cálculo automático**: Motor de cálculo que procesa atenuantes, agravantes e institutos jurídicos
- **Exportación PDF**: Generación de informes completos con fundamentación legal
- **Gestión de casos**: Guardado de borradores, historial y comparación de escenarios
- **Validación**: Sistema de errores y advertencias en tiempo real

## 🛠️ Tecnologías

- **React 19.2** - Framework UI con hooks modernos
- **TypeScript 5.9** - Tipado estático robusto
- **Vite 7.2** - Build tool ultra-rápido
- **Tailwind CSS 4.1** - Estilos utility-first con OKLCH color space
- **html2canvas + jsPDF** - Exportación de informes PDF
- **React Icons** - Iconografía Feather

## 📁 Estructura del Proyecto

```
src/
├── types/              # Definiciones TypeScript centralizadas
│   └── index.ts        # Duration, AppState, CalculationResult, etc.
├── utils/              # Utilidades y lógica de negocio
│   ├── constants.ts    # Configuración legal (Art. 45, 46, institutos)
│   ├── helpers.ts      # Funciones matemáticas y formato
│   ├── calculations.ts # Motor de cálculo de penas
│   ├── validation.ts   # Validación de estado
│   ├── pdfHelpers.ts   # Conversión de colores OKLCH
│   └── styles.ts       # Utilidades de estilos
├── hooks/              # Custom hooks de React
│   └── useAppState.ts  # Hook de estado con reducer
├── components/
│   ├── ui/             # Componentes reutilizables
│   │   ├── Badge.tsx
│   │   ├── Tooltip.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── SectionCard.tsx
│   │   ├── FieldLabel.tsx
│   │   └── index.ts
│   └── sections/       # Componentes de sección grandes
│       ├── SummarySidebar.tsx
│       ├── ReportView.tsx
│       ├── ScenarioManager.tsx
│       ├── ComparisonPanel.tsx
│       ├── Glossary.tsx
│       └── index.ts
└── App.tsx             # Componente principal (orquestación)
```

## 📦 Instalación

```bash
# Clonar repositorio
git clone https://github.com/deyvicode/calcular-pena.git
cd calcular-pena

# Instalar dependencias
npm install

# Modo desarrollo
npm run dev

# Build de producción
npm run build

# Vista previa de build
npm run preview
```

## 🔧 Desarrollo

### Comandos disponibles

```bash
npm run dev       # Servidor de desarrollo (localhost:5173)
npm run build     # Compilar para producción
npm run preview   # Servir build de producción localmente
npm run lint      # Ejecutar ESLint
```

### Agregar nuevas circunstancias

1. Actualizar types en `src/types/index.ts` (agregar nuevas keys)
2. Agregar opciones en `src/utils/constants.ts`
3. El sistema las detectará automáticamente en el wizard

### Agregar nuevos institutos

1. Actualizar `InstitutesState` en `src/types/index.ts`
2. Agregar lógica de cálculo en `src/utils/calculations.ts`
3. Agregar UI en paso 4 de `src/App.tsx`

## 📊 Metodología Legal

### Sistema de 4 etapas

1. **Etapa 1**: División del espacio punitivo en tercios (Art. 45-A.1)
2. **Etapa 2**: Selección del tercio según atenuantes/agravantes (Art. 45-A.2)
3. **Etapa 3**: Circunstancias privilegiadas o cualificadas (Art. 45-A.3)
4. **Etapa 4**: Aplicación de institutos (tentativa, reincidencia, concursos, etc.)

### Fundamento Legal

- **Art. 45 CP**: Circunstancias personales y de la víctima
- **Art. 45-A CP**: Sistema operativo de tercios
- **Art. 46 CP**: Atenuantes y agravantes específicas
- **Acuerdo Plenario 1-2023**: Reglas de motivación y proporcionalidad
- **Acuerdo Plenario 2-2024**: Criterios para tentativa en delitos graves

## 🚀 Despliegue

### GitHub Pages

El proyecto está configurado para despliegue automático en GitHub Pages:

1. Push a `main` activa el workflow `.github/workflows/deploy.yml`
2. Build automático con `npm run build`
3. Deploy a `https://deyvicode.github.io/calcular-pena/`

### Variables de entorno

```bash
# vite.config.ts automáticamente usa:
base: process.env.NODE_ENV === "production" ? "/calcular-pena/" : "/"
```

## 🐛 Solución de Problemas

### Error OKLCH en PDF

Si aparece "Attempting to parse an unsupported color function 'oklch'":
- ✅ Ya resuelto en `src/utils/pdfHelpers.ts`
- El sistema convierte automáticamente OKLCH → RGBA antes de la exportación

### Build fallando

```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📄 Licencia

MIT

## 👤 Autor

**Deyvi Code**
- GitHub: [@deyvicode](https://github.com/deyvicode)
- Proyecto: [calcular-pena](https://github.com/deyvicode/calcular-pena)

## 🙏 Agradecimientos

- Código Penal Peruano - Marco legal de referencia
- Acuerdos Plenarios 1-2023 y 2-2024 - Criterios de aplicación
- Comunidad React/TypeScript - Herramientas y prácticas

---

**Nota**: Esta aplicación es una herramienta de cálculo referencial. La determinación judicial de penas requiere análisis caso por caso y consideración de jurisprudencia actualizada
