/**
 * Validación del formulario de Registro (CA-1.1.1/CA-1.1.3). Sin mensajes de
 * texto (mismo patrón que `login.schema.ts`/`generalInfo.schema.ts`):
 * `RegisterForm` lee `fieldState.error?.type` para los campos simples y
 * `fieldState.error?.message` como código interno (nunca se muestra, solo
 * discrimina, igual que `educationSchema`) para las cuatro causas de
 * `fechaNacimiento` y para `confirmarContrasena`.
 *
 * `pronombres` se valida como "no vacío", no contra el catálogo real
 * (`PRONOUNS`): el `<Select>` que lo edita solo ofrece esas tres opciones
 * como `<option>`, así que un valor fuera del catálogo no es alcanzable
 * desde la interfaz — mismo criterio que ya documenta `educationSchema.ts`
 * para `level`.
 *
 * Las cuatro causas de `fechaNacimiento` se evalúan en este orden:
 * formato inválido/vacío primero (no se puede calcular edad sobre una fecha
 * que no parsea), luego futura, luego >110 años, y por último menor de
 * edad — una fecha futura o implausible nunca debe leerse como "eres menor
 * de edad".
 */
import { z } from 'zod';
import { isAdult, isFutureDate, isImplausiblyOld } from '@/utils/calculateAge';

const FECHA_NACIMIENTO_FORMATO_INVALIDO = 'FECHA_NACIMIENTO_FORMATO_INVALIDO';
const FECHA_NACIMIENTO_FUTURA = 'FECHA_NACIMIENTO_FUTURA';
const FECHA_NACIMIENTO_IMPLAUSIBLE = 'FECHA_NACIMIENTO_IMPLAUSIBLE';
const FECHA_NACIMIENTO_MENOR_DE_EDAD = 'FECHA_NACIMIENTO_MENOR_DE_EDAD';
const CONFIRMAR_CONTRASENA_NO_COINCIDE = 'CONFIRMAR_CONTRASENA_NO_COINCIDE';

/** Parsea `fechaNacimiento` (ISO `yyyy-MM-dd`, formato nativo de `<input type="date">`) en UTC. */
function parseBirthDate(value: string): Date | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(`${trimmed}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const registerSchema = z
  .object({
    nombre: z.string().trim().min(1),
    apellido: z.string().trim().min(1),
    fechaNacimiento: z.string(),
    correo: z.string().trim().min(1).email(),
    celular: z.string().trim(),
    contrasena: z.string().min(1),
    confirmarContrasena: z.string().min(1),
    pronombres: z.string().min(1),
  })
  .superRefine((values, ctx) => {
    const birthDate = parseBirthDate(values.fechaNacimiento);

    if (!birthDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_FORMATO_INVALIDO,
      });
    } else if (isFutureDate(birthDate)) {
      ctx.addIssue({ code: 'custom', path: ['fechaNacimiento'], message: FECHA_NACIMIENTO_FUTURA });
    } else if (isImplausiblyOld(birthDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_IMPLAUSIBLE,
      });
    } else if (!isAdult(birthDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_MENOR_DE_EDAD,
      });
    }

    if (values.confirmarContrasena !== values.contrasena) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmarContrasena'],
        message: CONFIRMAR_CONTRASENA_NO_COINCIDE,
      });
    }
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

/** Códigos internos de `.superRefine`, expuestos para que `RegisterForm` los use como discriminador de `fieldState.error?.message` sin repetir el string. */
export const registerSchemaErrorCodes = {
  FECHA_NACIMIENTO_FORMATO_INVALIDO,
  FECHA_NACIMIENTO_FUTURA,
  FECHA_NACIMIENTO_IMPLAUSIBLE,
  FECHA_NACIMIENTO_MENOR_DE_EDAD,
  CONFIRMAR_CONTRASENA_NO_COINCIDE,
} as const;
