# Solicitud de decisiones — Frontend, Sprint 1

- **Versión:** 1.0
- **Fecha:** 10 de septiembre de 2026
- **De:** Juan Diego Gómez Garcés — Frontend
- **Para:** Product Owner y Scrum Master
- **Asunto:** decisiones necesarias para empezar a construir las pantallas de Perfil Profesional
- **Documentos que se citan:** `06092026_01_Backlog.xlsx` (versión vigente), `03092026_v3_glosario.md`, `03092026_v1_familias-endpoints-sprint-1.md`, tablero Jira del proyecto CM, prototipos de Figma «Cameia · Mockups MVP»

---

## Por qué esta solicitud

El andamiaje del frontend está terminado y el siguiente paso es construir las pantallas del Perfil Profesional, que son las cinco primeras del sprint. Al revisar el backlog del 6 de septiembre contra el tablero de Jira y contra los prototipos aparecieron varias diferencias entre lo que dice cada fuente. Ninguna se puede resolver desde el frontend, porque son decisiones de producto o de alcance.

Estamos adoptando una forma de trabajo en la que cada funcionalidad tiene su especificación escrita y viva junto al código. Esa especificación cita la historia de usuario y el criterio de aceptación del que sale cada comportamiento. Por eso necesitamos las respuestas **por escrito**: van a quedar referenciadas en la documentación del repositorio, y una decisión acordada de palabra no se puede citar.

El sprint cierra el 28 de septiembre. Las decisiones del bloque 1 se necesitan para arrancar; las del bloque 4 se pueden resolver en paralelo.

---

## Resumen

| ID          | Tema                                               | Quién decide      | Bloquea                  | Urgencia |
| ----------- | -------------------------------------------------- | ----------------- | ------------------------ | -------- |
| D-01        | Dónde se gestionan los Roles Objetivo              | Product Owner     | CM-65, CM-69             | Alta     |
| D-02        | Si las expectativas siguen siendo parte del perfil | Product Owner     | CM-65                    | Alta     |
| D-03        | Historias para la Landing y el Tablero de inicio   | Product Owner     | Dos pantallas sin ticket | Alta     |
| D-04        | Qué ve el usuario si elige responder por voz       | Product Owner     | CM-85, CM-31             | Media    |
| D-05        | Cómo se muestra la opción de video                 | Product Owner     | CM-85                    | Media    |
| J-01 a J-06 | Correcciones al tablero de Jira                    | PO y Scrum Master | Trazabilidad             | Alta     |
| S-01        | Responsable del spike de personalización           | Scrum Master      | CM-84, CM-85, CM-89      | Alta     |
| S-02        | Prototipos citados que no encontramos              | PO y diseño       | CM-80, CM-84             | Media    |
| T-01 a T-03 | Preguntas para redirigir a Backend                 | PO redirige       | Integración              | Media    |

---

## 1. Decisiones de producto

### D-01 · ¿Dónde se gestionan los Roles Objetivo?

**Qué pasa.** Como frontend proponemos que los Roles Objetivo se vean y se seleccionen dentro del formulario del perfil, con un estilo de etiquetas, en vez de una lista en una pantalla aparte. Es un cambio de presentación y entra dentro de lo que decidimos nosotros. El problema es que el backlog describe el comportamiento de otra manera, y eso sí lo decide Producto.

**Dónde está escrito.** En el backlog del 6 de septiembre:

- La historia HU-2.5 dice de forma explícita que esa pantalla **no** agrega, edita ni elimina Roles Objetivo, y que solamente verifica que existan.
- Esa misma historia dice que si el usuario no tiene ningún Rol Objetivo, el sistema bloquea la finalización del perfil y **lo lleva a la pantalla de Roles Objetivo**. Para que ese flujo funcione, esa pantalla tiene que existir.
- El criterio CA-2.11.2 empieza diciendo «El Usuario está en la pantalla de Roles Objetivo».
- La pantalla en cuestión, PRT-02.07, no es solo de HU-2.11: también la usa HU-2.10, que es la sugerencia de roles con inteligencia artificial y está planeada para el Sprint 2. Si la pantalla desaparece, esa historia se queda sin dónde vivir.

**Qué necesitamos.** Que elijan una de estas tres:

1. **Las etiquetas se ven en el formulario, pero solo para consultar**, con un enlace a la pantalla de Roles Objetivo, donde se sigue agregando, sustituyendo, priorizando y eliminando. No cambia ninguna historia ni ningún criterio, y la pantalla sigue disponible para el Sprint 2. _Es la que recomendamos._
2. **Las etiquetas se gestionan dentro del formulario y la pantalla aparte desaparece.** Esto obliga a reescribir HU-2.5, el criterio CA-2.11.2, y a decidir dónde se hará la revisión de roles sugeridos por IA en el Sprint 2.
3. **Las dos cosas a la vez.** No la recomendamos: sería mantener la misma funcionalidad en dos lugares.

**Nota de diseño que conviene tener en cuenta.** El criterio CA-2.11.6 pide que el usuario pueda reordenar los roles y que el sistema recalcule su prioridad del 1 al 5. Las etiquetas puestas en fila no comunican bien un orden, y arrastrarlas para priorizar es incómodo en celular. Para las habilidades las etiquetas funcionan perfecto, porque no tienen orden. Para los roles, que sí lo tienen, tal vez convenga conservar la lista.

---

### D-02 · ¿Las expectativas siguen siendo parte del perfil?

**Qué pasa.** El ticket CM-65 se llama «Crear sección Habilidades y Expectativas con acción Finalizar y Continuar». Pero en el backlog del 6 de septiembre la historia HU-2.5 se llama «Llenado Manual: Habilidades y Finalización del Perfil Profesional», y la palabra expectativas no aparece en ninguna parte de su descripción. Esa historia tiene siete criterios de aceptación y ninguno menciona expectativas.

Además, el documento de familias de endpoints ya había señalado este vacío: registra que la historia menciona expectativas pero que no existe ningún lugar donde guardarlas.

**Qué necesitamos.** Una de dos:

- **Las expectativas se quedan.** En ese caso hace falta que se agreguen al backlog con su criterio de aceptación, y que Backend defina dónde se guardan. Sin eso construiríamos una sección que no se puede guardar.
- **Las expectativas salen.** En ese caso hay que corregir el nombre del ticket CM-65 y el de la historia CM-19.

---

### D-03 · La Landing y el Tablero de inicio no tienen historia de usuario

**Qué pasa.** Los prototipos PRT-00.01 (la página pública de bienvenida) y PRT-00.02 (el tablero que ve el usuario después de entrar) están dibujados y aprobados, y el flujo de inicio de sesión lleva directamente al segundo. Pero ninguno de los dos tiene historia de usuario en el backlog, y por lo tanto no tienen ticket en Jira.

Son dos pantallas completas de trabajo que hoy no están contabilizadas en el sprint y que no aparecen en ninguna estimación.

**Qué necesitamos.** Que se creen las dos historias, o que se nos confirme por escrito que ese trabajo se registra de otra forma, para que quede visible en el tablero.

---

### D-04 · ¿Qué ve el usuario si elige responder por voz?

**Qué pasa.** Al configurar una entrevista, el backlog indica que la opción de responder por voz viene **preseleccionada por defecto**. Pero la funcionalidad que realmente graba y transcribe la voz es la historia HU-5.8, que está planeada para el Sprint 2.

Esto significa que en el Sprint 1 un usuario puede configurar una entrevista por voz, iniciarla, y llegar a la pantalla de respuesta sin que exista nada que grabe.

**Qué necesitamos.** Que confirmen cuál de estas es la experiencia deseada:

- Que la opción de voz aparezca visible pero deshabilitada, con una nota de «Próximamente», y que la opción de texto quede preseleccionada.
- Que la opción de voz siga preseleccionada como dice el backlog, y que al llegar a la pantalla de respuesta el usuario vea un aviso de que la función todavía no está disponible.
- Otra alternativa que ustedes consideren.

---

### D-05 · Cómo se muestra la opción de video

**Qué pasa.** El glosario indica que el video queda fuera del alcance del producto mínimo, y el modelo de datos solo admite texto y voz. Desde el frontend proponemos mostrar la opción de video en pantalla, deshabilitada y con la etiqueta «Próximamente», para dejar constancia de que la aplicación la tendrá más adelante.

**Qué necesitamos.** Que confirmen si están de acuerdo con mostrarla así, o si prefieren que no aparezca del todo hasta que exista.

---

## 2. Correcciones al tablero de Jira

Estas no son decisiones difíciles, pero sí necesitamos que alguien las haga y nos avise. Las especificaciones que estamos escribiendo citan el número del ticket, y un ticket cuyo título no corresponde con lo que hay que construir hace que la trazabilidad deje de servir.

### J-01 · CM-61 solo menciona la experiencia laboral

El ticket se llama «Llenado Manual: Experiencia Labora (Frontend)», con una errata incluida. Pero la historia HU-2.4 cubre **experiencia laboral y educación**, y el backlog es claro en que la experiencia es opcional mientras que **la educación es obligatoria** para poder activar el perfil.

Tal como está el tablero, la parte de educación no tiene ticket. Y sin ella, el perfil nunca podrá finalizarse, porque uno de los requisitos de finalización es tener al menos una formación académica registrada.

### J-02 · CM-65 y las expectativas

Depende de lo que se decida en D-02.

### J-03 · CM-69 no incluye todo lo que pide la historia

El ticket se llama «Crear interfaz editable de gestión de roles objetivo Consulta, Agregar y Eliminar». Pero la historia HU-2.11 se llama «agregar, **sustituir, priorizar** y eliminar», y tiene criterios específicos para sustituir un rol sugerido por otro y para reordenar prioridades. Son dos funcionalidades más de las que el título anuncia.

### J-04 · CM-93 tiene un título que no corresponde

El ticket, que es de frontend, se llama «Implementar transición CONFIGURADA→EN_CURSO con reintentos y fallback». Esa transición ocurre en el servidor. Lo que le toca al frontend es la pantalla de espera mientras eso sucede y la pantalla de error si falla. Además el título arranca con un espacio de tabulación.

### J-05 · Doce subtareas no tienen título

Las siguientes subtareas aparecen en el tablero con un guion como nombre: CM-33, CM-38, CM-39, CM-44, CM-45, CM-55, CM-56, CM-57, CM-59, CM-79, CM-83 y CM-88.

### J-06 · Hay elementos de prueba dentro del sprint

CM-1 y CM-2 se llaman «Tarea 1» y «Tarea 2» y están incluidas en el sprint activo. CM-3, CM-4 y CM-60 («ccccx») parecen del mismo origen. Si son residuos de la configuración inicial del tablero, conviene sacarlos para que las métricas del sprint no los cuenten.

---

## 3. Coordinación del sprint

### S-01 · El spike de personalización no tiene responsable

La historia HU-4.1, que en Jira es CM-21, es una investigación con tiempo acotado cuyo resultado es el catálogo cerrado de tonos y personalidades de la entrevista. El backlog dice que **bloquea a HU-4.3 y HU-4.4**.

Hoy CM-21 está sin asignar y sin empezar, igual que sus cuatro subtareas CM-74, CM-75, CM-76 y CM-77. Tres de nuestros tickets dependen de su resultado: CM-84, CM-85 y CM-89.

**Qué necesitamos.** Un responsable y una fecha de entrega, para saber si podemos planear esos tres tickets dentro del sprint o si hay que moverlos.

### S-02 · Prototipos citados que no encontramos

El backlog asocia la historia HU-4.2 a los prototipos PRT-04.02, PRT-04.03, PRT-04.04 y PRT-04.05, y la historia HU-4.3 a PRT-04.07, PRT-04.08, PRT-04.09 y PRT-04.10.

Cuando revisamos el archivo de Figma al planear el sprint, no encontramos pantallas con los códigos PRT-04.04, PRT-04.05, PRT-04.08 ni PRT-04.10. El asistente de configuración que sí está dibujado tiene tres pasos, no ocho.

**Qué necesitamos.** Que se confirme si esos prototipos existen con otro nombre, si están pendientes de dibujar, o si la lista del backlog quedó desactualizada. Es lo que define cuántas pantallas hay que construir en CM-80 y CM-84.

---

## 4. Preguntas para redirigir a Backend y Arquitectura

Estas no las decide Producto, pero necesitamos que lleguen a quien corresponda y que la respuesta vuelva por escrito.

### T-01 · Tres catálogos que el frontend necesita leer y que no tienen dónde consultarse

Para construir las pantallas del perfil necesitamos mostrarle al usuario listas de opciones que vienen del sistema: los **niveles educativos**, las **habilidades** y los **roles profesionales**. El backlog exige en los tres casos que solo se puedan elegir opciones activas del catálogo, y en el caso de los roles dice expresamente que el usuario no puede escribir el nombre a mano.

Sin embargo, ni el backlog ni el documento de familias de endpoints definen de dónde el frontend obtiene esas tres listas.

**Qué necesitamos saber.** Si esos endpoints ya existen, cuándo estarán disponibles, y si habrá datos de prueba cargados. Mientras tanto vamos a trabajar con datos simulados, pero eso significa que la integración real queda pendiente.

### T-02 · Cuándo cambia el perfil de un estado a otro

El backlog dice que el perfil se crea en `PENDING`, y también que al finalizarlo el sistema hace la secuencia `IN_PROGRESS` → `IN_REVIEW` → `COMPLETED`. No encontramos escrito en qué momento el perfil pasa de `PENDING` a `IN_PROGRESS`. Suponemos que ocurre al guardar por primera vez, pero preferimos no suponerlo.

Relacionado con esto: la historia HU-2.12 dice que la lista de perfiles muestra «En revisión» como un estado más que el usuario puede ver, pero la historia HU-2.5 deja ese estado dentro de una única transacción, donde en la práctica nadie alcanzaría a verlo. Nos gustaría saber si «En revisión» es un estado que el usuario ve o no.

### T-03 · Dos formas distintas de pedir la misma lista de perfiles

La historia HU-2.1 consulta los perfiles del usuario usando `status=ACTIVE`, mientras que el documento de familias de endpoints usa `status=COMPLETED` para pedir exactamente lo mismo en la historia HU-4.2. Necesitamos saber cuál de las dos es la correcta.

---

## Cómo respondernos

Con que respondan sobre este mismo documento, o en un comentario del ticket correspondiente en Jira, es suficiente. Lo importante es que quede el registro escrito y la fecha, porque cada respuesta va a quedar citada en la documentación del repositorio.

Si algo de lo que planteamos aquí ya se decidió en una reunión y no nos enteramos, avísennos y lo damos por cerrado sin más trámite.

| ID   | Respuesta | Quién | Fecha |
| ---- | --------- | ----- | ----- |
| D-01 |           |       |       |
| D-02 |           |       |       |
| D-03 |           |       |       |
| D-04 |           |       |       |
| D-05 |           |       |       |
| J-01 |           |       |       |
| J-02 |           |       |       |
| J-03 |           |       |       |
| J-04 |           |       |       |
| J-05 |           |       |       |
| J-06 |           |       |       |
| S-01 |           |       |       |
| S-02 |           |       |       |
| T-01 |           |       |       |
| T-02 |           |       |       |
| T-03 |           |       |       |
