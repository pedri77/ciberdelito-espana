#!/usr/bin/env python3
"""
Descarga, limpia y guarda los datos de la web en src/datos/*.json, con su procedencia.

Uso (desde la raíz del proyecto):  npm run datos   (= uv run python -I scripts/datos.py)

Reglas:
- Solo biblioteca estándar (urllib, csv, json): nada que instalar.
- Lo descargado se guarda en datos-crudos/ (ignorado por git) y se reutiliza: no se machaca la fuente
  en cada ejecución. Bórralo para volver a descargar.
- Cada JSON que se escribe lleva su entrada en src/datos/procedencia.json: fuente, URL, licencia,
  fecha de descarga y nota (cortes de serie, cambios de metodología). Sin procedencia, no se escribe.
- Guarda solo lo que la página usa, ya agregado: el JSON va dentro del bundle.

Este fichero es una plantilla: cambia FUENTES y preparar().
"""
import csv
import datetime
import io
import json
import pathlib
import urllib.request

RAIZ = pathlib.Path.cwd()
CRUDOS = RAIZ / "datos-crudos"
SALIDA = RAIZ / "src" / "datos"
HOY = datetime.date.today().isoformat()

# Una entrada por fichero de origen.
_LIC_MIR = "Reutilización permitida citando la fuente (aviso legal del Portal Estadístico de Criminalidad)"
_NOTA_MIR = "Hasta 2014 no incluye datos de Mossos d'Esquadra ni Ertzaintza: la serie se usa desde 2015. Hechos conocidos por las fuerzas de seguridad, no delitos cometidos"
_LIC_INE = "Reutilización libre citando al INE como fuente (aviso legal del INE)"
FUENTES = {
    "conocidos": {"url": "https://estadisticasdecriminalidad.ses.mir.es/sec/jaxiPx/files/_px/es/csv_bdsc/Datos5/l0/05001.csv_bdsc", "fuente": "Ministerio del Interior, Portal Estadístico de Criminalidad: hechos conocidos de cibercriminalidad por grupo penal (tabla 05001)", "licencia": _LIC_MIR, "nota": _NOTA_MIR},
    "provincias": {"url": "https://estadisticasdecriminalidad.ses.mir.es/sec/jaxiPx/files/_px/es/csv_bdsc/Datos5/l0/05002.csv_bdsc", "fuente": "Ministerio del Interior, Portal Estadístico de Criminalidad: hechos conocidos de cibercriminalidad por provincia (tabla 05002)", "licencia": _LIC_MIR, "nota": "Provincia donde se conoce el hecho, no necesariamente donde vive la víctima"},
    "esclarecidos": {"url": "https://estadisticasdecriminalidad.ses.mir.es/sec/jaxiPx/files/_px/es/csv_bdsc/Datos5/l0/05005.csv_bdsc", "fuente": "Ministerio del Interior, Portal Estadístico de Criminalidad: hechos esclarecidos de cibercriminalidad (tabla 05005)", "licencia": _LIC_MIR, "nota": _NOTA_MIR},
    "victimas": {"url": "https://estadisticasdecriminalidad.ses.mir.es/sec/jaxiPx/files/_px/es/csv_bdsc/Datos5/l0/05015.csv_bdsc", "fuente": "Ministerio del Interior, Portal Estadístico de Criminalidad: victimizaciones de cibercriminalidad por edad y sexo (tabla 05015)", "licencia": _LIC_MIR, "nota": "Victimizaciones registradas: una persona puede contar más de una vez"},
    "px": {"url": "https://estadisticasdecriminalidad.ses.mir.es/sec/jaxiPx/files/_px/es/px/Datos5/l0/05001.px", "fuente": "Ministerio del Interior (metadatos de la tabla 05001)", "licencia": _LIC_MIR},
    "pob_prov": {"url": "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/56945?nult=1&tv=356:15668", "fuente": "INE, Estadística Continua de Población: población residente por provincia a 1 de enero de 2025 (tabla 56945)", "licencia": _LIC_INE},
    "pob_edad": {"url": "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/56934?nult=1", "fuente": "INE, Estadística Continua de Población: población residente por edad a 1 de enero de 2025 (tabla 56934)", "licencia": _LIC_INE},
}

def descargar(clave: str) -> str:
    """Devuelve el texto de la fuente, usando la copia de datos-crudos/ si existe."""
    CRUDOS.mkdir(exist_ok=True)
    f = FUENTES[clave]
    destino = CRUDOS / f"{clave}{pathlib.Path(f['url'].split('?')[0]).suffix or '.json'}"
    if not destino.exists():
        req = urllib.request.Request(f["url"], headers={"User-Agent": "web-datos/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            destino.write_bytes(r.read())
    bruto = destino.read_bytes()
    for codificacion in ("utf-8-sig", "iso-8859-15"):
        try:
            return bruto.decode(codificacion)
        except UnicodeDecodeError:
            continue
    raise ValueError(f"{clave}: codificación desconocida")


def leer_csv(texto: str, sep: str = ";") -> list[dict]:
    return list(csv.DictReader(io.StringIO(texto), delimiter=sep))


def numero(v: str) -> float | None:
    """'13.753' → 13753; '1.234,5' → 1234.5; vacío o '..' → None (dato no disponible, no cero)."""
    v = (v or "").strip()
    if v in ("", "..", ".", "-"):
        return None
    return float(v.replace(".", "").replace(",", "."))


_procedencia: dict = {}


def escribir(nombre: str, datos, *claves_fuente: str, nota: str | None = None) -> None:
    """Escribe src/datos/<nombre>.json y registra su procedencia (una o varias fuentes)."""
    if not claves_fuente:
        raise ValueError(f"{nombre}: sin fuente no se escribe")
    SALIDA.mkdir(parents=True, exist_ok=True)
    (SALIDA / f"{nombre}.json").write_text(json.dumps(datos, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    fs = [FUENTES[c] for c in claves_fuente]
    _procedencia[nombre] = {
        "fuente": "; ".join(f["fuente"] for f in fs),
        "url": fs[0]["url"],
        "licencia": "; ".join(sorted({f["licencia"] for f in fs})),
        "descargado": HOY,
        **({"nota": nota or "; ".join(dict.fromkeys(f["nota"] for f in fs if f.get("nota")))} if (nota or any(f.get("nota") for f in fs)) else {}),
    }


ANIOS = range(2015, 2026)
NAC = "TOTAL NACIONAL"
TOTAL = "TOTAL grupo penal"
# Nombres cortos para los grupos penales (los del Ministerio, en minúscula y abreviados).
GRUPOS = {
    "FRAUDE INFORMÁTICO": "Estafa y fraude informático",
    "AMENAZAS Y COACCIONES": "Amenazas y coacciones",
    "ACCESO  E INTERCEPTACIÓN ILÍCITA": "Acceso ilícito a sistemas",
    "DELITOS SEXUALES": "Delitos sexuales",
    "FALSIFICACIÓN INFORMÁTICA": "Falsificación informática",
    "CONTRA EL HONOR": "Contra el honor",
    "INTERFERENCIA EN LOS DATOS Y EN EL SISTEMA": "Daños a datos y sistemas",
    "CONTRA LA PROPIEDAD INDUSTRIAL/INTELECTUAL": "Propiedad intelectual",
}
EDADES = [  # (grupo del Ministerio, etiqueta, edad mínima, edad máxima)
    ("Menores de edad", "Menores", 0, 17),
    ("De 18 a 25 años", "18-25", 18, 25),
    ("De 26 a 40 años", "26-40", 26, 40),
    ("De 41 a 50 años", "41-50", 41, 50),
    ("De 51 a 65 años", "51-65", 51, 65),
    ("Mayores de 65 años", "Más de 65", 66, 200),
]


def palabras(nombre: str) -> frozenset:
    """'Balears (Illes)', 'Balears, Illes' e 'Illes Balears' → mismas palabras. Con '/', vale cualquier parte."""
    import unicodedata
    n = unicodedata.normalize("NFD", nombre.lower())
    n = "".join(c for c in n if unicodedata.category(c) != "Mn")
    for c in "(),.-":
        n = n.replace(c, " ")
    return frozenset(n.split())


def mismo_territorio(a: str, b: str) -> bool:
    pa = [palabras(x) for x in a.split("/")]
    pb = [palabras(x) for x in b.split("/")]
    return any(x == y for x in pa for y in pb)


def preparar() -> None:
    # 1. Serie nacional por grupo penal.
    filas = leer_csv(descargar("conocidos"))
    nac = {(f["Grupo penal"], int(f["periodo"])): numero(f["Total"]) for f in filas if f["Comunidades autónomas"] == NAC}
    serie = []
    for a in ANIOS:
        d = {"anio": a, "total": nac[(TOTAL, a)]}
        d["grupos"] = {GRUPOS[g]: nac.get((g, a)) for g in GRUPOS}
        serie.append(d)
    suma = sum(v or 0 for v in serie[-1]["grupos"].values())
    assert abs(suma - serie[-1]["total"]) <= 1, f"los grupos no suman el total ({suma} frente a {serie[-1]['total']})"
    escribir("serie", serie, "conocidos")

    # 2. Esclarecidos.
    filas = leer_csv(descargar("esclarecidos"))
    esc = {(f["Grupo penal"], int(f["periodo"])): numero(f["Total"]) for f in filas if f["Comunidades autónomas"] == NAC}
    escribir("esclarecidos", [{"anio": a, "conocidos": nac[(TOTAL, a)], "esclarecidos": esc[(TOTAL, a)]} for a in ANIOS], "conocidos", "esclarecidos")

    # 3. Víctimas por edad, con población del INE (edad simple, 1-1-2025).
    pob_edad = {}
    for s in json.loads(descargar("pob_edad")):
        p = [x.strip() for x in s["Nombre"].split(".")]
        # Ojo: el INE incluye el agregado «85 y más años» además de cada edad: se salta para no contar dos veces.
        if p[0] == "Total Nacional" and p[2] == "Total" and p[1] != "Todas las edades" and p[1] != "85 y más años":
            e = int(p[1].split()[0])
            pob_edad[e] = s["Data"][0]["Valor"]
        if p[0] == "Total Nacional" and p[2] == "Total" and p[1] == "Todas las edades":
            todas = s["Data"][0]["Valor"]
    assert abs(sum(pob_edad.values()) - todas) < 1, "la suma por edades no cuadra con «Todas las edades»"
    filas = leer_csv(descargar("victimas"))
    vic = {(f["Grupo edad"], int(f["periodo"])): numero(f["Total"]) for f in filas
           if f["Comunidades autónomas"] == NAC and f["Grupo penal"] == TOTAL and f["Sexo"] == "Total sexos"}
    edades = []
    for g, etiqueta, a, b in EDADES:
        pob = sum(v for e, v in pob_edad.items() if a <= e <= b)
        edades.append({"grupo": etiqueta, "victimas2015": vic[(g, 2015)], "victimas": vic[(g, 2025)], "poblacion": round(pob),
                       "tasa": round(vic[(g, 2025)] / pob * 1000, 2)})
    escribir("edades", edades, "victimas", "pob_edad")

    # 4. Provincias: hechos 2025 / población 1-1-2025, con el código del mapa (es-atlas, IGN).
    atlas = json.loads((RAIZ / "node_modules/es-atlas/es/provinces.json").read_text(encoding="utf-8"))
    geos = [(g["id"], g["properties"]["name"]) for g in atlas["objects"]["provinces"]["geometries"]]
    pob = {}
    for s in json.loads(descargar("pob_prov")):
        p = [x.strip() for x in s["Nombre"].split(".")]
        if "Total" in p and "Total Nacional" not in p:
            nombre = next(x for x in p if x not in ("Total", "Todas las edades", "Población", "Número", ""))
            pob[nombre] = s["Data"][0]["Valor"]
    filas = leer_csv(descargar("provincias"))
    provincias = []
    for f in filas:
        if f["Grupo penal"] != TOTAL or f["periodo"] != "2025" or f["Provincias"] in ("Total Nacional", "En el extranjero", "Desconocida"):
            continue
        nombre = f["Provincias"]
        geo = [g for g in geos if mismo_territorio(nombre, g[1])]
        po = [v for k, v in pob.items() if mismo_territorio(nombre, k)]
        assert len(geo) == 1 and len(po) == 1, f"{nombre}: mapa {geo}, población {len(po)}"
        hechos = numero(f["Total"])
        provincias.append({"id": geo[0][0], "nombre": geo[0][1], "hechos": hechos, "poblacion": round(po[0]), "tasa": round(hechos / po[0] * 1000, 2)})
    assert len(provincias) == 52, len(provincias)
    escribir("provincias", sorted(provincias, key=lambda d: -d["tasa"]), "provincias", "pob_prov")

    # 5. Fecha de actualización de la tabla del Ministerio.
    px = descargar("px")
    fecha = px.split('CREATION-DATE="')[1][:8]
    escribir("meta", {"actualizado": f"{fecha[:4]}-{fecha[4:6]}-{fecha[6:]}", "poblacionTotal": round(sum(pob.values()))}, "px", "pob_prov")

    # 6. Lista de fuentes para el pie (sin los metadatos).
    escribir("fuentes", [{"fuente": f["fuente"], "url": f["url"], "licencia": f["licencia"]} for k, f in FUENTES.items() if k != "px"], *[k for k in FUENTES if k != "px"])


if __name__ == "__main__":
    preparar()
    if _procedencia:
        (SALIDA / "procedencia.json").write_text(json.dumps(_procedencia, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        for n, p in _procedencia.items():
            print(f"{n}.json  ←  {p['fuente']}")
