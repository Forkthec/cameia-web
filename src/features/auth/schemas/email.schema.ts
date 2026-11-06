/**
 * Validación de correo compartida por `register.schema.ts` y
 * `login.schema.ts` (CM-195): antes cada schema traía su propio `.email()`
 * de Zod, más permisivo que lo que el backend real acepta. El regex es el de
 * `EmailAddress.java` (`cameia-cuentas`, confirmado 20-sep-2026, auditoría de
 * incongruencias) — mismo campo, mismo contrato, un solo lugar. `maxLength`
 * es el límite de Firebase Auth, confirmado en el value object de dominio
 * (no en una anotación del DTO de request) — no documentado en el backlog,
 * divergencia consciente igual que la de nombre/apellido.
 *
 * Se valida al perder foco/enviar, nunca a nivel de tecleo: un correo válido
 * necesita `.`, `_`, `%`, `+`, `-`, `@`, así que no hay nada seguro que
 * filtrar mientras la persona escribe.
 */
import { z } from 'zod';

const EMAIL_REGEX = /^[^@\s]+@[^@\s.]+(\.[^@\s.]+)+$/;

export const EMAIL_MAX_LENGTH = 254;

export const emailSchema = z.string().trim().min(1).max(EMAIL_MAX_LENGTH).regex(EMAIL_REGEX);
