# Runbook — Rollback de Firebase Hosting (`cameia-web`)

Exigido por `informacion/02092026_v3_reglas-devops.md:86` ("Toda rebanada desplegada tiene un
digest anterior conocido y un runbook de rollback"), pendiente desde la primera versión del
Bloque 6 (ver `prompts/salidas/11092026_v2_plan-devops-72h.md` §1.1 fila 5).

## Cuándo usarlo

Un despliegue a `staging` (canal `staging`) o a `producción` (canal `live`) rompe algo visible y
hace falta volver a la versión anterior sin reconstruir.

## Procedimiento

Firebase Hosting no reconstruye en un rollback: **clona una versión ya servida** hacia el canal de
destino. Es el mismo mecanismo que describe
`informacion/06092026_v1_procedimiento-despliegue-frontend-firebase-hosting.md` §12.1.

1. Listar las versiones recientes del sitio, para identificar la versión buena anterior:

   ```
   firebase hosting:channel:list --project cameia-app
   ```

   (o, con más detalle de versiones, desde la consola: `console.firebase.google.com` → proyecto
   `cameia-app` → Hosting → "Historial de versiones" del sitio `cameia-app`.)

2. Clonar la versión anterior conocida hacia el canal afectado:

   ```
   # Producción
   firebase hosting:clone cameia-app:live@<version-anterior> cameia-app:live --project cameia-app

   # Staging
   firebase hosting:clone cameia-app:staging@<version-anterior> cameia-app:staging --project cameia-app
   ```

3. Verificar que el sitio vuelve a responder con el contenido esperado:

   ```
   curl -I https://cameia-app.web.app       # producción
   curl -I https://cameia-app--staging-<hash>.web.app   # staging
   ```

4. Registrar en Jira (comentario de evidencia, formato §4 de `CLAUDE.md`) qué versión se restauró,
   por qué, y el enlace del run o comando ejecutado.

## Qué NO hace falta

- No hay que revertir el commit en Git ni abrir un Pull Request de reversión: el rollback de
  Hosting es independiente del historial de `develop`/`main`. El código sigue como está; solo
  cambia qué versión sirve el canal.
- No hace falta detener el pipeline: el próximo push normal vuelve a desplegar la versión más
  reciente de la rama, así que un rollback es una medida temporal hasta corregir y volver a
  desplegar.

## Estado de verificación — 11-sep-2026

**Pendiente de ejecución real**, y se deja así explícitamente en vez de simularla: el canal `live`
tiene hoy una sola versión (la desplegada a mano el 11-sep, ver hallazgo en
`prompts/salidas/11092026_v2_plan-devops-72h.md` §2.4). No existe todavía una versión anterior
real a la cual volver, así que ejecutar el comando ahora solo clonaría la versión sobre sí misma —
no sería evidencia real de nada.

La primera ejecución verificable de este runbook queda pendiente de que existan al menos dos
despliegues reales del pipeline corregido (dos pushes a `develop` o a `main`). Cuando ocurra, este
runbook se actualiza con el enlace al comando ejecutado y su resultado, como exige `CLAUDE.md` §9.
