import {max} from 'd3-array';
import {scaleLinear} from 'd3-scale';
import {line} from 'd3-shape';
import {EjeX, EjeY} from '../components/Ejes';
import {primero, serie, ultimo} from '../datos';
import {useTamano} from '../hooks/useTamano';
import {useTransicion} from '../hooks/useTransicion';
import {miles, veces} from '../lib/formato';

/** Escena 1. Paso 0: solo 2015. Paso 1: hasta 2019. Paso 2: hasta 2025, con el «×». */
export function Serie({paso}: {paso: number}) {
  const [ref, W] = useTamano();
  const H = Math.round(Math.min(440, Math.max(280, W * 0.66)));
  const M = {arriba: 28, abajo: 30, derecha: W < 480 ? 76 : 84};
  const v = useTransicion({hasta: [primero.anio, 2019, ultimo.anio][paso] ?? ultimo.anio, nota: paso === 2 ? 1 : 0});
  const x = scaleLinear([primero.anio, ultimo.anio], [W < 480 ? 44 : 72, W - M.derecha]);
  const y = scaleLinear([0, (max(serie, (d) => d.total) ?? 1) * 1.08], [H - M.abajo, M.arriba]);

  // Interpolación del último tramo para que la línea crezca de forma continua entre años.
  const puntos = serie.filter((d) => d.anio <= v.hasta).map((d) => ({anio: d.anio, total: d.total}));
  const sig = serie.find((d) => d.anio > v.hasta);
  const ant = puntos[puntos.length - 1];
  if (sig && ant && v.hasta > ant.anio) {
    const t = (v.hasta - ant.anio) / (sig.anio - ant.anio);
    puntos.push({anio: v.hasta, total: ant.total + (sig.total - ant.total) * t});
  }
  const fin = puntos[puntos.length - 1];
  const d = line<{anio: number; total: number}>()
    .x((p) => x(p.anio))
    .y((p) => y(p.total))(puntos);

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full">
        <EjeY y={y} ancho={W} formato={miles} />
        <EjeX x={x} valores={serie.map((s) => s.anio)} alto={H - M.abajo} cada={W < 480 ? 3 : 2} />
        <path d={d ?? ''} className="serie" />
        <g transform={`translate(${x(primero.anio)},${y(primero.total)})`}>
          <circle r={4.5} className="serie-punto" />
          {paso > 0 && (
            <text x={-4} y={18} textAnchor="start" className="serie-etiqueta-sec">
              {miles(primero.total)}
            </text>
          )}
        </g>
        {fin && (
          <g transform={`translate(${x(fin.anio)},${y(fin.total)})`}>
            <circle r={6} className="serie-punto" />
            <text x={10} dy="0.35em" className="serie-etiqueta">
              {miles(Math.round(fin.total))}
            </text>
          </g>
        )}
        {/* Abajo a la derecha, bajo la línea: ahí no hay ni curva ni etiquetas del eje. */}
        <g style={{opacity: v.nota}} transform={`translate(${x(ultimo.anio)},${y(ultimo.total * (W < 480 ? 0.17 : 0.3))})`}>
          <text textAnchor="end" className="anotacion">
            {veces(primero.total, ultimo.total)} que en {primero.anio}
          </text>
        </g>
      </svg>
    </div>
  );
}
