# Asistente «Nueva entrevista» — diseño «Amanecer» frente al backlog v8.2

- **Fecha:** 19 de octubre de 2026
- **Alcance:** HU-4.2 (CM-202), HU-4.3 (CM-205), HU-4.4 (CM-208) y HU-10.4 (CM-314)
- **Fuente:** `16102026_01_Backlog_v8.2.xlsx`, hojas HE-04 y HE-10
- **Para quién:** equipo y Tester. Las pruebas se basan en el backlog; este documento dice qué
  agrega el diseño (solo presentación) y qué sigue pendiente.

## 1. Regla aplicada

El rediseño **no agrega pasos, campos, opciones ni flujos**. Los cinco pasos, sus nombres y el
orden son los de la navegación de HE-04: Perfil profesional → Oferta y rol → Modo y tono → Idioma y
forma de respuesta → Confirmar («Iniciar entrevista»). Todos los textos existen en es-CO y en.

## 2. Ajustes hechos para cumplir el backlog

| Criterio | Antes | Ahora |
| -------- | ----- | ----- |
| CA-4.2.8 / 4.2.9 | El botón decía «Continuar» | Dice **«Siguiente»** (`common:acciones.siguiente`) |
| CA-4.2.15 / 4.2.16 | Sin rol, el botón quedaba deshabilitado y no había mensaje | «Siguiente» se puede pulsar; sin un rol elegido de la lista muestra **«Elige un rol objetivo de la lista.»** bajo «Rol objetivo» y no avanza |
| CA-4.2.10 | Una oferta con solo espacios se enviaba tal cual | Se envía como vacía (`null`) |
| CA-4.2.13 | Soltar un archivo sobre la oferta no estaba controlado | Se cancela el soltado de archivos; el texto se conserva; no hay control de carga |
| CA-4.4.1 / 4.4.6 | Tras crear la sesión navegaba a `/entrevistas/{id}/preparando` (ruta inexistente, 404) | Navega a **`/entrenar/nueva/iniciando`** (PRT-04.11, «Iniciando sesión de entrevista»), con el id de la sesión |
| CA-4.4.8 «Volver a mi entrevista» | Navegaba a `/entrevistas/{id}` (ruta inexistente) | Navega a **`/entrenar/sesion/{id}`** |

## 3. Lo que agrega el diseño y no está en el backlog

Solo presentación o navegación ya existente en la app; **no cambian reglas ni datos enviados**.

| Elemento | Qué es | Por qué |
| -------- | ------ | ------- |
| Barra de navegación de la app en el asistente | El asistente se muestra dentro de `AppShell` (misma navegación que el resto del área autenticada) | Consistencia con las demás pantallas con sesión |
| **«Volver a inicio»** arriba del progreso | Lleva a `/inicio` (Tablero, HU-10.4) | Salida explícita del asistente, pedida por Frontend; distinta de «Atrás», que solo cambia de paso |
| Encabezado de cada paso | Pregunta + línea de contexto (p. ej. «¿A qué te estás postulando?») | Copy nuevo, **pendiente de aprobación**; llaves `interview:asistente.encabezados.*` |
| «Paso x de 5» | Texto junto a las acciones en escritorio | Orientación; llave `interview:asistente.pasoDeTotal` |
| Indicador de progreso «camino del amanecer» | Nodos numerados; el actual como el sol de la marca | Mismo `Stepper`, solo cambia su aspecto |
| Tarjetas de opción con ícono y check | Mismo `CardSelectable` | Solo aspecto; mismas opciones |

**Se quitó por no estar en el backlog:** los atajos «De tu perfil» bajo el campo de rol (CA-4.2.20 ya
los pide dentro de la lista del campo, y ahí siguen) y el botón «Cambiar» por fila del resumen de
confirmación (no está en el flujo de navegación de HU-4.4).

**Advertencias como `role="status"`:** los avisos de advertencia («Tu navegador no permite grabar…»,
datos incompletos) usan la molécula `AlertInline`, que anuncia las advertencias como `status` y los
errores como `alert`.

## 4. Pendiente (no resuelto en este cambio)

| Criterio | Qué falta | Por qué no se hizo aquí |
| -------- | --------- | ----------------------- |
| CA-4.3.10 y nota técnica de HU-4.3 | Las opciones (tonos, idiomas, modalidades, formas de respuesta) y su disponibilidad deben venir de `GET /api/v1/interviews/config/catalog`, «sin indicador propio en cameia-web». Hoy están fijas en el front (incluido «Entreno» deshabilitado). | Requiere el contrato real del endpoint (forma de la respuesta); no se inventa |
| CA-4.3.11 | Estado de error de ese catálogo: «Ocurrió un error. Inténtalo de nuevo.» con «Reintentar carga» | Depende del punto anterior |
| CA-4.2.6 | «Terminar mi perfil» abre el borrador **más reciente**: el código toma el último de la lista, sin ordenar por fecha | Depende de que el backend devuelva la fecha o el orden |
| HU-4.5 | La pantalla «Iniciando sesión de entrevista» sigue siendo un placeholder | Fuera de estas HU |
| CA-10.4.2 (PR del tablero) | «Nueva entrevista» del tablero debe llevar a `/entrenar/nueva` | Se corrige en el PR del tablero (CM-314) |
