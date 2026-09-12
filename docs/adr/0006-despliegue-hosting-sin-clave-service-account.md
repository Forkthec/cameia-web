# 0006 · Despliegue a Firebase Hosting sin clave de service account (WIF + API REST)

- **Estado:** Aceptada
- **Fecha:** 12-sep-2026
- **Decide:** DevOps
- **Ticket:** CM-146 / CM-147

## Contexto

El proyecto Firebase/GCP de `cameia-web` cambió de `cameia-app` (Billing sin resolver, ver
`comunicaciones/11092026_interno_bloqueos-sprint-72h.md`) a **`cameia-e245f`**, un proyecto nuevo
sin ninguna asociación con cuentas institucionales (decisión de Paula, 12-sep-2026, tras conseguir
el equipo una cuenta de Billing funcional).

El proyecto anterior desplegaba con una clave JSON de service account (`FIREBASE_SERVICE_ACCOUNT_CAMEIA`,
secret de GitHub). Eso ya no era la arquitectura que se quería —
`informacion/02092026_v3_reglas-devops.md` dice explícitamente "para GCP se prefiere OIDC/WIF; no
se suben llaves JSON", y el anexo técnico de atributos de calidad
(`informacion/historial/p2_entrega1/Anexo_Restricciones_Atributos_Calidad.pdf`, control **DPL-03**)
fija un límite duro: **cero credenciales persistentes de GCP en repositorio o CI**, verificado con
"OIDC/WIF, secret scanning y prueba negativa". El proyecto anterior nunca lo cumplió; era deuda
conocida, no una meta nueva.

El proyecto nuevo forzó la conversación: Google bloquea por defecto la creación de claves de
service account en proyectos creados después de cierta fecha
(`constraints/iam.disableServiceAccountKeyCreation`), así que ni siquiera se podía repetir el
mecanismo anterior sin revertir explícitamente esa protección.

## Decisión

El despliegue a Firebase Hosting se hace con un script propio
(`.github/scripts/desplegar-hosting.sh`) que llama directo a la **API REST v1beta1 de Firebase
Hosting** (crear versión → registrar archivos por hash SHA-256 del contenido gzip → subir los que
falten → finalizar la versión → publicar el release en `live` o en un canal). Se autentica con el
access token que entrega `gcloud auth print-access-token` después de iniciar sesión por
**Workload Identity Federation** (`google-github-actions/auth@v2` + `google-github-actions/setup-gcloud@v2`
en el workflow). Ningún paso del pipeline usa ni almacena una clave de service account.

## Alternativas descartadas

**`FirebaseExtended/action-hosting-deploy@v0` con WIF.** Probada en vivo en el PR #28 (run
`34716860424`): falla con `Error: Input required and not supplied: firebaseServiceAccount`, aunque
el paso de WIF ya haya dejado credenciales ADC listas en el entorno (`GOOGLE_APPLICATION_CREDENTIALS`
apuntando a un archivo válido). La acción exige ese input explícito sin excepción — no tiene
fallback a credenciales por defecto de la aplicación (ADC).

**CLI de `firebase-tools` directo, apoyada en las mismas credenciales ADC de WIF.** Probada en vivo
(run `34717002781`): falla con `Failed to authenticate, have you run firebase login?`. Se confirmó
además localmente, fuera de CI: un access token real de `gcloud` pasado con el flag `--token`
(mecanismo ya deprecado de la propia CLI) tampoco es aceptado para comandos de Hosting — el mensaje
de error de la CLI dice textualmente que hay que usar una clave real de service account vía
`GOOGLE_APPLICATION_CREDENTIALS`, no una credencial externa/WIF. Conclusión: la CLI de Firebase no
tiene hoy un camino soportado para desplegar Hosting sin clave.

**Revertir `constraints/iam.disableServiceAccountKeyCreation` en `cameia-e245f` y volver a una
clave JSON**, igual que en `cameia-app`. Habría sido la opción más rápida — de hecho el modo
automático de Claude Code bloqueó el intento de desactivar la política por clasificarlo como
"debilitar seguridad", y la sesión se detuvo a pedir confirmación en vez de ejecutarlo. Se descartó
explícitamente porque contradice el límite duro de DPL-03, no por falta de tiempo: el equipo decidió
invertir el tiempo en la alternativa correcta en vez de repetir la deuda del proyecto anterior.

## Consecuencias

- `.github/scripts/desplegar-hosting.sh` (bash + `curl` + `jq`) es ahora la única forma soportada
  de desplegar Hosting en este repo. Se probó localmente contra el proyecto real antes de tocar
  CI — versión creada, archivos subidos por hash, versión finalizada, release publicado en un canal
  de prueba, contenido verificado con `curl`, canal borrado después — y también el caso de
  redeploy sin cambios de contenido (los hashes ya conocidos no se vuelven a subir).
- Hicieron falta dos permisos de GCP que no eran obvios de antemano y que cualquier proyecto nuevo
  con este mismo patrón va a necesitar: habilitar `iamcredentials.googleapis.com` (sin ella, WIF no
  puede suplantar la service account — error `SERVICE_DISABLED`) y otorgarle
  `roles/serviceusage.serviceUsageConsumer` a la service account de deploy (sin él, las llamadas a
  la API fallan con `PERMISSION_DENIED` / `USER_PROJECT_DENIED` al usar el proyecto como "quota
  project").
- **Se perdió el comentario automático en el PR con el enlace de vista previa** (lo generaba la
  acción oficial de Firebase). Queda pendiente como mejora aparte — el enlace sigue visible en el
  log del job de GitHub Actions mientras tanto. No bloquea el despliegue.
- El pool y el proveedor de identidad de GitHub Actions (`github-pool` / `github-provider` en
  `cameia-e245f`) se crearon a mano con `gcloud`, no con Terraform. Pendiente de formalizar si el
  proyecto adopta Terraform para esta infraestructura (ver control **DPL-01** del mismo anexo de
  atributos de calidad: "100 % de recursos gestionados en Terraform").
- Cualquier otro servicio que despliegue a este mismo proyecto sin clave puede reutilizar el mismo
  patrón (WIF + llamada directa a la API REST) en vez de asumir que la acción oficial de Firebase
  funciona sin ella.
