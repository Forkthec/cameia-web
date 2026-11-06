/**
 * Error propio del mapper (D10): la respuesta `200` de `…/answers`,
 * `…/reprocess` o `…/answers/audio` no tiene la forma del contrato previsto.
 * Existe para distinguirla de un fallo de red: el hook trata todo lo que no es
 * `ApiError` como red, y un `TypeError` del mapper caería ahí por error. Solo
 * `errorMap` construye `ApiError`, así que el mapper lanza este en su lugar y
 * el hook lo muestra con el mensaje genérico.
 */
export class AnswerResponseShapeError extends Error {
  constructor() {
    super('La respuesta 200 no tiene la forma del contrato previsto.');
    this.name = 'AnswerResponseShapeError';
  }
}
