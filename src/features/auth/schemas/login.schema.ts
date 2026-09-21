/**
 * Validación del formulario de Login (CA-1.3.1). A propósito sin mensajes de
 * texto: CLAUDE.md §3.2 prohíbe cualquier texto visible fuera de `t(...)`, y
 * un mensaje de zod nunca llega a pantalla — `LoginForm` inspecciona
 * `error.type` y elige la prop de texto ya traducida que le corresponde
 * (mismo patrón que `generalInfo.schema.ts`).
 *
 * `correo` usa `emailSchema` compartido con `register.schema.ts`
 * (`email.schema.ts`, CM-195): mismo campo, mismo contrato real de
 * `EmailAddress.java` (`cameia-cuentas`), sin duplicar el regex en dos
 * archivos.
 */
import { z } from 'zod';
import { emailSchema } from './email.schema';

export const loginSchema = z.object({
  correo: emailSchema,
  contrasena: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
