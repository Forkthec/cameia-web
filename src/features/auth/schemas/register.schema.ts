/**
 * Validación del formulario de Registro (CA-1.1.1/CA-1.1.3, CM-267/C-07).
 * Sin mensajes de texto (mismo patrón que `login.schema.ts`/
 * `generalInfo.schema.ts`): `RegisterForm` lee `fieldState.error?.type` para
 * los campos simples y `fieldState.error?.message` como código interno
 * (nunca se muestra, solo discrimina, igual que `educationSchema`) para las
 * causas que van por `.superRefine`.
 *
 * `pronombres` se valida como "no vacío", no contra el catálogo real
 * (`PRONOUNS`): el `<Select>` que lo edita solo ofrece esas tres opciones
 * como `<option>`, así que un valor fuera del catálogo no es alcanzable
 * desde la interfaz — mismo criterio que ya documenta `educationSchema.ts`
 * para `level`.
 *
 * CM-267/C-07: las causas de `fechaNacimiento` se evalúan en este orden:
 * formato inválido/vacío → futura → menor de 18 → más de 110. Una fecha
 * futura nunca debe leerse como "eres menor de edad"; menor de edad se
 * evalúa antes que implausible porque es la causa más frecuente.
 *
 * `contrasena` replica `PasswordPolicy.java`: 12–64 caracteres contados por
 * *code point* sobre la cadena normalizada a NFC (CM-267/C-07:
 * «caracteres = puntos de código Unicode normalizados a NFC»). Una
 * contraseña de solo espacios cuenta como vacía (C-07). La lista de 3000
 * contraseñas comunes viene de `common-passwords.txt` (CA-1.1.27, ASVS 6.2.4).
 *
 * `celular` es un objeto `{ paisIso, numeroNacional }` (no un string libre):
 * lo arma `PhoneField` a partir del país elegido + el número nacional
 * escrito. Vacío en conjunto es válido (CA-1.1.1 no exige celular);
 * `isValidPhoneNumber` de `libphonenumber-js` solo corre cuando hay número.
 *
 * `nombre`/`apellido` replican `RegisterUserRequest.java`/`AccountEntity.java`
 * (`cameia-cuentas`, CM-267/D2-05): letras (con tildes, `ñ`/`Ñ` y `ü`/`Ü`),
 * espacios, apóstrofo (recto o tipográfico) y guion, 1 a 120 caracteres, al
 * menos una letra (CA-1.1.31). `RegisterForm` ya filtra a nivel de tecleo
 * con `filterToLettersAndSpaces` (`utils/textFilters.ts`), así que este
 * regex/`.max()` es defensa en profundidad, no la primera barrera.
 *
 * `correo` usa `emailSchema` compartido con `login.schema.ts`
 * (`email.schema.ts`, CM-195): mismo campo, mismo contrato real de
 * `EmailAddress.java`, sin duplicar el regex en dos archivos.
 */
import { isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';
import { z } from 'zod';
import { isAdult, isFutureDate, isImplausiblyOld, todayLocalIsoDate } from '@/utils/calculateAge';
import { isCommonPassword } from '../model/commonPasswords';
import { emailSchema } from './email.schema';

const NAME_REGEX = /^(?=.*[A-Za-zÁÉÍÓÚáéíóúÑñÜü])[A-Za-zÁÉÍÓÚáéíóúÑñÜü\s'’-]+$/;
const NAME_MAX_LENGTH = 120;

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
    nombre: z.string().trim().min(1).max(NAME_MAX_LENGTH).regex(NAME_REGEX),
    apellido: z.string().trim().min(1).max(NAME_MAX_LENGTH).regex(NAME_REGEX),
    fechaNacimiento: z.string(),
    correo: emailSchema,
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
    // CM-267/C-05: «"hoy" es la fecha UTC en cameia-web y en Cuentas».
    const today = new Date(`${todayLocalIsoDate()}T00:00:00Z`);

    if (!birthDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_FORMATO_INVALIDO,
      });
    } else if (isFutureDate(birthDate, today)) {
      ctx.addIssue({ code: 'custom', path: ['fechaNacimiento'], message: FECHA_NACIMIENTO_FUTURA });
    } else if (!isAdult(birthDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_MENOR_DE_EDAD,
      });
    } else if (isImplausiblyOld(birthDate)) {
      ctx.addIssue({
        code: 'custom',
        path: ['fechaNacimiento'],
        message: FECHA_NACIMIENTO_IMPLAUSIBLE,
      });
    }

    const normalizedPassword = values.contrasena.normalize('NFC');
    const passwordLength = Array.from(normalizedPassword).length;
    const isOnlySpaces = values.contrasena.trim().length === 0;
    if (isOnlySpaces || passwordLength < PASSWORD_MIN_LENGTH) {
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
