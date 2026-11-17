import {max} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {area, line} from 'd3-shape';
import {EjeX, EjeY} from '../components/Ejes';
import {esclarecidos, tasaEsclarecido} from '../datos';
import {useTamano} from '../hooks/useTamano';
import {useTransicion} from '../hooks/useTransicion';
import {miles, pct} from '../lib/formato';

type D = (typeof esclarecidos)[number];
const primero = esclarecidos[0];
const ultimo = esclarecidos[esclarecidos.length - 1];

/**
 * Escena 3. Paso 0: conocidos. Paso 1: aparecen los esclarecidos y el hueco entre ambos.
 * Paso 2: el porcentaje esclarecido, solo.
 */
export function Hueco({paso}: {paso: number}) {
  const [ref, W] = useTamano();
  const H = Math.round(Math.min(440, Math.max(280, W * 0.66)));
  const abajo = 30;
  const derecha = W < 480 ? 70 : 96;
  const v = useTransicion({esc: paso >= 1 ? 1 : 0, pct: paso === 2 ? 1 : 0});
  const x = scaleLinear([primero.anio, ultimo.anio], [34, W - derecha]);
  const y = scaleLinear([0, (max(esclarecidos, (d) => d.conocidos) ?? 1) * 1.08], [H - abajo, 24]);
  const yp = scaleLinear([0, 0.3], [H - abajo, 24]);
  const lC = line<D>()
    .x((d) => x(d.anio))
    .y((d) => y(d.conocidos))(esclarecidos);
  const lE = line<D>()
    .x((d) => x(d.anio))
    .y((d) => y(d.esclarecidos))(esclarecidos);
  const hueco = area<D>()
    .x((d) => x(d.anio))
    .y0((d) => y(d.esclarecidos))
    .y1((d) => y(d.conocidos))(esclarecidos);
  const lP = line<D>()
    .x((d) => x(d.anio))
    .y((d) => yp(tasaEsclarecido(d)))(esclarecidos);

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full">
        <EjeX x={x} valores={esclarecidos.map((d) => d.anio)} alto={H - abajo} cada={W < 480 ? 3 : 2} />
        <g style={{opacity: 1 - v.pct}}>
          <EjeY y={y} ancho={W} formato={miles} />
          <path d={hueco ?? ''} className="hueco" style={{opacity: v.esc}} />
          <path d={lC ?? ''} className="serie" />
          <text x={x(ultimo.anio) + 8} y={y(ultimo.conocidos)} dy="0.35em" className="serie-etiqueta">
            conocidos
          </text>
          <g style={{opacity: v.esc}}>
            <path d={lE ?? ''} className="serie serie-2" />
            <text x={x(ultimo.anio) + 8} y={y(ultimo.esclarecidos)} dy="0.35em" className="serie-etiqueta serie-etiqueta-2">
              esclarecidos
            </text>
          </g>
        </g>
        <g style={{opacity: v.pct}}>
          <EjeY y={yp} ancho={W} formato={(t) => pct(t)} ticks={3} />
          <path d={lP ?? ''} className="serie serie-2" />
          {[primero, ultimo].map((d) => (
            <g key={d.anio} transform={`translate(${x(d.anio)},${yp(tasaEsclarecido(d))})`}>
              <circle r={5} className="serie-punto-2" />
              <text x={d === ultimo ? 10 : 8} y={d === ultimo ? 0 : -14} dy={d === ultimo ? '0.35em' : 0} className="serie-etiqueta serie-etiqueta-2">
                {pct(tasaEsclarecido(d))}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
