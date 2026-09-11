---
feature: nombre-de-la-carpeta
estado: ANDAMIAJE
hu: []
prt: []
jira: []
rutas: []
documentacion: tsdoc-es
backlog: 06092026_01
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-09-11
---

<!--
  PLANTILLA. Se copia a src/features/<nombre>/SPEC.md y se rellena.
  Borra estos comentarios al copiarla; no son parte de la especificación.

  El encabezado de arriba lo lee `pnpm spec:check`. Reglas:
  - `estado` admite ANDAMIAJE, EN_CURSO, IMPLEMENTADA o BLOQUEADA.
  - `rutas` debe coincidir con lo que existe en app/router/routes.ts.
  - `backlog` es la versión contra la que se escribió. Si el backlog cambia y esto no,
    la spec está vieja y hay que revisarla.
  - `decisiones` lista los documentos de docs/decisiones/ que modifican lo que dice el backlog.
  - `revisado` es la última vez que un humano confirmó que esto sigue siendo cierto.
-->

# Feature · <Nombre legible>

## 1. Propósito

<!-- Tres líneas. Para qué existe esta feature, en el vocabulario del glosario.
     No describas la implementación. -->

## 2. Alcance

**Entra en este sprint:**

-

**No entra, y es deliberado:**

<!-- Aquí van las cosas que alguien podría creer que faltan: funciones diferidas a otro sprint,
     opciones visibles pero deshabilitadas, rutas que llevan a un sitio provisional.
     Cada una con el ticket o la historia que la traerá. -->

-

## 3. Comportamiento esperado

<!-- Por ruta o por pantalla. Es la sección principal y la que no depende del backend.
     Cada pantalla declara obligatoriamente sus cuatro estados. Si alguno no aplica,
     se escribe por qué. -->

### `<ruta>` — <Nombre de la pantalla> · `PRT-XX.XX`

**Qué hace**

-

**Estados**

| Estado      | Qué muestra |
| ----------- | ----------- |
| Carga       |             |
| Vacío       |             |
| Error       |             |
| Sin permiso |             |

**Validaciones del lado del cliente**

<!-- Solo las que el frontend aplica antes de llamar al servidor. Con su mensaje y su llave
     de traducción. Las que valida el backend van en la sección 4. -->

-

## 4. Contrato observable

<!-- Lo que la interfaz necesita saber del dominio, independientemente de cómo viaje por HTTP.
     Esta parte es estable: sale del backlog, del modelo de datos y del glosario. -->

**Campos y reglas**

| Campo | Tipo | Regla | Origen |
| ----- | ---- | ----- | ------ |

**Estados y enumerados**

<!-- Con su equivalencia visible. Referencia a docs/GLOSSARY.md, sin repetir la tabla. -->

**Errores que el usuario puede ver**

| Código | Cuándo ocurre | Llave de i18n |
| ------ | ------------- | ------------- |

## 5. Enlace HTTP · PROVISIONAL

<!-- Rutas, verbos y forma del cuerpo. Es la sección volátil: cuando el backend publique su
     contrato, esto y el mapeador son lo único que se toca.
     Mientras no exista documentación de la API, se marca con fecha y con la fuente de la que
     se dedujo cada endpoint. -->

**Estado del contrato:** provisional · fuente: <documento> · revisado el <fecha>

| Operación | Método y ruta | Envía | Recibe |
| --------- | ------------- | ----- | ------ |

## 6. Criterios de aceptación

<!-- Por referencia, nunca copiados. El texto vive en el backlog y copiarlo garantiza que
     las dos versiones se separen. Aquí solo va lo que el frontend interpreta o añade. -->

| Criterio | Qué hace el frontend que el criterio no dice |
| -------- | -------------------------------------------- |

## 7. Estado de implementación

<!-- Es el ancla que hace detectable la divergencia. Cada archivo con lo que implementa y la
     prueba que lo cubre. `spec:check` verifica que los archivos existan. -->

| Archivo | Qué implementa | Prueba |
| ------- | -------------- | ------ |

## 8. Bloqueos

| Id  | Qué falta | De quién depende | Desde |
| --- | --------- | ---------------- | ----- |

## 9. Notas

<!-- Opcional. Decisiones locales que no llegan a ADR, notas de traducción, diferencias
     conscientes respecto a Figma.

     Regla de autoridad: cuando esta especificación y Figma difieren en diseño, manda la
     especificación y Figma se actualiza después. Cuando difieren en comportamiento, manda
     el backlog siempre. Toda diferencia consciente se anota aquí. -->
