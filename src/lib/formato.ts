import {num} from './math';

/** Porcentaje legible: «9 %», «0,5 %», «0,01 %». Nunca «0 %» si no es cero. */
export function pct(fraccion: number) {
  const v = fraccion * 100;
  if (v === 0) return '0\u00a0%';
  if (v >= 10) return `${num(Math.round(v))}\u00a0%`;
  if (v >= 1) return `${num(Math.round(v * 10) / 10)}\u00a0%`;
  if (v >= 0.1) return `${num(Math.round(v * 100) / 100)}\u00a0%`;
  return `${num(Number(v.toPrecision(1)))}\u00a0%`;
}

export const plural = (n: number, uno: string, varios: string) => `${num(n)} ${n === 1 ? uno : varios}`;

/** «5,9 veces» a partir de dos valores; «el doble» y «el triple» cuando toca. */
export function veces(desde: number, hasta: number) {
  const v = hasta / desde;
  if (Math.abs(v - 2) < 0.05) return 'el doble';
  if (Math.abs(v - 3) < 0.05) return 'el triple';
  return `${num(Math.round(v * 10) / 10)} veces`;
}

/** Cifra redondeada para titulares: 488.426 → «488.000»; 1.234.567 → «1,2 millones». */
export function redondo(v: number) {
  if (Math.abs(v) >= 1e6) return `${num(Math.round(v / 1e5) / 10)} millones`;
  if (Math.abs(v) >= 1e4) return (Math.round(v / 1000) * 1000).toLocaleString('es-ES');
  return v.toLocaleString('es-ES');
}

/** Miles siempre con punto (también 4 cifras), para tablas y ejes: 9773 → «9.773». */
export const miles = (v: number) => v.toLocaleString('es-ES', {useGrouping: 'always' as unknown as boolean, maximumFractionDigits: 1});
