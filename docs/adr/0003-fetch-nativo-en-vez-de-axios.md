# 0003 · `fetch` nativo en vez de axios

- **Estado:** Aceptada
- **Fecha:** 06-sep-2026
- **Decide:** Frontend
- **Ticket:** CM-100

## Contexto

El frontend necesita un cliente HTTP que adjunte el ID Token de Firebase en cada petición, gestione
su renovación, aplique un tiempo máximo de espera y convierta el cuerpo de error del backend en
errores tipados que la interfaz pueda traducir.

## Decisión

`services/http/httpClient.ts` es un envoltorio delgado sobre `fetch`. No se usa axios ni ningún otro
cliente HTTP de terceros.

## Alternativas descartadas

**axios.** Trae interceptores listos y una API cómoda, pero añade peso al paquete final para
duplicar capacidades que `fetch` ya tiene en el runtime y los navegadores objetivo del proyecto. Su
modelo de interceptores globales, además, facilita que alguien añada manejo de errores por fuera de
`errorMap` y termine con dos caminos distintos para el mismo error.

**`ky` o `wretch`.** Más ligeros que axios y con mejor API que `fetch` crudo, pero el argumento de
fondo es el mismo: una dependencia más para envolver algo que ya está en la plataforma, con menos
comunidad detrás de la que tiene axios si hiciera falta soporte.

## Consecuencias

- **La renovación del token y los reintentos se implementan a mano**, y por lo tanto hay que
  probarlos. No vienen gratis con el paquete.
- **El contrato de error es propio.** `errorMap.ts` traduce el cuerpo que manda el backend a errores
  tipados de dominio, y el frontend nunca muestra el mensaje crudo del servidor: usa el código
  estable como llave de traducción. Es lo que permite que la interfaz siga funcionando en dos
  idiomas aunque el backend responda en uno solo.
- **El mapeador es el cortafuegos del contrato.** Todo lo que el backend pueda cambiar se detiene
  ahí y no llega a los componentes. Esa propiedad es la que permite construir la interfaz antes de
  que el contrato esté cerrado.
- **Hay una migración pendiente.** Hoy `errorMap.ts` espera un cuerpo con `code` y `message`. El
  formato acordado con backend es Problem Details según el RFC 9457, con extensiones propias. El
  archivo está marcado como provisional desde su primera línea y la migración es de un solo archivo.
- Sin dependencia adicional en el paquete final.
