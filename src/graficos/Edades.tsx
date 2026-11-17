import {max} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {edades} from '../datos';
import {useTamano} from '../hooks/useTamano';
import {useTransicion} from '../hooks/useTransicion';
import {miles} from '../lib/formato';
import {num} from '../lib/math';

/**
 * Escena 4. Paso 0: víctimas en 2015. Paso 1: en 2025 (los mayores de 65, resaltados).
 * Paso 2: por cada 1.000 habitantes de cada edad, con el grupo del lector resaltado.
 */
export function Edades({paso, miGrupo}: {paso: number; miGrupo: string | null}) {
  const [ref, W] = useTamano();
  const H = Math.round(Math.min(420, Math.max(280, W * 0.62)));
  const izquierda = 84;
  const valores = edades.map((e) => (paso === 0 ? e.victimas2015 : paso === 1 ? e.victimas : e.tasa));
  const v = useTransicion({valores, dominio: paso === 2 ? (max(edades, (e) => e.tasa) ?? 1) : (max(edades, (e) => e.victimas) ?? 1)});
  const y = scaleBand(edades.map((e) => e.grupo), [16, H - 16]).padding(0.25);
  const x = scaleLinear([0, v.dominio * 1.12], [izquierda, W - (W < 480 ? 62 : 80)]);
  const resaltado = (g: string) => (paso === 1 && g === 'Más de 65') || (paso === 2 && g === miGrupo);

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full">
        {edades.map((e, i) => {
          const val = v.valores[i];
          return (
            <g key={e.grupo}>
              <text x={0} y={(y(e.grupo) ?? 0) + y.bandwidth() / 2} dy="0.35em" className="eje-texto eje-texto-grande">
                {e.grupo}
              </text>
              <rect x={izquierda} y={y(e.grupo)} width={Math.max(1, x(val) - izquierda)} height={y.bandwidth()} className={resaltado(e.grupo) ? 'barra-resaltada' : 'barra'} />
              <text x={x(val) + 6} y={(y(e.grupo) ?? 0) + y.bandwidth() / 2} dy="0.35em" className="serie-etiqueta-sec">
                {paso === 2 ? `${num(Math.round(val * 10) / 10)} ‰` : miles(Math.round(val))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
