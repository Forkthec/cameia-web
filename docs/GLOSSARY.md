# Equivalencias de vocabulario — `cameia-web`

- **Versión:** 1.0 · 11 de septiembre de 2026
- **Fuente del lenguaje ubicuo:** `docs/referencias/03092026_v3_glosario.md`
- **Decisiones que lo modifican:** `docs/decisiones/11092026_v2_respuesta-decisiones-frontend-sprint-1.md`

**Este archivo no define conceptos.** El glosario del proyecto es la única autoridad sobre qué
significa cada término. Lo que hay aquí es la traducción entre ese vocabulario y los nombres que
aparecen en el código, en el contrato de la API, en las llaves de traducción y en los enumerados.

Existe porque el proyecto escribe el código en inglés y habla el dominio en español. Esa frontera
necesita una tabla, o cada persona la cruza a su manera.

---

## 1. Reglas de uso

1. **El término del glosario manda.** Si el código llama a algo de otra forma, el que está mal es el
   código.
2. **La traducción ocurre en el mapeador, nunca en un componente.** Un componente no sabe cómo se
   llama un campo en el backend. Si un nombre del contrato no coincide con el de esta tabla, se
   resuelve en `features/*/api/*.mapper.ts`.
3. **Los códigos de enumerado no se traducen.** Se copian exactamente como los define el backend, y
   la etiqueta visible sale de una llave de traducción construida sobre el código.
4. **Si un nombre todavía no existe, se escribe `pendiente`.** No se inventa. Una fila con
   `pendiente` es información; una fila con un nombre inventado es una mentira que alguien va a
   copiar.
5. **Los pares de la sección 4 no se confunden nunca**, ni en el código, ni en un comentario, ni en
   un texto de interfaz.

---

## 2. Perfil Profesional

| Término del glosario       | Código en el front    | Campo del contrato      | Llave de i18n                        | Enumerado                                      |
| -------------------------- | --------------------- | ----------------------- | ------------------------------------ | ---------------------------------------------- |
| Perfil Profesional         | `ProfessionalProfile` | pendiente               | `profile:*`                          | ver §3                                         |
| Nombre del perfil          | `name`                | `name` (≤ 255)          | `profile:general.nombre`             | —                                              |
| Resumen Profesional        | `summary`             | `summary` (≤ 2000)      | `profile:general.resumen`            | —                                              |
| Experiencia Laboral        | `WorkExperience`      | pendiente               | `profile:experiencia.*`              | —                                              |
| Formación académica        | `Education`           | pendiente               | `profile:educacion.*`                | —                                              |
| Formación en curso         | `inProgress`          | `inProgress` (booleano) | `profile:educacion.enCurso`          | —                                              |
| Nivel educativo            | `EducationLevel`      | pendiente               | `profile:educacion.nivel.<CODIGO>`   | `TECHNICAL` · `UNDERGRADUATE` · `POSTGRADUATE` |
| Habilidad                  | `Skill`               | `skillName`             | `profile:habilidades.*`              | —                                              |
| Nivel de habilidad         | `SkillLevel`          | `level`                 | `profile:habilidades.nivel.<CODIGO>` | pendiente (C-06)                               |
| Rol Objetivo               | `TargetRole`          | `target-roles`          | `profile:rolesObjetivo.*`            | —                                              |
| Rol profesional (catálogo) | `ProfessionalRole`    | pendiente               | `profile:rolesObjetivo.catalogo`     | —                                              |

**Retirados del alcance.** `seniority` sale del contrato y queda como deuda sin uso. Las expectativas
salariales quedan fuera del producto mínimo; el recurso `salary-expectation` existe en el contrato
pero el frontend no lo consume.

---

## 3. Estados del Perfil Profesional

| Lo que ve el usuario | Código          | Cuándo                                                                                        |
| -------------------- | --------------- | --------------------------------------------------------------------------------------------- |
| Borrador             | `IN_PROGRESS`   | Desde que se crea el perfil hasta que se finaliza                                             |
| Activo               | `COMPLETED`     | Después de finalizar, cumpliendo todos los requisitos                                         |
| Archivado            | no es un estado | Se deriva de que la fecha de archivado no sea nula                                            |
| En revisión          | `IN_REVIEW`     | Fuera del flujo manual. En Sprint 1 un perfil nunca lo alcanza y no aparece en ningún listado |

La transición es directa: `IN_PROGRESS → COMPLETED`. No existe `PENDING`, y la secuencia intermedia
por `IN_REVIEW` que describía el backlog del 6 de septiembre quedó sin efecto.

Las etiquetas «creado», «completo» y «activo» **no son sinónimos** en la interfaz. El glosario es
explícito en esto y el backlog lo repite.

---

## 4. Términos que no deben confundirse

Salen de la sección 9 del glosario. Confundirlos produce errores que el compilador no detecta.

| No es lo mismo                                      | Diferencia                                                                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Rol profesional** y **Rol Objetivo**              | El primero es una entrada del catálogo del sistema. El segundo es un rol del catálogo ya asociado a un perfil concreto de un usuario                                     |
| **Feedback** y **Reporte de Evaluación**            | El primero es la reacción inmediata dentro de un turno. El segundo es el documento que se genera al terminar la sesión                                                   |
| **Idioma de la interfaz** y **idioma de la sesión** | El primero es una preferencia de quien usa la aplicación. El segundo es un dato de negocio del entrevistador. Uno puede sugerir al otro como valor por defecto, nada más |
| **Perfil creado** y **perfil activo**               | Crear un perfil no lo activa. Se activa al finalizarlo cumpliendo todos los requisitos                                                                                   |

---

## 5. Entrevistas

Este bloque queda **pendiente de confirmación**. Sus códigos están en español, y la respuesta del PO
del 11 de septiembre dice como marco general que los enumerados van en inglés sin aclarar si eso
alcanza a este módulo. Mientras no se responda la consulta C-08, la tabla refleja lo que declara el
backlog del 6 de septiembre.

| Término del glosario | Código en el front | Llave de i18n                       | Enumerado                                                              |
| -------------------- | ------------------ | ----------------------------------- | ---------------------------------------------------------------------- |
| Sesión de Entrevista | `InterviewSession` | `interview:*`                       | `CONFIGURADA` · `EN_CURSO` · `EVALUANDO` · `FINALIZADA` · `ABANDONADA` |
| Turno                | `Turn`             | `interview:turno.*`                 | pendiente                                                              |
| Modalidad            | `InterviewMode`    | `interview:modo.<CODIGO>`           | `ENTRENO` · `SIMULACION`                                               |
| Forma de respuesta   | `AnswerFormat`     | `interview:formaRespuesta.<CODIGO>` | `TEXTO` · `AUDIO`                                                      |
| Idioma de la sesión  | `sessionLanguage`  | —                                   | BCP-47, `es-CO` por defecto                                            |
| Tono                 | `Tone`             | `interview:tono.<CODIGO>`           | pendiente del spike HU-4.1                                             |
| Personalidad         | `Personality`      | `interview:personalidad.<CODIGO>`   | pendiente del spike HU-4.1                                             |

**Video** no es un valor del enumerado. Queda fuera del producto mínimo y se muestra en la interfaz
deshabilitado, con la etiqueta «Próximamente».

---

## 6. Lo que falta por definir

| Qué                                             | Bloqueado por                           |
| ----------------------------------------------- | --------------------------------------- |
| Nombres de los campos del contrato del perfil   | C-01 · falta la documentación de la API |
| Valores del nivel de habilidad                  | C-06                                    |
| Textos en español de los niveles educativos     | C-07                                    |
| Si los enumerados de Entrevistas pasan a inglés | C-08                                    |
| Catálogo de tono y personalidad                 | Spike HU-4.1 · CM-21                    |

Cada fila que se resuelva se actualiza aquí y en el `SPEC.md` de la feature correspondiente, en el
mismo commit.
