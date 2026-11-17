import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const leer = (n: string) => JSON.parse(readFileSync(new URL(`../src/datos/${n}.json`, import.meta.url), 'utf8'));
const serie = leer('serie') as {anio: number; total: number; grupos: Record<string, number>}[];
const provincias = leer('provincias') as {tasa: number}[];
const edades = leer('edades') as {poblacion: number}[];
const meta = leer('meta') as {poblacionTotal: number};

// Contraste con cifras publicadas por Interior fuera del portal (ver README, «Comprobación manual»).
test('2024 coincide con el Informe sobre la cibercriminalidad en España 2024 (464.801)', () => {
  assert.equal(serie.find((d) => d.anio === 2024)?.total, 464_801);
});

test('la serie empieza en 2015 (corte por Mossos y Ertzaintza) y acaba en 2025', () => {
  assert.equal(serie[0].anio, 2015);
  assert.equal(serie[serie.length - 1].anio, 2025);
});

test('los grupos penales suman el total cada año', () => {
  for (const d of serie) assert.equal(Object.values(d.grupos).reduce((a, b) => a + b, 0), d.total, String(d.anio));
});

test('52 provincias con tasa razonable (entre 1 y 50 por mil)', () => {
  assert.equal(provincias.length, 52);
  for (const p of provincias) assert.ok(p.tasa > 1 && p.tasa < 50);
});

test('la población por edades suma la población total', () => {
  const suma = edades.reduce((a, e) => a + e.poblacion, 0);
  assert.ok(Math.abs(suma - meta.poblacionTotal) / meta.poblacionTotal < 0.001, `${suma} frente a ${meta.poblacionTotal}`);
});
