import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';

const dir = new URL('../src/datos/', import.meta.url);
const ficheros = readdirSync(dir).filter((f) => f.endsWith('.json') && f !== 'procedencia.json');
const procedencia = JSON.parse(readFileSync(new URL('procedencia.json', dir), 'utf8'));

test('cada JSON de datos tiene procedencia completa', () => {
  for (const f of ficheros) {
    const p = procedencia[f.replace('.json', '')];
    assert.ok(p, `${f} sin procedencia`);
    for (const k of ['fuente', 'url', 'licencia', 'descargado']) assert.ok(p[k], `${f}: falta ${k}`);
  }
});

test('ningún dato es NaN ni infinito', () => {
  for (const f of ficheros) {
    JSON.parse(readFileSync(new URL(f, dir), 'utf8'), (k, v) => {
      if (typeof v === 'number') assert.ok(Number.isFinite(v), `${f}: ${k} no es finito`);
      return v;
    });
  }
});
