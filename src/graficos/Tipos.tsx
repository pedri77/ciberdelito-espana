import {max} from 'd3-array';
import {scaleBand, scaleLinear} from 'd3-scale';
import {EjeY} from '../components/Ejes';
import {FRAUDE, fraudeShare, serie, ultimo} from '../datos';
import {useTamano} from '../hooks/useTamano';
import {useTransicion} from '../hooks/useTransicion';
import {miles, pct} from '../lib/formato';

const otros = Object.entries(ultimo.grupos)
  .filter(([g]) => g !== FRAUDE)
  .sort((a, b) => b[1] - a[1]);

/**
 * Escena 2. Paso 0: barras apiladas en cifras (estafa frente al resto). Paso 1: las mismas en
 * porcentaje. Paso 2: el resto de 2025, desglosado.
 */
export function Tipos({paso}: {paso: number}) {
  const [ref, W] = useTamano();
  const H = Math.round(Math.min(440, Math.max(300, W * 0.66)));
  const abajo = 30;
  const v = useTransicion({modo: paso >= 1 ? 1 : 0, barras: paso === 2 ? 0 : 1});
  const xb = scaleBand(serie.map((d) => String(d.anio)), [34, W - 8]).padding(0.22);
  const yAbs = scaleLinear([0, (max(serie, (d) => d.total) ?? 1) * 1.05], [H - abajo, 24]);
  const yPct = scaleLinear([0, 1], [H - abajo, 24]);
  const alto = (valor: number, total: number) => (H - abajo - yAbs(valor)) * (1 - v.modo) + (H - abajo - yPct(valor / total)) * v.modo;
  const estrecho = W < 480;

  // Desglose del resto (paso 2).
  const yo = scaleBand(otros.map(([g]) => g), [24, H - abajo]).padding(0.28);
  const xo = scaleLinear([0, otros[0][1] * 1.15], [estrecho ? 178 : 196, W - 56]);

  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="block max-w-full">
        <g style={{opacity: v.barras}}>
          {v.modo < 0.5 ? <EjeY y={yAbs} ancho={W} formato={miles} /> : <EjeY y={yPct} ancho={W} formato={(t) => pct(t)} />}
          {serie.map((d) => {
            const hF = alto(d.grupos[FRAUDE], d.total);
            const hT = alto(d.total, d.total);
            const x0 = xb(String(d.anio)) ?? 0;
            const etiqueta = d.anio === serie[0].anio || d.anio === ultimo.anio;
            return (
              <g key={d.anio}>
                <rect x={x0} y={H - abajo - hT} width={xb.bandwidth()} height={hT - hF} className="barra-fondo" />
                <rect x={x0} y={H - abajo - hF} width={xb.bandwidth()} height={hF} className="barra" />
                {(!estrecho || etiqueta) && (
                  <text x={x0 + xb.bandwidth() / 2} y={H - abajo + 18} textAnchor="middle" className="eje-texto">
                    {estrecho ? d.anio : `'${String(d.anio).slice(2)}`}
                  </text>
                )}
                {etiqueta && v.modo > 0.5 && (
                  <text x={x0 + xb.bandwidth() / 2} y={H - abajo - hF + 16} textAnchor="middle" className="barra-texto">
                    {pct(fraudeShare(d))}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        <g style={{opacity: 1 - v.barras}}>
          {otros.map(([g, n]) => (
            <g key={g}>
              <text x={0} y={(yo(g) ?? 0) + yo.bandwidth() / 2} dy="0.35em" className={`eje-texto ${estrecho ? '' : 'eje-texto-grande'}`}>
                {g}
              </text>
              <rect x={xo(0)} y={yo(g)} width={Math.max(1, xo(n) - xo(0))} height={yo.bandwidth()} className="barra-fondo-oscuro" />
              <text x={xo(n) + 6} y={(yo(g) ?? 0) + yo.bandwidth() / 2} dy="0.35em" className="serie-etiqueta-sec">
                {miles(n)}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
