# 0001 · Atomic Design híbrido por contexto

- **Estado:** Aceptada
- **Fecha:** 04-sep-2026
- **Decide:** Frontend
- **Ticket:** CM-100

## Contexto

El producto tiene nueve épicas y alrededor de cuarenta historias de usuario, con una sola persona
en frontend durante el Sprint 1. Figma organiza el trabajo por componentes; el backlog lo organiza
por épicas; el diagrama C4 lo organiza por contextos de negocio. Había que elegir cómo se corta
`src/`, y esa elección es difícil de revertir una vez hay código.

## Decisión

Átomos y moléculas viven en un design system global sin dominio, en `design-system/`. Organismos y
páginas viven dentro de la feature que los usa, en `features/<nombre>/`. Las plantillas quedan
aparte, en `layouts/`, porque son pocas y transversales.

El corte por feature espeja los contextos del diagrama C4: Cuentas, Perfil Profesional, Entrevistas
y Auditoría. Un cambio de contrato en un microservicio toca una carpeta, no cinco.

## Alternativas descartadas

**Atomic Design puro** (`components/atoms|molecules|organisms|templates|pages`). Con nueve épicas y
cuarenta historias, la carpeta `organisms/` termina con más de cuarenta componentes sin ninguna
relación entre sí, y trabajar en una sola historia obliga a saltar entre cuatro directorios. El
patrón funciona en una biblioteca de componentes, no en una aplicación con dominio.

**Corte exclusivamente por feature, sin design system global.** Cada feature acabaría con su propio
botón y su propio campo de texto. Rompe la correspondencia uno a uno con las variantes de Figma, que
es lo que permite que un cambio de diseño sea un cambio de un archivo.

## Consecuencias

- **Exige una regla automatizada.** Sin `eslint-plugin-boundaries` verificando las capas en cada
  ejecución del linter, la estructura se degrada en dos semanas. Las reglas duras 4 y 5 de
  `CLAUDE.md` existen por esta decisión.
- **Reglas de crecimiento.** Un componente sube a `design-system/` cuando lo usa una segunda
  feature, no antes. Un hook sube a `hooks/` cuando lo usa un segundo consumidor fuera de su
  feature. Subir por anticipado produce abstracciones equivocadas.
- **Efecto que no se previó.** `eslint-plugin-boundaries` configurado con `default: 'disallow'`
  restringe **toda** capa declarada como origen, no solo las cinco que aparecen en la matriz de
  `docs/ARCHITECTURE.md` §4. Eso prohibió `hooks → config` y obligó a eliminar `useFeatureFlag`. La
  matriz documenta la intención; la regla efectiva es más estricta.
- **Coste conocido y abierto.** El catálogo de rutas vive en `app/router/routes.ts`, y `features/`
  no puede importar de `app/`. El resultado son literales de ruta duplicados en varios archivos,
  contra la intención declarada de que nadie escriba una ruta a mano. Es deuda reconocida, no un
  descuido; la verificación de `spec:check` sobre las rutas declaradas en cada `SPEC.md` es la
  mitigación prevista.
