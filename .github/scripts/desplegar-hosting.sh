#!/usr/bin/env bash
# Publica cameia-web en Firebase Hosting sin usar ninguna contraseña/llave
# guardada de forma permanente. En vez de eso, usa una credencial temporal
# que Google genera sola en cada ejecución (Workload Identity Federation) y
# le pide el trabajo directamente al servicio de Firebase por su API web.
# Se armó porque ni la herramienta oficial de Firebase para GitHub Actions
# ni su programa de línea de comandos aceptan esa credencial temporal para
# Hosting -- se probó con las dos y ambas fallaron (evidencia en el PR #28 y
# en docs/adr/, si se vuelve a documentar). Cumple el control DPL-03 del
# anexo de atributos de calidad: cero credenciales persistentes de Google
# Cloud guardadas en el repositorio o en la automatización de CI.
#
# Uso: desplegar-hosting.sh <project_id> <dist_dir> <live|channel> [channel_id] [ttl_segundos]
set -euo pipefail

PROJECT_ID="$1"
DIST_DIR="$2"
MODE="$3" # "live" publica en producción; "channel" publica en un enlace temporal (staging o vista previa de un PR)
CHANNEL_ID="${4:-}"
TTL_SECONDS="${5:-604800}" # cuánto dura el enlace temporal antes de borrarse solo; 7 días por defecto

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: no existe el directorio de build '$DIST_DIR'" >&2
  exit 1
fi

# Credencial de un solo uso: la deja lista el paso "Autenticar en GCP (WIF)"
# del workflow, justo antes de llamar a este script. No se guarda en ningún
# lado ni se reutiliza después de esta ejecución.
TOKEN="$(gcloud auth print-access-token)"
API="https://firebasehosting.googleapis.com/v1beta1"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

# Envoltorio para hablar con la API de Firebase Hosting: agrega las
# credenciales a cada pedido y, si Google responde con un error, corta la
# publicación ahí mismo mostrando el motivo real (en vez de seguir como si
# nada y publicar algo a medias).
auth_curl() {
  local response status body
  response="$(curl -sS -w $'\n%{http_code}' \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "X-Goog-User-Project: ${PROJECT_ID}" \
    "$@")"
  status="${response##*$'\n'}"
  body="${response%$'\n'*}"
  if [ "$status" -ge 400 ]; then
    echo "Error HTTP ${status} llamando a la API de Firebase Hosting:" >&2
    echo "$body" >&2
    return 1
  fi
  echo "$body"
}

# Paso 1 de 5: abrir una "versión" nueva. Es como un borrador del sitio:
# todavía no lo ve nadie hasta que se publique al final (paso 5).
#
# firebase.json declara sus reglas de hosting con "source"/"destination", pero
# la API de Hosting espera "glob"/"path" en Version.config.rewrites -- son dos
# vocabularios distintos para lo mismo. La CLI oficial de Firebase hace esta
# traducción sola; como aquí no se puede usar la CLI (ver cabecera del
# archivo), hay que hacerla a mano. Sin esto, un archivo como firebase.json
# con la regla de SPA (todo -> /index.html) queda escrito pero nunca se
# aplica: cualquier ruta que el servidor no reconozca como archivo real
# (ej. una ruta de React Router) recibe la página 404 propia de Firebase
# Hosting en vez de servir la aplicación.
echo "==> Creando version nueva en sites/${PROJECT_ID}"
REWRITES_JSON="$(jq -c '[(.hosting.rewrites // [])[] | {glob: .source, path: .destination}]' firebase.json)"
VERSION_CONFIG="$(jq -cn --argjson rewrites "$REWRITES_JSON" '{config: {rewrites: $rewrites}}')"
VERSION_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
  "${API}/sites/${PROJECT_ID}/versions" -d "$VERSION_CONFIG")"
VERSION_NAME="$(echo "$VERSION_JSON" | jq -r '.name')"
echo "    ${VERSION_NAME}"

# Paso 2 de 5: calcular una huella digital (hash) de cada archivo del build,
# ya comprimido. Firebase usa esa huella para saber cuáles archivos ya tiene
# de una publicación anterior y cuáles son nuevos o cambiaron -- así no hay
# que volver a subir un archivo que no se tocó.
echo "==> Empaquetando archivos de ${DIST_DIR}"
HASHES_FILE="${WORKDIR}/hashes.tsv"
: > "$HASHES_FILE"
while IFS= read -r -d '' file; do
  rel="/${file#"$DIST_DIR"/}"
  gz="${WORKDIR}/gz$(echo -n "$rel" | sha256sum | cut -d' ' -f1)"
  gzip -c -9 "$file" > "$gz"
  hash="$(sha256sum "$gz" | cut -d' ' -f1)"
  printf '%s\t%s\t%s\n' "$rel" "$hash" "$gz" >> "$HASHES_FILE"
done < <(find "$DIST_DIR" -type f -print0)

FILE_COUNT="$(wc -l < "$HASHES_FILE" | tr -d ' ')"
echo "    ${FILE_COUNT} archivo(s)"

# Convertir la lista de archivos+huellas a un objeto JSON, formato que pide
# la API en el siguiente paso.
FILES_FILTER="${WORKDIR}/files.jq"
printf 'split("\\n") | map(select(length > 0) | split("\\t")) | map({(.[0]): .[1]}) | add\n' > "$FILES_FILTER"
FILES_JSON="$(cut -f1,2 "$HASHES_FILE" | jq -R -s -f "$FILES_FILTER")"

# Paso 3 de 5: avisarle a Firebase qué archivos tiene esta versión. Firebase
# contesta con la lista de huellas que todavía no conoce -- esas son las
# únicas que hace falta subir de verdad en el paso siguiente.
echo "==> Registrando archivos en la version"
POPULATE_BODY="${WORKDIR}/populate.json"
printf '{"files": %s}' "$FILES_JSON" > "$POPULATE_BODY"
POPULATE_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
  "${API}/${VERSION_NAME}:populateFiles" \
  -d "@${POPULATE_BODY}")"

UPLOAD_URL="$(echo "$POPULATE_JSON" | jq -r '.uploadUrl // empty')"
REQUIRED_HASHES="$(echo "$POPULATE_JSON" | jq -r '.uploadRequiredHashes[]? ')"

# Paso 4 de 5: subir solo los archivos que Firebase pidió en el paso
# anterior. Si nada cambió desde la última publicación, esta lista viene
# vacía y no se sube nada -- ahorra tiempo y datos.
if [ -n "$REQUIRED_HASHES" ]; then
  echo "==> Subiendo archivos pendientes"
  while IFS= read -r hash; do
    hash="${hash%$'\r'}" # tolerar CRLF si el interprete de jq lo introduce
    [ -z "$hash" ] && continue
    gzpath="$(awk -F'\t' -v h="$hash" '$2 == h {print $3}' "$HASHES_FILE")"
    if [ -z "$gzpath" ]; then
      echo "Error: no se encontro el archivo local para el hash ${hash}" >&2
      exit 1
    fi
    auth_curl -X POST -H "Content-Type: application/octet-stream" \
      --data-binary "@${gzpath}" \
      "${UPLOAD_URL}/${hash}" > /dev/null
  done <<< "$REQUIRED_HASHES"
else
  echo "==> Sin archivos nuevos que subir (hashes ya conocidos)"
fi

# Cerrar el "borrador": a partir de aquí la versión ya no admite más
# archivos y queda lista para publicarse.
echo "==> Finalizando version"
auth_curl -X PATCH -H "Content-Type: application/json" \
  "${API}/${VERSION_NAME}?update_mask=status" \
  -d '{"status": "FINALIZED"}' > /dev/null

# Paso 5 de 5: publicar. "live" reemplaza lo que ve cualquier visitante en
# producción; "channel" crea o actualiza un enlace aparte (staging, o la
# vista previa de un Pull Request) sin tocar producción para nada.
if [ "$MODE" = "live" ]; then
  echo "==> Publicando release en produccion (live)"
  RELEASE_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/releases?versionName=${VERSION_NAME}" -d '{}')"
  echo "https://${PROJECT_ID}.web.app"
else
  if [ -z "$CHANNEL_ID" ]; then
    echo "Error: falta channel_id para modo 'channel'" >&2
    exit 1
  fi
  # Crear el enlace temporal si es la primera vez (si ya existe, la API
  # devuelve un error que se ignora a propósito con "|| true") y renovar
  # cuánto le queda de vida en cualquier caso, para que un canal que se usa
  # seguido (como "staging") nunca llegue a expirar solo.
  echo "==> Asegurando canal '${CHANNEL_ID}' (ttl ${TTL_SECONDS}s)"
  auth_curl -X POST -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels?channelId=${CHANNEL_ID}" \
    -d "{\"ttl\": \"${TTL_SECONDS}s\"}" > /dev/null 2>&1 || true
  auth_curl -X PATCH -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}?update_mask=ttl" \
    -d "{\"ttl\": \"${TTL_SECONDS}s\"}" > /dev/null

  echo "==> Publicando release en canal '${CHANNEL_ID}'"
  RELEASE_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}/releases?versionName=${VERSION_NAME}" -d '{}')"
  CHANNEL_JSON="$(auth_curl "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}")"
  echo "$CHANNEL_JSON" | jq -r '.url'
fi
