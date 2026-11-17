# El ciberdelito en España, diez años después

Historia con datos (scrollytelling): de 83.058 ciberdelitos conocidos en 2015 a 488.426 en 2025, qué tipos dominan, cuántos se esclarecen, a qué edades afecta y en qué provincias.

Demo: https://pedri77.github.io/ciberdelito-espana/

## Datos

`npm run datos` (scripts/datos.py, solo biblioteca estándar) descarga las tablas a `datos-crudos/` (no se sube), las limpia y escribe `src/datos/*.json` con `procedencia.json`.

- Ministerio del Interior, Portal Estadístico de Criminalidad, series de cibercriminalidad (tablas 05001, 05002, 05005 y 05015). Reutilización citando la fuente.
- INE, Estadística Continua de Población a 1 de enero de 2025 (tablas 56945 y 56934). Reutilización citando al INE.
- Límites provinciales: Instituto Geográfico Nacional (CC BY 4.0) vía [es-atlas](https://github.com/martgnz/es-atlas); proyección con Canarias de [d3-composite-projections](https://github.com/rveciana/d3-composite-projections).

**Cortes y matices.** Hasta 2014 la serie no incluye Mossos d'Esquadra ni Ertzaintza, por eso empieza en 2015. Son hechos conocidos, no delitos cometidos. Las víctimas son victimizaciones. La provincia es donde se conoce el hecho. La tabla del INE por edades incluye un agregado «85 y más años» que el script descarta para no contar dos veces (hay una comprobación).

**Comprobación manual.**
- 2024: 464.801 en el portal, igual que el Informe sobre la cibercriminalidad en España 2024 del Ministerio del Interior.
- 2025: 488.426 en el portal (tabla actualizada el 15-10-2026). El Balance de Criminalidad del cuarto trimestre de 2025 daba 489.248 como dato provisional: la diferencia es la consolidación posterior.
- Tasa nacional: 488.426 / 49.128.297 habitantes = 9,9 por cada 1.000.

## Desarrollo

```bash
npm install
npm run datos     # descarga y limpia (usa uv)
npm run dev       # http://localhost:3029
npm test          # procedencia y cifras clave
node scripts/cifras.mjs http://localhost:3029/   # cifras de la página sin respaldo en los datos
npm run lint && npm run build
```

React 19, Vite, Tailwind 4, d3 por módulos. Cada gráfico tiene su tabla de datos en un desplegable. `?escena=<id>&paso=<n>` enlaza a un paso; `?edad=41-50` resalta un grupo de edad. Despliegue a GitHub Pages en cada push a `main`.
