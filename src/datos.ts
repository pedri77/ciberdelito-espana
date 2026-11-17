/**
 * Único punto de entrada a los datos (generados por `npm run datos`).
 * Ninguna cifra de la página se escribe a mano: sale de aquí o se calcula a partir de aquí.
 */
import edadesJson from './datos/edades.json';
import esclarecidosJson from './datos/esclarecidos.json';
import fuentesJson from './datos/fuentes.json';
import metaJson from './datos/meta.json';
import procedenciaJson from './datos/procedencia.json';
import provinciasJson from './datos/provincias.json';
import serieJson from './datos/serie.json';

export type Fuente = {fuente: string; url: string; licencia: string; descargado: string; nota?: string};
export const procedencia = procedenciaJson as Record<keyof typeof procedenciaJson, Fuente>;
export type ClaveFuente = keyof typeof procedenciaJson;

export type Anio = {anio: number; total: number; grupos: Record<string, number>};
export const serie = serieJson as Anio[];
export const esclarecidos = esclarecidosJson as {anio: number; conocidos: number; esclarecidos: number}[];
export const edades = edadesJson as {grupo: string; victimas2015: number; victimas: number; poblacion: number; tasa: number}[];
export const provincias = provinciasJson as {id: string; nombre: string; hechos: number; poblacion: number; tasa: number}[];
export const meta = metaJson as {actualizado: string; poblacionTotal: number};

export const FRAUDE = 'Estafa y fraude informático';
export const primero = serie[0];
export const ultimo = serie[serie.length - 1];
export const fraudeShare = (a: Anio) => a.grupos[FRAUDE] / a.total;
export const tasaEsclarecido = (d: {conocidos: number; esclarecidos: number}) => d.esclarecidos / d.conocidos;
/** Tasa nacional por 1.000 habitantes (hechos del último año / población a 1 de enero). */
export const tasaNacional = (ultimo.total / meta.poblacionTotal) * 1000;
export const fuentes = fuentesJson as {fuente: string; url: string; licencia: string}[];
