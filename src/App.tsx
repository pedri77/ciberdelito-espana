/**
 * Guion (references/guion.md de web-datos). Hallazgo: en diez años la ciberdelincuencia conocida se
 * multiplica por casi seis, es sobre todo estafa, se esclarece cada vez menos y afecta a todas las edades
 * adultas por igual. Intuición que corrige: «eso les pasa a otros» (a los jóvenes o a los mayores).
 *
 * | Escena       | Gráfico                  | Pasos                                                |
 * | serie        | línea 2015–2025           | 2015 · hasta 2019 · hasta 2025 con el «×»            |
 * | tipos        | barras apiladas           | cifras · porcentaje · desglose del resto (2025)      |
 * | hueco        | conocidos y esclarecidos  | conocidos · + esclarecidos y hueco · % esclarecido   |
 * | edades       | barras por edad           | víctimas 2015 · 2025 · por 1.000 habitantes + «tú»   |
 * | mapa         | coroplético provincial    | tasa · las 5 con más · las 5 con menos               |
 *
 * Estados QA: escena=<id>&paso=<n> para cada escena y paso; edad=41-50 para el resaltado del lector.
 * Ninguna cifra tecleada: todas salen de src/datos.ts.
 */
import {useEffect, useState} from 'react';
import {Figura} from './components/Figura';
import {Scrolly} from './components/Scrolly';
import {contenido as c} from './content';
import {edades, esclarecidos, FRAUDE, fraudeShare, fuentes, meta, primero, procedencia, provincias, serie, tasaEsclarecido, tasaNacional, ultimo} from './datos';
import {Edades} from './graficos/Edades';
import {Hueco} from './graficos/Hueco';
import {Mapa} from './graficos/Mapa';
import {Serie} from './graficos/Serie';
import {Tipos} from './graficos/Tipos';
import {miles, pct, veces} from './lib/formato';
import {num} from './lib/math';

const fecha = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', {day: 'numeric', month: 'long', year: 'numeric'});
const unoDecimal = (v: number) => num(Math.round(v * 10) / 10);
const lista = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs[xs.length - 1]}` : xs[0]);

const a2019 = serie.find((d) => d.anio === 2019)!;
const otros = Object.entries(ultimo.grupos)
  .filter(([g]) => g !== FRAUDE)
  .sort((a, b) => b[1] - a[1]);
const esc0 = esclarecidos[0];
const escN = esclarecidos[esclarecidos.length - 1];
const sinResolver = 1 - tasaEsclarecido(escN);
const mayores = edades.find((e) => e.grupo === 'Más de 65')!;
const adultos = edades.filter((e) => !['Menores', 'Más de 65'].includes(e.grupo));
const tasaMin = Math.min(...adultos.map((e) => e.tasa));
const tasaMax = Math.max(...adultos.map((e) => e.tasa));
const masProv = provincias.slice(0, 5).map((p) => p.nombre);
const menosProv = provincias.slice(-5).map((p) => p.nombre);
const pMax = provincias[0];
const pMin = provincias[provincias.length - 1];

/** Grupo de edad del lector, en ?edad= para que se pueda enlazar. */
function useEdad() {
  const [edad, setEdad] = useState<string | null>(() => {
    const e = new URLSearchParams(location.search).get('edad');
    return edades.some((x) => x.grupo === e) ? e : null;
  });
  useEffect(() => {
    const url = new URL(location.href);
    if (edad) url.searchParams.set('edad', edad);
    else url.searchParams.delete('edad');
    history.replaceState(null, '', url);
  }, [edad]);
  return [edad, setEdad] as const;
}

function Titulo({id, children}: {id: string; children: React.ReactNode}) {
  return (
    <h2 id={`${id}-titulo`} className="font-display text-display text-balance">
      {children}
    </h2>
  );
}

export default function App() {
  const [edad, setEdad] = useEdad();
  const mia = edades.find((e) => e.grupo === edad);

  return (
    <main>
      <header className="mx-auto max-w-3xl px-4 pt-20 pb-16 sm:px-6 sm:pt-28">
        <p className="text-etiqueta uppercase text-texto-3">{c.antetitulo}</p>
        <h1 className="mt-4 font-display text-hero text-balance">{c.titulo}</h1>
        <p className="mt-6 text-lead text-texto-2 text-pretty">
          En {primero.anio} la policía tuvo noticia de {miles(primero.total)} ciberdelitos en España. En {ultimo.anio}, de {miles(ultimo.total)}. Cinco gráficos para entender qué ha
          cambiado, a quién le pasa y cuántos se resuelven.
        </p>
        <p className="mt-6 text-body text-texto-3">
          Datos del Portal Estadístico de Criminalidad, actualizados el {fecha(meta.actualizado)}. Población del INE a 1 de enero de {ultimo.anio}.
        </p>
      </header>

      <Scrolly
        id="serie"
        grafico={(paso) => (
          <Figura titulo="Ciberdelitos conocidos por año" fuente="serie" tabla={{columnas: ['Año', 'Hechos conocidos'], filas: serie.map((d) => [d.anio, d.total])}}>
            <Serie paso={paso} />
          </Figura>
        )}
        pasos={[
          <>
            <Titulo id="serie">Cada vez más</Titulo>
            <p className="mt-3">En {primero.anio}, las fuerzas de seguridad conocieron {miles(primero.total)} hechos relacionados con la cibercriminalidad.</p>
          </>,
          <p>
            En {a2019.anio} ya eran {miles(a2019.total)}: {veces(primero.total, a2019.total)} más en cuatro años.
          </p>,
          <p>
            Y en {ultimo.anio}, {miles(ultimo.total)}.{' '}
            <strong>
              {veces(primero.total, ultimo.total)} más que en {primero.anio}
            </strong>
            , unos {miles(Math.round(ultimo.total / 365))} al día.
          </p>,
        ]}
      />

      <Scrolly
        id="tipos"
        grafico={(paso) => (
          <Figura
            titulo={paso === 2 ? `El resto de ${ultimo.anio}, por tipo` : 'Ciberdelitos conocidos por tipo'}
            fuente="serie"
            tabla={{
              columnas: ['Año', 'Estafa y fraude informático', 'Resto', '% estafa'],
              filas: serie.map((d) => [d.anio, d.grupos[FRAUDE], d.total - d.grupos[FRAUDE], pct(fraudeShare(d))]),
            }}
          >
            <Tipos paso={paso} />
          </Figura>
        )}
        pasos={[
          <>
            <Titulo id="tipos">Sobre todo, estafas</Titulo>
            <p className="mt-3">
              En azul, la estafa y el fraude informático: compras que no llegan, suplantaciones del banco, tarjetas que usa otro. En gris, todo lo demás.
            </p>
          </>,
          <p>
            En porcentaje se ve mejor: la estafa pasa del {pct(fraudeShare(primero))} al {pct(fraudeShare(ultimo))} de todos los ciberdelitos conocidos.
          </p>,
          <p>
            El {pct(1 - fraudeShare(ultimo))} restante de {ultimo.anio} es sobre todo {otros[0][0].toLowerCase()} ({miles(otros[0][1])}), {otros[1][0].toLowerCase()} (
            {miles(otros[1][1])}) y {otros[2][0].toLowerCase()} ({miles(otros[2][1])}).
          </p>,
        ]}
      />

      <Scrolly
        id="hueco"
        grafico={(paso) => (
          <Figura
            titulo={paso === 2 ? 'Porcentaje de ciberdelitos esclarecidos' : 'Ciberdelitos conocidos y esclarecidos'}
            fuente="esclarecidos"
            tabla={{
              columnas: ['Año', 'Conocidos', 'Esclarecidos', '% esclarecido'],
              filas: esclarecidos.map((d) => [d.anio, d.conocidos, d.esclarecidos, pct(tasaEsclarecido(d))]),
            }}
          >
            <Hueco paso={paso} />
          </Figura>
        )}
        pasos={[
          <>
            <Titulo id="hueco">Y cada vez se resuelven menos</Titulo>
            <p className="mt-3">La línea azul son los hechos conocidos. Ya la has visto subir.</p>
          </>,
          <p>
            La naranja, los esclarecidos: aquellos en los que se identifica al autor o se da el caso por resuelto. El hueco entre las dos son los que quedan sin resolver:{' '}
            {miles(escN.conocidos - escN.esclarecidos)} en {escN.anio}.
          </p>,
          <p>
            En {esc0.anio} se esclarecía el {pct(tasaEsclarecido(esc0))}. En {escN.anio}, el {pct(tasaEsclarecido(escN))}.{' '}
            <strong>
              De cada diez ciberdelitos conocidos, {num(Math.floor(sinResolver * 10))} o más quedan sin resolver.
            </strong>
          </p>,
        ]}
      />

      <Scrolly
        id="edades"
        grafico={(paso) => (
          <Figura
            titulo={paso === 2 ? `Víctimas en ${ultimo.anio} por cada 1.000 habitantes de cada edad` : `Víctimas por edad en ${paso === 0 ? primero.anio : ultimo.anio}`}
            fuente="edades"
            tabla={{
              columnas: ['Edad', `Víctimas ${primero.anio}`, `Víctimas ${ultimo.anio}`, 'Por 1.000 habitantes'],
              filas: edades.map((e) => [e.grupo, e.victimas2015, e.victimas, unoDecimal(e.tasa)]),
            }}
          >
            <Edades paso={paso} miGrupo={edad} />
          </Figura>
        )}
        pasos={[
          <>
            <Titulo id="edades">¿A quién le pasa?</Titulo>
            <p className="mt-3">
              Víctimas registradas por edad en {primero.anio}. El grupo más numeroso era el de {[...edades].sort((a, b) => b.victimas2015 - a.victimas2015)[0].grupo} años.
            </p>
          </>,
          <p>
            En {ultimo.anio} crecen todas, pero las de más de 65 años se multiplican por {num(Math.round(mayores.victimas / mayores.victimas2015))}: de {miles(mayores.victimas2015)} a{' '}
            {miles(mayores.victimas)}.
          </p>,
          <div>
            <p>
              Y si se cuenta por habitante, la idea de que «les pasa a otros» se cae: entre los 18 y los 65 años, la tasa va de {unoDecimal(tasaMin)} a {unoDecimal(tasaMax)} víctimas por cada
              1.000 personas. <strong>Más o menos una de cada cien, cada año, tenga la edad que tenga.</strong>
            </p>
            <label className="mt-4 block text-etiqueta uppercase text-texto-3" htmlFor="mi-edad">
              ¿Cuál es tu grupo?
            </label>
            <select id="mi-edad" className="selector mt-2" value={edad ?? ''} onChange={(e) => setEdad(e.target.value || null)}>
              <option value="">Elige tu edad</option>
              {edades.map((e) => (
                <option key={e.grupo} value={e.grupo}>
                  {e.grupo}
                </option>
              ))}
            </select>
            {mia && (
              <p className="mt-3" aria-live="polite">
                En tu grupo ({mia.grupo}) hubo {miles(mia.victimas)} víctimas en {ultimo.anio}: {unoDecimal(mia.tasa)} de cada 1.000 personas.
              </p>
            )}
          </div>,
        ]}
      />

      <Scrolly
        id="mapa"
        grafico={(paso) => (
          <Figura
            titulo={`Ciberdelitos conocidos por cada 1.000 habitantes, ${ultimo.anio}`}
            fuente="provincias"
            tabla={{columnas: ['Provincia', 'Hechos conocidos', 'Población', 'Por 1.000 habitantes'], filas: provincias.map((p) => [p.nombre, p.hechos, p.poblacion, unoDecimal(p.tasa)])}}
          >
            <Mapa paso={paso} />
          </Figura>
        )}
        pasos={[
          <>
            <Titulo id="mapa">¿Y dónde?</Titulo>
            <p className="mt-3">
              Para comparar provincias hay que dividir por la población. En el conjunto de España salen {unoDecimal(tasaNacional)} ciberdelitos conocidos por cada 1.000 habitantes.
            </p>
          </>,
          <p>
            Las cinco con la tasa más alta: {lista(masProv)}. {pMax.nombre} llega a {unoDecimal(pMax.tasa)}.
          </p>,
          <p>
            Las cinco con la más baja: {lista(menosProv)}, con {unoDecimal(pMin.tasa)} en {pMin.nombre}. Ojo: el dato es la provincia donde se conoce el hecho, no donde vive la víctima ni
            donde está el estafador.
          </p>,
        ]}
      />

      <section className="mx-auto max-w-3xl px-4 py-24 sm:px-6" aria-labelledby="matiz">
        <h2 id="matiz" className="font-display text-display">
          {c.cierreTitulo}
        </h2>
        <ul className="mt-6 list-disc space-y-4 pl-5 text-lead text-texto-2 text-pretty">
          <li>
            Son <strong>hechos conocidos</strong> por la policía, no todos los ciberdelitos que se cometen. Muchas estafas pequeñas no se denuncian: la cifra real es mayor.
          </li>
          <li>La serie empieza en {primero.anio} porque hasta 2014 no incluía los datos de los Mossos d'Esquadra ni de la Ertzaintza: antes no se puede comparar.</li>
          <li>
            Las víctimas son <strong>victimizaciones</strong>: una persona estafada dos veces cuenta dos. Y no todos los hechos tienen una víctima identificada.
          </li>
          <li>Que suban los hechos conocidos también puede deberse a que se denuncia más, no solo a que haya más delitos. Estos datos no permiten separar las dos cosas.</li>
        </ul>
        <div className="tarjeta mt-12">
          <p className="text-body text-texto-2">{c.cta.texto}</p>
          <a className="boton mt-4" href={c.cta.url} rel="noopener">
            {c.cta.boton}
          </a>
        </div>
        <h2 className="mt-14 text-etiqueta uppercase text-texto-3">Fuentes</h2>
        <ul className="mt-3 space-y-2 text-body text-texto-2">
          {fuentes.map((f) => (
            <li key={f.url}>
              <a className="underline decoration-borde underline-offset-4" href={f.url} rel="noopener">
                {f.fuente}
              </a>
              . {f.licencia}. Descargado el {fecha(procedencia.serie.descargado)}.
            </li>
          ))}
          <li>
            <a className="underline decoration-borde underline-offset-4" href={c.geografia.url} rel="noopener">
              {c.geografia.fuente}
            </a>
            .
          </li>
        </ul>
        <p className="mt-10 text-etiqueta uppercase text-texto-3">{c.pie}</p>
      </section>
    </main>
  );
}
