import {geoConicConformalSpain} from 'd3-composite-projections';
import {geoPath} from 'd3-geo';
import {interpolateLab} from 'd3-interpolate';
import {scaleThreshold} from 'd3-scale';
import provinciasTopo from 'es-atlas/es/provinces.json';
import {feature} from 'topojson-client';
import type {GeometryCollection, Topology} from 'topojson-specification';
import {provincias} from '../datos';
import {useTamano} from '../hooks/useTamano';
import {num} from '../lib/math';

const topo = provinciasTopo as unknown as Topology<{provinces: GeometryCollection<{name: string}>}>;
const geo = feature(topo, topo.objects.provinces);
const porId = new Map(provincias.map((p) => [p.id, p]));

/** Cortes de la escala: tasa por 1.000 habitantes. Legibles, no cuantiles. */
export const CORTES = [8, 9, 10, 11, 12];
const color = scaleThreshold<number, string>(
  CORTES,
  [0.08, 0.25, 0.42, 0.58, 0.75, 0.92].map((t) => interpolateLab('#e6edf6', '#1d3461')(t)),
);
const mas = provincias.slice(0, 5).map((p) => p.id);
const menos = provincias.slice(-5).map((p) => p.id);

/** Escena 5. Paso 0: mapa por tasa. Paso 1: las cinco con más. Paso 2: las cinco con menos. */
export function Mapa({paso}: {paso: number}) {
  const [ref, W] = useTamano();
  const H = Math.round(W * 0.82);
  const proy = geoConicConformalSpain().fitSize([W, H], geo);
  const camino = geoPath(proy);
  const foco = paso === 1 ? mas : paso === 2 ? menos : [];

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full">
        {geo.features.map((f) => {
          const p = porId.get(String(f.id));
          const destacado = foco.includes(String(f.id));
          return (
            <path
              key={String(f.id)}
              d={camino(f) ?? ''}
              fill={p ? color(p.tasa) : 'var(--color-dato-fondo)'}
              className={`provincia ${foco.length && !destacado ? 'atenuada' : ''} ${destacado ? 'destacada' : ''}`}
            />
          );
        })}
        <path d={proy.getCompositionBorders()} className="borde-canarias" />
      </svg>
      <Leyenda />
    </div>
  );
}

function Leyenda() {
  const tramos = [`menos de ${CORTES[0]}`, ...CORTES.slice(0, -1).map((c, i) => `${c}–${CORTES[i + 1]}`), `${CORTES[CORTES.length - 1]} o más`];
  return (
    <div className="leyenda-mapa" aria-hidden>
      <span className="leyenda-titulo">Por cada 1.000 habitantes</span>
      <span className="leyenda-tramos">
        {tramos.map((t, i) => (
          <span key={t}>
            <i style={{background: color.range()[i]}} />
            {t.replace(/\d+/g, (n) => num(Number(n)))}
          </span>
        ))}
      </span>
    </div>
  );
}
