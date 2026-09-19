/**
 * Validación del formulario de Registro (CA-1.1.1/CA-1.1.3). Sin mensajes de
 * texto (mismo patrón que `login.schema.ts`/`generalInfo.schema.ts`):
 * `RegisterForm` lee `fieldState.error?.type` para los campos simples y
 * `fieldState.error?.message` como código interno (nunca se muestra, solo
 * discrimina, igual que `educationSchema`) para las causas que van por
 * `.superRefine`.
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
 * de edad". Mismo orden que `AgePolicy.java` (confirmado 19-sep-2026).
 *
 * `contrasena` replica `PasswordPolicy.java` (confirmado 19-sep-2026): 12–64
 * caracteres contados por *code point* (`Array.from(value).length`, no
 * `.length`, que cuenta unidades UTF-16 — un emoji o una letra fuera del
 * alfabeto latino contaría doble) y la lista cerrada de contraseñas
 * comunes de `commonPasswords.ts`.
 *
 * `celular` es un objeto `{ paisIso, numeroNacional }` (no un string libre):
 * lo arma `PhoneField` a partir del país elegido + el número nacional
 * escrito. Vacío en conjunto es válido (CA-1.1.1 no exige celular);
 * `isValidPhoneNumber` de `libphonenumber-js` solo corre cuando hay número.
 */
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { z } from 'zod';
import { isAdult, isFutureDate, isImplausiblyOld } from '@/utils/calculateAge';
import { isCommonPassword } from '../model/commonPasswords';

const FECHA_NACIMIENTO_FORMATO_INVALIDO = 'FECHA_NACIMIENTO_FORMATO_INVALIDO';
const FECHA_NACIMIENTO_FUTURA = 'FECHA_NACIMIENTO_FUTURA';
const FECHA_NACIMIENTO_IMPLAUSIBLE = 'FECHA_NACIMIENTO_IMPLAUSIBLE';
const FECHA_NACIMIENTO_MENOR_DE_EDAD = 'FECHA_NACIMIENTO_MENOR_DE_EDAD';
const CONTRASENA_MUY_CORTA = 'CONTRASENA_MUY_CORTA';
const CONTRASENA_MUY_LARGA = 'CONTRASENA_MUY_LARGA';
const CONTRASENA_COMUN = 'CONTRASENA_COMUN';
const CONFIRMAR_CONTRASENA_NO_COINCIDE = 'CONFIRMAR_CONTRASENA_NO_COINCIDE';
const CELULAR_INVALIDO = 'CELULAR_INVALIDO';

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 64;

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
    celular: z.object({
      paisIso: z.string(),
      numeroNacional: z.string().trim(),
    }),
    // Sin `.min(1)`: el largo (incluida cadena vacía) ya lo cubre el
    // `.superRefine` de abajo (CONTRASENA_MUY_CORTA) — dos reglas de
    // longitud sobre el mismo campo produciría dos issues simultáneos para
    // una contraseña vacía, y `RegisterForm` solo sabe leer una.
    contrasena: z.string(),
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

    const passwordLength = Array.from(values.contrasena).length;
    if (passwordLength < PASSWORD_MIN_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['contrasena'], message: CONTRASENA_MUY_CORTA });
    } else if (passwordLength > PASSWORD_MAX_LENGTH) {
      ctx.addIssue({ code: 'custom', path: ['contrasena'], message: CONTRASENA_MUY_LARGA });
    } else if (isCommonPassword(values.contrasena)) {
      ctx.addIssue({ code: 'custom', path: ['contrasena'], message: CONTRASENA_COMUN });
    }

    if (values.confirmarContrasena !== values.contrasena) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmarContrasena'],
        message: CONFIRMAR_CONTRASENA_NO_COINCIDE,
      });
    }

    if (
      values.celular.numeroNacional.length > 0 &&
      !isValidPhoneNumber(values.celular.numeroNacional, values.celular.paisIso as CountryCode)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['celular', 'numeroNacional'],
        message: CELULAR_INVALIDO,
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
  CONTRASENA_MUY_CORTA,
  CONTRASENA_MUY_LARGA,
  CONTRASENA_COMUN,
  CONFIRMAR_CONTRASENA_NO_COINCIDE,
  CELULAR_INVALIDO,
} as const;
