#!/usr/bin/env bash
# Despliega a Firebase Hosting contra la API REST v1beta1, sin CLI de Firebase
# y sin clave de service account -- usa el access token que ya dejó
# `gcloud auth print-access-token` tras autenticar por Workload Identity
# Federation (ver .github/workflows/despliegue-continuo.yml). Reemplaza a
# FirebaseExtended/action-hosting-deploy@v0 (exige firebaseServiceAccount sin
# excepcion) y a la CLI de firebase-tools (no acepta credenciales externas de
# WIF para Hosting) -- ambas probadas y descartadas en el PR #28 de
# cameia-web. Cumple DPL-03 del anexo de atributos de calidad (cero
# credenciales persistentes de GCP en repositorio o CI).
#
# Uso: desplegar-hosting.sh <project_id> <dist_dir> <live|channel> [channel_id] [ttl_segundos]
set -euo pipefail

PROJECT_ID="$1"
DIST_DIR="$2"
MODE="$3" # "live" o "channel"
CHANNEL_ID="${4:-}"
TTL_SECONDS="${5:-604800}" # 7 dias por defecto

if [ ! -d "$DIST_DIR" ]; then
  echo "Error: no existe el directorio de build '$DIST_DIR'" >&2
  exit 1
fi

TOKEN="$(gcloud auth print-access-token)"
API="https://firebasehosting.googleapis.com/v1beta1"
WORKDIR="$(mktemp -d)"
trap 'rm -rf "$WORKDIR"' EXIT

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
    exit 1
  fi
  echo "$body"
}

echo "==> Creando version nueva en sites/${PROJECT_ID}"
VERSION_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
  "${API}/sites/${PROJECT_ID}/versions" -d '{}')"
VERSION_NAME="$(echo "$VERSION_JSON" | jq -r '.name')"
echo "    ${VERSION_NAME}"

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

FILES_FILTER="${WORKDIR}/files.jq"
printf 'split("\\n") | map(select(length > 0) | split("\\t")) | map({(.[0]): .[1]}) | add\n' > "$FILES_FILTER"
FILES_JSON="$(cut -f1,2 "$HASHES_FILE" | jq -R -s -f "$FILES_FILTER")"

echo "==> Registrando archivos en la version"
POPULATE_BODY="${WORKDIR}/populate.json"
printf '{"files": %s}' "$FILES_JSON" > "$POPULATE_BODY"
POPULATE_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
  "${API}/${VERSION_NAME}:populateFiles" \
  -d "@${POPULATE_BODY}")"

UPLOAD_URL="$(echo "$POPULATE_JSON" | jq -r '.uploadUrl // empty')"
REQUIRED_HASHES="$(echo "$POPULATE_JSON" | jq -r '.uploadRequiredHashes[]? ')"

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

echo "==> Finalizando version"
auth_curl -X PATCH -H "Content-Type: application/json" \
  "${API}/${VERSION_NAME}?update_mask=status" \
  -d '{"status": "FINALIZED"}' > /dev/null

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
  echo "==> Asegurando canal '${CHANNEL_ID}' (ttl ${TTL_SECONDS}s)"
  auth_curl -X POST -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels?channelId=${CHANNEL_ID}" \
    -d "{\"ttl\": \"${TTL_SECONDS}s\"}" > /dev/null 2>&1 || true
  # Si el canal ya existia, renovar su ttl explicitamente.
  auth_curl -X PATCH -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}?update_mask=ttl" \
    -d "{\"ttl\": \"${TTL_SECONDS}s\"}" > /dev/null

  echo "==> Publicando release en canal '${CHANNEL_ID}'"
  RELEASE_JSON="$(auth_curl -X POST -H "Content-Type: application/json" \
    "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}/releases?versionName=${VERSION_NAME}" -d '{}')"
  CHANNEL_JSON="$(auth_curl "${API}/sites/${PROJECT_ID}/channels/${CHANNEL_ID}")"
  echo "$CHANNEL_JSON" | jq -r '.url'
fi
