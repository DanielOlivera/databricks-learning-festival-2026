"""Seguimiento del progreso del Databricks Learning Festival 2026.

Uso:
    python tools/track.py                 estado general + siguiente leccion pendiente
    python tools/track.py next            abre en el navegador la siguiente pendiente
    python tools/track.py open <id>       abre esa fila por id (ej. 2963-04)
    python tools/track.py done <id> [...] marca como completada (fecha de hoy)
    python tools/track.py done next       marca la siguiente pendiente y abre la que sigue
    python tools/track.py nota <id> <texto>
    python tools/track.py list [filtro]   lista filas, filtrando por texto

El archivo de datos es 01_plan/progreso.csv y esta en .gitignore: es tu avance
personal, no parte del repositorio.
"""

import csv
import subprocess
import sys
from datetime import date
from pathlib import Path

CSV = Path(__file__).resolve().parent.parent / "01_plan" / "progreso.csv"
CAMPOS = ["id", "ruta", "curso", "n", "leccion", "tipo", "url", "estado", "fecha", "notas"]
PENDIENTE, COMPLETADA = "pendiente", "completada"


def leer():
    with CSV.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def guardar(filas):
    with CSV.open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=CAMPOS)
        w.writeheader()
        w.writerows(filas)


def abrir(url):
    subprocess.run(["cmd", "/c", "start", "", url], check=False)


def buscar(filas, fid):
    for fila in filas:
        if fila["id"] == fid:
            return fila
    return None


def pendientes(filas):
    return [f for f in filas if f["estado"] != COMPLETADA]


def estado(filas):
    print(f"{'CURSO':<52} {'AVANCE':>10}  BARRA")
    cursos = {}
    for f in filas:
        c = cursos.setdefault((f["ruta"], f["curso"]), [0, 0])
        c[1] += 1
        if f["estado"] == COMPLETADA:
            c[0] += 1
    ruta_actual = None
    for (ruta, curso), (hechas, total) in cursos.items():
        if ruta != ruta_actual:
            print(f"\n== {ruta} ==")
            ruta_actual = ruta
        pct = hechas / total
        barra = "#" * round(pct * 20) + "." * (20 - round(pct * 20))
        print(f"{curso[:52]:<52} {hechas:>4}/{total:<4} [{barra}] {pct:>4.0%}")
    hechas = sum(1 for f in filas if f["estado"] == COMPLETADA)
    print(f"\nTotal: {hechas}/{len(filas)} ({hechas / len(filas):.0%})")
    p = pendientes(filas)
    if p:
        s = p[0]
        print(f"\nSiguiente: [{s['id']}] {s['leccion'] or s['curso']}")
        print(f"           {s['url']}")
        print("\nAbrela con: python tools/track.py next")
    else:
        print("\nTodo completado.")


def main():
    args = sys.argv[1:]
    filas = leer()

    if not args:
        estado(filas)
        return

    cmd = args[0]

    if cmd == "next":
        p = pendientes(filas)
        if not p:
            print("No queda nada pendiente.")
            return
        s = p[0]
        print(f"[{s['id']}] {s['leccion'] or s['curso']}\n{s['url']}")
        abrir(s["url"])

    elif cmd == "open":
        fila = buscar(filas, args[1])
        if not fila:
            sys.exit(f"No existe el id {args[1]}")
        print(fila["url"])
        abrir(fila["url"])

    elif cmd == "done":
        hoy = date.today().isoformat()
        if args[1:] == ["next"]:
            p = pendientes(filas)
            if not p:
                print("No queda nada pendiente.")
                return
            objetivo = [p[0]["id"]]
        else:
            objetivo = args[1:]
        for fid in objetivo:
            fila = buscar(filas, fid)
            if not fila:
                print(f"No existe el id {fid}")
                continue
            fila["estado"] = COMPLETADA
            fila["fecha"] = hoy
            print(f"OK [{fid}] {fila['leccion'] or fila['curso']}")
        guardar(filas)
        p = pendientes(filas)
        if p:
            print(f"\nSiguiente: [{p[0]['id']}] {p[0]['leccion'] or p[0]['curso']}\n{p[0]['url']}")

    elif cmd == "nota":
        fila = buscar(filas, args[1])
        if not fila:
            sys.exit(f"No existe el id {args[1]}")
        fila["notas"] = " ".join(args[2:])
        guardar(filas)
        print(f"Nota guardada en [{args[1]}]")

    elif cmd == "list":
        filtro = " ".join(args[1:]).lower()
        for f in filas:
            texto = f"{f['id']} {f['curso']} {f['leccion']}".lower()
            if filtro and filtro not in texto:
                continue
            marca = "x" if f["estado"] == COMPLETADA else " "
            print(f"[{marca}] {f['id']:<9} {(f['leccion'] or f['curso'])[:60]:<60} {f['fecha']}")

    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main()
