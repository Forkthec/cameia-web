# hooks/

Hooks de la feature (`docs/ARCHITECTURE.md` §3). No es una sola pieza: `CLAUDE.md` §8 separa dos
familias que se llenan en momentos distintos.

- **Hooks de interfaz** — estado del asistente, apertura de un panel, permiso del micrófono.
  Ejemplo planeado (`docs/ARCHITECTURE.md` §3, línea 170; HE-04, Sprint 1): `useMicrophonePermission`
  en `interview-setup` — no existe todavía en disco. Verificado contra `interview-setup` con
  `find` el 11-sep-2026. Se escriben en el **paso 3**, junto con los `organisms/` que los
  necesitan.
- **Hooks de datos** — los que envuelven `useQuery`/`useMutation`. Ejemplo planeado
  (`docs/ARCHITECTURE.md` §3, línea 169; HE-04, Sprint 1): `useConfigCatalog`,
  `useAvailableProfiles`, `useInitSession` en `interview-setup` — no existen todavía en disco.
  Verificado contra `interview-setup` con `find` el 11-sep-2026. Se escriben al **final, en el
  paso 5**, junto con `api/`, porque dependen del contrato real.
