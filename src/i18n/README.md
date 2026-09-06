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
    ├── es-CO/              idioma completo, fuente de verdad de la copia
    │   ├── common.json      acciones, estados y navegación transversales
    │   ├── auth.json         PRT-01.01 (registro) y PRT-01.03 (ingreso)
    │   ├── profile.json      perfil profesional
    │   ├── interview.json    catálogos de configuración de entrevista
    │   └── errors.json       llaves por código de error del backend
    └── en/                 misma estructura de llaves que es-CO
```

`en/` no es una traducción: hoy tiene los mismos valores en español que
`es-CO`, con `"_status": "PENDIENTE: sin copia aprobada en inglés — Hueco 22"`
como primera llave de cada archivo. Es intencional (CLAUDE.md §7: "en" hereda
de "es-CO" mientras no haya copia aprobada), no un olvido — de ahí que quede
marcado en vez de dejarlo en silencio.
