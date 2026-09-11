# 0002 · TypeScript 6.0.3 y el resolver de fronteras

- **Estado:** Aceptada
- **Fecha:** 06-sep-2026
- **Decide:** Frontend
- **Ticket:** CM-100

## Contexto

El repositorio fija versiones exactas, sin rangos con `^`, para que dos instalaciones separadas por
un mes produzcan el mismo árbol. Eso obliga a resolver los conflictos de dependencias entre pares en
el momento de elegir la versión, y no cuando explotan.

Dos decisiones concretas quedaron abiertas al montar el andamiaje: qué versión de TypeScript usar, y
si instalar una dependencia que no estaba en la lista aprobada para que la regla de fronteras
funcionara de verdad.

## Decisión

Se fija **TypeScript 6.0.3** y no se sube a 7.x.

Se autoriza **`eslint-import-resolver-typescript@4.4.5`** como única excepción a la lista cerrada de
dependencias del proyecto.

## Alternativas descartadas

**TypeScript 7.x.** `typescript-eslint@8.69.0` declara como par `typescript: ">=4.8.4 <6.1.0"`.
Adoptar la 7 obliga a elegir entre quedarse sin reglas de lint con información de tipos o correr una
combinación que el propio plugin declara no soportada. Ninguna de las dos compensa estar en la
versión más nueva.

**No instalar el resolver.** `eslint-plugin-boundaries` solo resuelve imports relativos con el
resolver que trae empaquetado. Un import escrito con el alias `@/` lo interpreta como un paquete
externo no resuelto, y la regla de fronteras sencillamente no lo evalúa. Como el alias es la
convención principal de import del proyecto, sin este resolver la regla queda ciega justo donde más
falta hace. Se comprobó con `boundaries/debug` y con sondas reales antes de pedir autorización.

**Renunciar al alias `@/` y usar solo rutas relativas.** Haría innecesario el resolver, pero degrada
la legibilidad en un árbol de cinco niveles y contradice la configuración de `tsconfig`. Cambiar la
convención de todo el código para no instalar un paquete de desarrollo es un mal negocio.

## Consecuencias

- Antes de subir `typescript-eslint` hay que verificar el rango de pares que declara, no solo que la
  instalación no falle.
- La excepción queda documentada en `CLAUDE.md` §2 con su justificación completa. Una excepción sin
  justificación escrita se convierte en precedente para la siguiente.
- Cualquier dependencia nueva requiere permiso previo. La lista de prohibidas explícitas incluye
  axios, styled-components, Redux, Formik, moment, bibliotecas de componentes y Playwright.
- `@types/node` se mantiene en 24.x para corresponder al runtime declarado, no en la última
  publicada.
