# 0004 · El perfil activo es una selección efímera del cliente

- **Estado:** Aceptada, con revisión pendiente
- **Fecha:** 06-sep-2026
- **Decide:** Frontend
- **Ticket:** CM-100

## Contexto

Casi todos los módulos del producto operan sobre un Perfil Profesional concreto: configurar una
entrevista, ver el progreso, generar un reporte. Un usuario del plan gratuito tiene uno solo, pero el
plan premium admite hasta cinco. Había que decidir dónde vive el dato de «sobre cuál estoy
trabajando».

## Decisión

El perfil activo es una selección del cliente, no un dato de negocio. El último `profileId` usado se
guarda en `stores/uiPreferences.store.ts` como conveniencia, y no se sincroniza con el servidor
durante el Sprint 1.

## Alternativas descartadas

**Guardarlo en el servidor desde el principio.** No existe endpoint para hacerlo en el alcance del
Sprint 1, y añadiría una ida y vuelta a la red en cada arranque de la aplicación para recuperar un
dato que, con un solo perfil en el plan gratuito, es deducible.

**Guardarlo en TanStack Query.** Viola la regla dura 6: Query es para datos del servidor, y esto no
lo es. Meterlo ahí confundiría la caché de una respuesta HTTP con una preferencia local.

**Ponerlo en la URL.** Obligaría a que casi todas las rutas lleven un identificador, complicando el
catálogo de rutas y los enlaces compartibles, a cambio de un beneficio que solo aparece cuando el
usuario tiene varios perfiles, es decir, fuera del alcance actual.

## Consecuencias

- La regla dura 9 de `CLAUDE.md` cubre exactamente este caso: el almacenamiento del navegador se usa
  para preferencias de interfaz y para el último `profileId`, nunca para datos sensibles.
- Si el usuario borra el almacenamiento del navegador, vuelve a elegir. No se pierde información.
- La selección no viaja entre dispositivos. Es aceptable mientras el plan gratuito permita un solo
  perfil.

## Revisión pendiente

La historia HU-2.12, planeada para el Sprint 3, introduce `POST /profiles/{id}/set-active` y
convierte la selección en un dato del servidor, con reglas propias de archivado y de cupo. Cuando esa
historia entre al sprint, esta decisión deja de ser válida y hay que escribir un ADR que la
sustituya. Esto no es un defecto de la decisión: es su fecha de caducidad conocida.
