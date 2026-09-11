# Consulta de seguimiento — Contrato y alcance del Perfil Profesional

- **Versión:** 1.0
- **Fecha:** 11 de septiembre de 2026
- **De:** Juan Diego Gómez Garcés — Frontend
- **Para:** Product Owner y Scrum Master
- **Responde a:** `11092026_v2_respuesta-decisiones-frontend-sprint-1.md`
- **Documentos que se citan:** `06092026_01_Backlog.xlsx`, `03092026_v3_glosario.md`, `03092026_v1_reglas-codigo-backend-cameia.md`, `03092026_v1_familias-endpoints-sprint-1.md`, tablero Jira del proyecto CM

---

## Mensaje

Gracias por la respuesta, llegó rápido y resuelve cinco de las diecisiete dudas de forma definitiva. Ya podemos cerrar lo de las expectativas, la voz, el video, los estados del perfil y el formato de error.

Las nueve consultas de abajo salen de la respuesta misma. No son objeciones a las decisiones: son cosas que hay que precisar para poder construir. Varias aparecieron porque la respuesta menciona nombres de campos y comportamientos que no existen en ninguno de los documentos que tenemos, y necesitamos saber de dónde salen antes de escribirlos en el código.

Están ordenadas por urgencia. Las tres primeras nos bloquean para empezar; el resto se necesita antes de terminar las cinco pantallas del Perfil Profesional.

---

## Resumen

| ID | Consulta | Quién responde | Urgencia |
|---|---|---|---|
| C-01 | De dónde sale el contrato que describe la respuesta | Backend | Bloqueante |
| C-02 | Identificación del usuario mediante una cabecera editable | Backend / Arquitectura | Bloqueante |
| C-03 | Qué queda en la pantalla de elección de método, y qué pasa con el cupo | Product Owner | Bloqueante |
| C-04 | Qué ocurre con la sugerencia de roles con IA al retirar su pantalla | Product Owner | Alta |
| C-05 | Qué ticket construye la gestión de roles | Product Owner / Scrum Master | Alta |
| C-06 | Datos que faltan sobre habilidades | Product Owner / Backend | Alta |
| C-07 | Niveles educativos disponibles y sus nombres en pantalla | Product Owner | Media |
| C-08 | Si los códigos en inglés aplican a todo el producto | Product Owner / Arquitectura | Alta |
| C-09 | Fecha del spike y responsable de la historia | Scrum Master | Alta |

---

## C-01 · ¿De dónde sale el contrato que describe la respuesta?

La respuesta menciona nombres concretos del contrato de la API: `skillName`, `target-roles`, `salary-expectation`, `inProgress`, `ProblemDetail`, los valores `TECHNICAL`, `UNDERGRADUATE` y `POSTGRADUATE`, y límites nuevos de 255 y 2000 caracteres.

Ninguno de esos aparece en el backlog del 6 de septiembre. Los buscamos uno por uno y no hay ni una coincidencia. Tampoco están en el glosario ni en el documento de familias de endpoints.

Entendemos por el mensaje que el Backend evolucionó y que el backlog quedó desactualizado. El problema es que hoy solo tenemos el resumen de ese contrato dentro de un documento de respuesta, y necesitamos la fuente.

**Qué necesitamos.** El documento del que salieron esos nombres: la documentación de la API, el Swagger si ya está publicado, o el archivo que use Backend para definirlos. Cualquier cosa que podamos citar y volver a consultar.

**Por qué importa.** Estamos escribiendo la especificación de cada pantalla, y cada campo que ponemos ahí queda referenciado a su fuente. Si la única fuente es un correo, en dos semanas nadie va a poder verificar de dónde salió un nombre.

---

## C-02 · La identificación del usuario por cabecera

La respuesta indica que el perfil se crea con una petición **sin cuerpo** y que la identidad del usuario viaja en una cabecera llamada `X-User-Id`.

Queremos señalar algo antes de implementarlo. Toda la autenticación del proyecto está construida sobre el token de Firebase: el navegador lo envía, el API Gateway lo verifica y el Backend confía en esa verificación. Está así en el diagrama de arquitectura y en el código que ya tenemos escrito.

Una cabecera como `X-User-Id` es un texto que el propio usuario puede modificar desde las herramientas del navegador. Si el Backend confía en ella para saber de quién es el perfil, cualquier persona podría leer o modificar el perfil de otra cambiando ese valor.

**Qué necesitamos saber.** Si es una solución temporal mientras el Gateway todavía no valida el token, o si es el diseño definitivo.

Si es temporal, pedimos que quede registrado como tal con un ticket y una fecha de retiro. El Frontend seguirá enviando el token de Firebase como está previsto y no implementará la cabecera. Si es el diseño definitivo, pedimos que se revise con Arquitectura antes de que lleguemos a integrar.

---

## C-03 · Qué queda en la pantalla de elección de método, y qué pasa con el cupo

La respuesta dice que el perfil se crea vacío y que el nombre se envía después, en una actualización posterior. Eso abre dos preguntas.

**La primera es de pantalla.** Los criterios CA-2.2.1, CA-2.2.2 y CA-2.2.3 del backlog dicen que el usuario escribe el nombre del perfil en la pantalla de Selección de Método, y que si lo deja vacío el Frontend muestra el error sin llamar al servidor. Si el nombre ya no viaja en la creación, ¿esa pantalla conserva el campo de nombre, o queda solo con las dos tarjetas de elección y el nombre se pide dentro del formulario?

**La segunda es de producto, y nos preocupa más.** El plan gratuito permite un solo Perfil Profesional. Si el perfil se crea en el momento en que el usuario elige el método, entonces una persona que entra, toca «Llenado Manual» y se arrepiente, ya consumió su único cupo con un perfil vacío. Y no tiene forma de deshacerlo, porque archivar perfiles es HU-2.12, que está planeada para el Sprint 3.

**Qué necesitamos.** Saber si eso es aceptable para el MVP, o si hace falta alguna salida: crear el perfil solo cuando el usuario guarde algo por primera vez, permitir descartar un perfil vacío, o no contar los perfiles vacíos para el cupo.

---

## C-04 · ¿Qué ocurre con la sugerencia de roles con IA?

La respuesta retira del MVP la pantalla separada de Roles Objetivo, `PRT-02.07`, e indica que se elimine también cualquier historia que dependa exclusivamente de ella.

Esa pantalla no era solo de HU-2.11. También la usa **HU-2.10, «Sugerencia de Roles Objetivo con IA», que está planeada para el Sprint 2**. Es la pantalla donde el usuario revisa entre tres y cinco roles que propone el sistema y decide cuáles conserva.

Leída al pie de la letra, la instrucción eliminaría esa historia del producto. Suponemos que no era la intención.

**Qué necesitamos.** Una de tres: que HU-2.10 salga del MVP de forma explícita, que la sugerencia con IA también se integre dentro del formulario, o que se le asigne otra pantalla para el Sprint 2.

---

## C-05 · ¿Qué ticket construye la gestión de roles?

Con los Roles Objetivo dentro del formulario, CM-69 deja de ser una pantalla y pasa a ser una sección de la pantalla que construye CM-65.

**Qué necesitamos.** Saber si CM-69 se mantiene como ticket propio para esa sección, o si su alcance se absorbe en CM-65 y el ticket se cierra. Lo preguntamos porque cambia el orden en que se construye.

**Duda menor asociada.** La respuesta mantiene la acción de «sustituir» un rol. Esa acción tenía sentido cuando había roles sugeridos por el sistema que el usuario reemplazaba. Sin sugerencias dentro del formulario, ¿sustituir es un botón distinto en la interfaz, o basta con eliminar y volver a agregar?

---

## C-06 · Faltan tres datos sobre habilidades

La respuesta define que las habilidades pasan a ser texto libre con un nivel asociado. Para construir esa sección nos falta:

1. **Los valores del nivel.** La respuesta menciona que es una lista cerrada, pero no dice cuáles son.
2. **Qué cuenta como habilidad repetida.** El criterio CA-2.5.2 del backlog impide duplicados. Con texto libre eso deja de ser automático: si alguien escribe «Java» y después «java», ¿son la misma? ¿Y «Java » con un espacio al final?
3. **Los límites.** Cuántos caracteres admite el nombre de una habilidad, y si hay un máximo de habilidades por perfil. El criterio CA-2.5.4 decía que no había máximo, pero eso era cuando venían de un catálogo.

---

## C-07 · Niveles educativos

La respuesta define tres niveles: técnico, pregrado y posgrado.

**Consulta de producto.** Para un usuario colombiano esa lista deja fuera al tecnólogo, que es un nivel distinto del técnico y muy común en el país, y agrupa en «posgrado» la especialización, la maestría y el doctorado. Queremos confirmar que esa simplificación es intencional y suficiente para el MVP, porque el usuario que no encuentre su nivel va a elegir el más parecido y el dato pierde valor.

**Consulta de interfaz.** Esos tres valores se van a mostrar en pantalla con un texto en español. El Frontend puede proponerlo, pero necesitamos que alguien de producto apruebe el texto exacto.

**Confirmación.** La respuesta reemplaza el estado de la formación académica por una casilla de «en curso». Con eso desaparece la posibilidad de marcar una formación como interrumpida, que el backlog sí contemplaba. Queremos confirmar que se pierde a propósito.

---

## C-08 · ¿Los códigos en inglés aplican a todo el producto?

El mensaje de la respuesta dice, como marco general, que los códigos internos van en inglés.

En el Perfil Profesional eso es coherente y no genera problema. La duda es el alcance, porque los códigos del módulo de Entrevistas están en español y el backlog del 6 de septiembre los declara oficiales: los estados de la sesión son `CONFIGURADA`, `EN_CURSO`, `EVALUANDO`, `FINALIZADA` y `ABANDONADA`, y las modalidades son `ENTRENO` y `SIMULACION`. Las reglas de código del Backend, además, dicen expresamente que esa mezcla de idiomas es deliberada y que esos valores no se traducen.

**Qué necesitamos.** Confirmar si el inglés aplica solo al Perfil Profesional, o si también cambian los códigos de Entrevistas.

**Por qué importa.** Si cambian los de Entrevistas, hay que rehacer los archivos de traducción que ya están escritos y corregir todas las referencias a la máquina de estados de la sesión. Preferimos saberlo ahora y no cuando lleguemos a esas pantallas.

---

## C-09 · Fecha del spike y responsable de la historia

Revisamos el tablero después de recibir la respuesta. El estado es este:

- Las cuatro subtareas del spike, CM-74 a CM-77, **sí quedaron asignadas a Vela**, hoy 11 de septiembre a las 2:20 de la mañana.
- **La historia CM-21 sigue sin asignar y en «Por hacer»**, sin modificarse desde el 1 de septiembre.
- **Ninguna de las cinco tiene fecha de entrega.**

Agradecemos la asignación. Lo que sigue faltando es la fecha, que es lo que necesitamos para saber si CM-84, CM-85 y CM-89 caben en este sprint o hay que moverlos.

**Qué necesitamos.** Una fecha comprometida de entrega del spike, y que la historia CM-21 tenga responsable, no solo sus subtareas.

**Observación menor.** La historia CM-19 aparece en estado «En curso» desde ayer al mediodía, aunque no tiene a nadie asignado y su subtarea de Frontend sigue en «Por hacer». Si fue un cambio involuntario, conviene devolverla.

---

## Sobre el backlog corregido

La respuesta anuncia que las correcciones al backlog se harán hoy. Mientras tanto vamos a avanzar en el trabajo interno del repositorio, que no depende de ninguna de estas decisiones, y dejaremos para después la especificación de las pantallas del Perfil Profesional.

La razón es simple: si escribimos la especificación contra esta respuesta y mañana aparece un backlog corregido con algún matiz distinto, terminaríamos con tres documentos en desacuerdo en lugar de dos.

**Lo que pedimos.** Que nos avisen cuando el backlog corregido esté publicado, con su nombre de archivo y fecha, para citarlo correctamente.

---

## Tabla de respuestas

| ID | Respuesta | Quién | Fecha |
|---|---|---|---|
| C-01 | | | |
| C-02 | | | |
| C-03 | | | |
| C-04 | | | |
| C-05 | | | |
| C-06 | | | |
| C-07 | | | |
| C-08 | | | |
| C-09 | | | |
