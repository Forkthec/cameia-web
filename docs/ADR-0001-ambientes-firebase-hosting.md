# ADR-0001 — Ambientes de Firebase Hosting comparten proyecto y credenciales

- **Estado:** Aceptado
- **Fecha:** 11-sep-2026
- **Decide:** Paula Andrea Muñoz Delgado (DevOps/Tester)
- **Relacionado:** CM-136 · `prompts/salidas/11092026_v2_plan-devops-72h.md` sección A y 1.3.1

## Contexto

`informacion/historial/p2_entrega1/Anexo_Despliegue.pdf` (p. 21, aprobado en Entrega 1) exige
proyectos separados para staging y producción, sin compartir datos, identidades, secretos ni
broker entre ambientes.

La versión inicial del despliegue continuo de `cameia-web` (Bloque 6 del plan de 72h) desplegaba a
producción en cada push a `develop`, sin distinguir ambientes. Al corregirlo contra la
documentación aprobada (`informacion/30082026_v1_guia-implementacion-sprint-devops-cameia.md`
§2.5/§2.8/§2.10 y `informacion/06092026_v1_procedimiento-despliegue-frontend-firebase-hosting.md`),
el diseño correcto exige dos ambientes reales: staging (automático desde `develop`) y producción
(promoción manual desde `main`).

Hoy existe **un único proyecto de Firebase Hosting**: `cameia-app`, creado el 11-sep-2026 para
reemplazar al proyecto original `cameia`, que quedó huérfano sin dueño IAM. Crear un segundo
proyecto solo para staging repetiría todo el aprovisionamiento (cuenta de servicio, secreto de
GitHub, registro de app web, variables por ambiente) dentro de la ventana de 72 horas que también
cubre CI, calidad, seguridad y el resto del despliegue.

## Decisión

Los dos ambientes viven en el **mismo proyecto de Firebase** (`cameia-app`), como dos canales de
Hosting distintos:

| Ambiente           | Canal de Firebase Hosting      | URL                                          | Se actualiza con                                            |
| ------------------ | ------------------------------ | -------------------------------------------- | ----------------------------------------------------------- |
| Staging            | `staging` (persistente)        | `https://cameia-app--staging-<hash>.web.app` | Push a `develop` (automático)                               |
| Producción         | `live`                         | `https://cameia-app.web.app`                 | Push a `main`, solo por promoción `develop → main` revisada |
| Vista previa de PR | `pr<n>-...` (expira en 7 días) | generada por la acción                       | Pull Request hacia `develop`                                |

Ambos ambientes comparten: el proyecto de Firebase, la cuenta de servicio de despliegue
(`github-actions-deploy@cameia-app.iam.gserviceaccount.com`, rol único "Firebase Hosting Admin") y
el secreto de GitHub `FIREBASE_SERVICE_ACCOUNT_CAMEIA`.

Las credenciales de Firebase Authentication (`VITE_FIREBASE_*`) también son las mismas en ambos
ambientes — no hay, hoy, un proyecto de Authentication separado por ambiente.

## Consecuencias

- **Desviación explícita del Anexo_Despliegue p. 21.** No se cumple "producción no comparte datos,
  identidades, secretos ni broker con staging" en el frontend. Sí se cumple para el backend: el
  Bloque 7 del plan mantiene Cloud Run/Cloud SQL sin aprovisionar todavía, así que esa parte no
  tiene el problema (y cuando se aprovisione, puede diseñarse con proyectos separados sin heredar
  esta decisión).
- **Riesgo aceptado:** un usuario autenticado contra Firebase Authentication en staging existe en la
  misma base de usuarios que producción. Mientras el backend (fuente real de datos de negocio) no
  esté desplegado, el impacto práctico es bajo — no hay datos de producto que mezclar, solo
  identidades de Authentication.
- **Rol mínimo ya mitiga el mayor riesgo:** la cuenta de servicio compartida solo tiene permiso de
  Firebase Hosting Admin, no acceso a Authentication, Firestore ni ningún otro producto.
- **Condición de salida:** si el proyecto llega a producción real con datos de usuarios reales antes
  de separar los proyectos, este ADR debe revisarse — no es una aceptación permanente, es una
  decisión acotada al plazo de esta entrega.

## Alternativas consideradas

1. **Dos proyectos de Firebase separados** (uno por ambiente). Cumple el Anexo al pie de la letra y
   sigue siendo gratis en plan Spark. Se descartó por el costo de tiempo dentro de la ventana de 72
   horas: duplicar cuenta de servicio, secreto, registro de app web y variables, cuando el billing
   de GCP —el bloqueo real de la entrega— seguía sin resolver.
2. **No tener staging, solo producción y vistas previas de PR.** Cumple el Anexo trivialmente (nada
   que compartir), pero contradice la guía del sprint §2.10, que exige despliegue automático
   `develop → staging` como obligatorio.
