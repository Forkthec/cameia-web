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
    └── es-CO/              único idioma con recursos; fuente de verdad de la copia
        ├── common.json      acciones, estados y navegación transversales
        ├── auth.json         PRT-01.01 (registro) y PRT-01.03 (ingreso)
        ├── profile.json      perfil profesional
        ├── interview.json    catálogos de configuración de entrevista
        └── errors.json       mensajes de interfaz y códigos de error del backend
```

`en` sigue declarado en `SUPPORTED_LANGUAGES` (`config.ts`), pero no tiene bundle
propio: cuando el navegador pide inglés, i18next resuelve cada llave por
`fallbackLng: 'es-CO'`. No hay copia en inglés aprobada; el fallback es el
mecanismo real, no un parche temporal (CLAUDE.md §7).
