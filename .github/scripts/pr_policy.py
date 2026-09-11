"""Valida que un Pull Request siga la plantilla de 8 campos del proyecto.

Qué hace: recibe los datos del PR (título, rama, cuerpo...) en un JSON y revisa que
cumplan el formato acordado — rama CM-numero-descripcion, título con Jira y tipo,
y los 8 campos obligatorios de la plantilla con contenido real, no placeholders.

Quién lo llama: el workflow .github/workflows/validar-plantilla-pr.yml, en cada PR.
Este script NO autoriza fusionar — solo revisa estructura, no si el cambio es bueno.

Cómo se lee el resultado: imprime un JSON con "result" (PASA_ESTRUCTURA / FALLA_ESTRUCTURA
/ BORRADOR) y la lista de "errors" encontrados, y termina con código 0/1/2 (ver main()).
"""

import argparse
import json
import re
from pathlib import Path
from urllib.parse import urlparse


TYPES = ("feat", "fix", "test", "docs", "refactor", "build", "ci", "chore")  # tipos de commit permitidos (Conventional Commits)
FIELDS = ("Jira", "Responsable", "Cambio", "Evidencia", "Impacto", "Riesgo", "IA", "Control humano")  # los 8 campos obligatorios de la plantilla
MODULES = {"contrato": "Contrato", "datos": "Datos", "permisos": "Permisos", "despliegue": "Despliegue"}  # campos extra que se exigen solo si "Impacto" los marca
TITLE = re.compile(r"(CM-[1-9][0-9]*) \| (" + "|".join(TYPES) + r")\(([a-z0-9]+(?:-[a-z0-9]+)*)\): (.+)")  # "CM-123 | feat(scope): resultado"
BRANCH = re.compile(r"(CM-[1-9][0-9]*)-[a-z0-9]+(?:-[a-z0-9]+)*")  # "CM-123-descripcion-en-kebab-case"
PLACEHOLDER = re.compile(r"<[^>]*>|\b(?:TODO|PEGAR_URL|CM-NNN)\b")  # marcadores de ejemplo que no se reemplazaron


def validate(payload):
    # Cada campo que se envía queda aquí, y la lista de errores se va llenando sin
    # detenerse en el primero — el PR ve todos los problemas de una vez, no uno por corrida.
    errors = []
    category = None
    scope = None
    issue_keys = []

    # Validación de forma del JSON de entrada antes de mirar contenido: si algo
    # básico falta, se corta aquí con un error claro en vez de fallar más adelante
    # con un traceback confuso.
    required = ("title", "head", "base", "body")
    if not isinstance(payload, dict) or any(not isinstance(payload.get(field), str) for field in required):
        return {"schema": 1, "result": "FALLA_ESTRUCTURA", "errors": ["entrada: faltan cadenas title/head/base/body"]}
    if any(type(payload.get(field)) is not bool for field in ("draft", "same_repository")):
        return {"schema": 1, "result": "FALLA_ESTRUCTURA", "errors": ["entrada: draft y same_repository deben ser booleanos"]}
    if len(payload["body"]) > 65536 or len(payload["title"]) > 512:
        return {"schema": 1, "result": "FALLA_ESTRUCTURA", "errors": ["entrada: longitud excedida"]}

    assisted = payload["title"].endswith(" [IA-ASISTIDO]")  # el título declara si hubo asistencia de IA
    title = payload["title"].removesuffix(" [IA-ASISTIDO]")
    promotion = payload["base"] == "main"  # un PR hacia main es una promoción develop→main, con reglas distintas

    if PLACEHOLDER.search(title):
        errors.append("titulo: reemplazar marcadores de ejemplo")

    if promotion:
        # Promoción develop → main: solo puede venir de develop, del mismo repo, y
        # el título sigue el formato fijo "release: promover VERSION de develop a main".
        if payload["head"] != "develop" or not payload["same_repository"]:
            errors.append("rama: main solo recibe develop del mismo repositorio")
        if not re.fullmatch(r"release: promover \S+ de develop a main", title):
            errors.append("titulo: se requiere release: promover VERSION de develop a main")
        category = "release"
    else:
        # PR ordinario hacia develop: la rama y el título deben traer la misma clave Jira.
        branch_match = BRANCH.fullmatch(payload["head"])
        title_match = TITLE.fullmatch(title)
        if payload["base"] != "develop" or not branch_match:
            errors.append("rama: se requiere CM-numero-descripcion hacia develop")
        if not title_match:
            errors.append("titulo: usar CM-NNN | tipo(scope): resultado; tipo permitido, no testing")
        else:
            issue_keys = [title_match[1]]
            category, scope = title_match[2], title_match[3]
            if not title_match[4].strip():
                errors.append("titulo: falta resultado")
            if branch_match and branch_match[1] != title_match[1]:
                errors.append("jira: clave de rama y titulo distinta")

    # Lee los 8 campos del cuerpo del PR. Cada campo es una línea "- Nombre: valor";
    # los comentarios HTML de la plantilla (<!-- ... -->) se descartan antes de buscar.
    body = re.sub(r"<!--.*?-->", "", payload["body"], flags=re.S)
    fields = {}
    for match in re.finditer(r"^- ([^:\n]+):[ \t]*(.*)$", body, re.M):
        label, value = match[1], match[2].strip()
        if label in fields:
            errors.append("campo duplicado: " + label)
        fields[label] = value

    # Los 8 campos son obligatorios siempre; "Promoción" se suma solo en un PR develop→main.
    for field in FIELDS + (("Promoción",) if promotion else ()):
        if not fields.get(field) or PLACEHOLDER.search(fields[field]):
            errors.append("campo incompleto: " + field)

    # El campo "Jira" debe traer un enlace real https://.../browse/CM-numero — el
    # script nunca consulta Jira de verdad, solo revisa que el enlace tenga esa forma.
    jira = fields.get("Jira", "")
    linked_keys = []
    for address in re.findall(r"https://[^\s<>\)]+", jira):
        parsed = urlparse(address)
        issue_match = re.fullmatch(r"/browse/(CM-[1-9][0-9]*)/?", parsed.path)
        if parsed.hostname and not parsed.username and not parsed.password and issue_match:
            linked_keys.append(issue_match[1])
    if not linked_keys or (issue_keys and issue_keys[0] not in linked_keys):
        errors.append("jira: falta enlace https /browse/CM-numero coherente; no se consulta Jira")
    if promotion:
        issue_keys = sorted(set(linked_keys))

    # "Responsable" debe traer "Nombre completo | rol" — no se verifica identidad real,
    # solo que el formato exista (evita dejarlo vacío o a medias).
    identity = fields.get("Responsable", "").split("|")
    if len(identity) != 2 or not all(part.strip() for part in identity):
        errors.append("responsable: usar nombre completo | rol; identidad no verificada")

    # "Evidencia" debe declarar un resultado real de entre estas cuatro palabras —
    # obliga a decir qué pasó, no a describir la evidencia sin concluir nada.
    if not re.search(r"\b(PASA|FALLA|BLOQUEADO|PENDIENTE)\b", fields.get("Evidencia", "")):
        errors.append("evidencia: declarar resultado, sin inventarlo")

    # "Impacto" es "ninguno" o una lista de módulos afectados; cada módulo marcado
    # exige además su propio campo (Contrato/Datos/Permisos/Despliegue) completo.
    impacts = [part.strip() for part in fields.get("Impacto", "").split(",")]
    if impacts != ["ninguno"]:
        if not impacts or any(impact not in MODULES for impact in impacts):
            errors.append("impacto: elegir ninguno o contrato, datos, permisos, despliegue")
        for impact in set(impacts) & MODULES.keys():
            field = MODULES[impact]
            if not fields.get(field) or PLACEHOLDER.search(fields[field]):
                errors.append("modulo requerido: " + field)

    if not re.fullmatch(r"(bajo|medio|alto) — \S.*", fields.get("Riesgo", "")):
        errors.append("riesgo: usar bajo/medio/alto — explicacion y recuperacion")

    # "IA" debe decir si/no y coincidir con el sufijo [IA-ASISTIDO] del título —
    # evita que el título diga una cosa y el campo declare otra.
    ai_match = re.fullmatch(r"(si|no) — \S.*", fields.get("IA", ""))
    if not ai_match:
        errors.append("ia: usar si/no — alcance y registro real")
    elif (ai_match[1] == "si") != assisted:
        errors.append("ia: titulo y declaracion deben coincidir con [IA-ASISTIDO]")

    # "Control humano": mientras el PR está en Draft puede decir "pendiente" (nadie
    # lo ha revisado todavía); para salir de Draft tiene que decir ya "revisado por
    # el autor — ...". Es la regla del 11-sep: nada pasa a listo sin revisión real.
    human_pattern = r"(pendiente|revisado por el autor) — \S.*" if payload["draft"] else r"revisado por el autor — \S.*"
    if not re.fullmatch(human_pattern, fields.get("Control humano", "")):
        errors.append("control humano: usar 'revisado por el autor — ...' antes de salir de Draft, o mantener 'pendiente' en Draft")

    return {
        "schema": 1,
        # "BORRADOR" si el PR sigue en Draft (aunque haya errores — hay que mirar
        # "errors" igual, no solo "result"; ver la nota en validar-plantilla-pr.yml).
        "result": "BORRADOR" if payload["draft"] else ("FALLA_ESTRUCTURA" if errors else "PASA_ESTRUCTURA"),
        "errors": errors,
        "type": category,
        "scope": scope,
        "issue_keys": issue_keys,
        "assisted": assisted,
        "draft": payload["draft"],
    }


def main():
    # Punto de entrada por línea de comandos: recibe la ruta a un archivo JSON con
    # los datos del PR (lo arma el workflow, paso "Preparar entrada").
    parser = argparse.ArgumentParser(description="Piloto CAMEIA: estructura local, no autorizacion de merge")
    parser.add_argument("input", type=Path)
    arguments = parser.parse_args()
    try:
        if arguments.input.stat().st_size > 131072:
            raise ValueError("entrada demasiado grande")
        report = validate(json.loads(arguments.input.read_text(encoding="utf-8")))
    except (OSError, ValueError, RecursionError):
        # Cualquier problema leyendo o parseando la entrada se trata como un PR
        # inválido, no como un error del script — nunca revienta con un traceback.
        report = {"schema": 1, "result": "FALLA_ESTRUCTURA", "errors": ["entrada: archivo JSON ausente, invalido o demasiado grande"]}
    print(json.dumps(report, ensure_ascii=True, sort_keys=True))
    # Código de salida: 0 = pasa, 2 = borrador (informativo), 1 = falla de verdad.
    # El workflow lo usa para decidir si el check queda verde, amarillo o rojo.
    return 0 if report["result"] == "PASA_ESTRUCTURA" else (2 if report["result"] == "BORRADOR" else 1)


if __name__ == "__main__":
    raise SystemExit(main())
