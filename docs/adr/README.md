# Registros de decisión de arquitectura — `cameia-web`

Un ADR documenta una decisión técnica que ya se tomó, por qué se tomó y qué se descartó. No es una
propuesta ni una guía: es memoria. Sirve para que dentro de tres meses nadie vuelva a discutir algo
que ya se discutió, y para que quien entre nuevo entienda por qué el código es como es.

## Índice

| #                                                    | Decisión                                              | Estado                           | Fecha       |
| ---------------------------------------------------- | ----------------------------------------------------- | -------------------------------- | ----------- |
| [0001](0001-atomic-design-hibrido-por-contexto.md)   | Atomic Design híbrido por contexto                    | Aceptada                         | 04-sep-2026 |
| [0002](0002-typescript-6-y-resolver-de-fronteras.md) | TypeScript 6.0.3 y el resolver de fronteras           | Aceptada                         | 06-sep-2026 |
| [0003](0003-fetch-nativo-en-vez-de-axios.md)         | `fetch` nativo en vez de axios                        | Aceptada                         | 06-sep-2026 |
| [0004](0004-perfil-activo-como-seleccion-efimera.md) | El perfil activo es una selección efímera del cliente | Aceptada, con revisión pendiente | 06-sep-2026 |
| [0005](0005-tema-claro-unico-en-el-mvp.md)           | Un solo tema visual en el MVP                         | Aceptada                         | 06-sep-2026 |

## Reglas

1. **Un ADR no se edita para cambiar de opinión.** Si la decisión deja de valer, se escribe uno
   nuevo que la sustituye, y el viejo pasa a estado `Sustituida por NNNN`. El texto original se
   conserva: la historia de por qué se pensó algo también es información.
2. **Solo se escribe un ADR si la decisión tiene alcance estructural**, es decir, si revertirla
   obligaría a tocar muchos archivos o a renegociar con otro equipo. Una decisión local se explica
   en el TSDoc del archivo o en el `SPEC.md` de su feature.
3. **Las alternativas descartadas son obligatorias.** Un ADR sin ellas no documenta una decisión,
   documenta una preferencia.
4. **Numeración secuencial, nunca se reutiliza.** El nombre del archivo es
   `NNNN-titulo-en-kebab-case.md`.

## Plantilla

```markdown
# NNNN · Título en una línea

- **Estado:** Propuesta | Aceptada | Sustituida por NNNN | Derogada
- **Fecha:** DD-mmm-AAAA
- **Decide:** rol o persona
- **Ticket:** CM-NNN

## Contexto

Qué situación obligó a decidir. Hechos, no opiniones.

## Decisión

Qué se hizo, en presente y en una o dos frases.

## Alternativas descartadas

Cada una con la razón concreta por la que se descartó.

## Consecuencias

Lo que esta decisión obliga, permite o cuesta. Incluidas las consecuencias que no gustaron.
```
