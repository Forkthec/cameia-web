# i18n

Tres reglas, sin excepciones:

1. **Ningún texto visible se escribe en un componente.** Todo string que ve un humano pasa
   por `t('namespace:llave')` — incluidos placeholders, `aria-label` y mensajes de error.
2. **Los catálogos guardan códigos, no etiquetas.** La etiqueta visible sale de i18n
   (`t('interview:tono.ESTRICTO')`), nunca se hardcodea el nombre legible en el catálogo.
3. **El idioma de la interfaz y `sesion_entrevista.idioma` son cosas distintas y no se
   acoplan.** Uno es preferencia de UI (este módulo); el otro es un dato de negocio del
   entrevistador IA en formato BCP-47. Uno puede sugerirse como valor por defecto del otro,
   nada más.

## Estructura

```
i18n/
├── config.ts             opciones de i18next (idiomas, namespaces, detección)
├── index.ts               inicializa i18next y expone la instancia configurada
└── locales/
    ├── es-CO/              idioma fuente de la copia
    │   ├── common.json      acciones, estados y navegación transversales
    │   ├── auth.json         PRT-01.01 (registro), PRT-01.03 (ingreso) y menú de usuario
    │   ├── profile.json      perfil profesional
    │   ├── interview.json    catálogos de configuración de entrevista
    │   ├── landing.json      landing pública (PRT-00.01)
    │   └── errors.json       mensajes genéricos de interfaz y llaves por tipo de fallo
    └── en/                 mismos 6 namespaces y mismas llaves que es-CO
```

`en` tiene recursos propios desde CM-186: cuando el idioma activo es inglés, i18next usa
`locales/en/` directamente. Es una traducción de trabajo, sin revisión editorial cerrada: se ajusta
llave por llave (CLAUDE.md §7). `fallbackLng: 'es-CO'` sigue activo, pero para lo que de verdad
cubre: una llave puntual que todavía no se tradujo (por ejemplo, la de una feature nueva escrita
solo en español), no el idioma completo. Al agregar una llave a `es-CO`, agrégala también a `en`.

`errors.json` **no** contiene códigos de error del backend: el backend no envía ningún código
propio (`ProblemDetail`, ADR-0007), así que el frontend discrimina por `httpStatus` y
`errors[].field` y cada feature guarda sus mensajes en su propio namespace. Sus llaves `codigos.*`
son `AUTH_*` (códigos de Firebase mapeados en `auth.service.ts`) y `NOT_FOUND`, más `generico` y
`red`.
