/**
 * Sesión simulada: da una identidad fija que `profiles.handlers.ts` trata
 * como dueña de los datos, sin exigir ningún header (ni `Authorization`, ni
 * `X-User-Id`, que sigue sin confirmar — CLAUDE.md §12 abierta 2). Cualquier
 * petición, la tenga o no, se atiende como si viniera de este usuario.
 *
 * Esto NO simula un login interactivo: `RequireAuth` sigue bloqueado hasta
 * CM-34/CM-40, porque lee `useAuthStore`, que solo llena `AuthProvider.tsx`
 * suscrito al `onAuthStateChanged` real de Firebase — no una llamada de red
 * que MSW pueda interceptar. Para pruebas de páginas detrás de
 * `RequireAuth`, usa el patrón ya establecido en `AuthProvider.test.tsx` y
 * `RequireAuth.test.tsx`: `useAuthStore.setState({ isAuthenticated: true,
 * ... })` directo, sin pasar por aquí.
 *
 * `POST /api/v1/users` (CM-34, Registro) sí es un handler real: replica el
 * orden y las reglas reales de `RegisterUserService.register()` — edad
 * (`AgePolicy.java`) → contraseña (`PasswordPolicy.java`) → correo duplicado
 * (Firebase `createUser`) → celular (`PhoneNumber.java`, `IllegalArgumentException`,
 * sin `field` — su manejador real, `valorInvalido()`, no llama `campo()`).
 * No importa `utils/calculateAge` ni `features/auth/model/commonPasswords`
 * (la matriz de fronteras de `eslint.config.js` no deja que `mocks` importe
 * `utils` ni `features`): las reglas se repiten aquí en una forma mínima,
 * deliberadamente separada del código de producción — `ADR-0007`, el cuerpo
 * de cada error simula un `ProblemDetail` real, sin `code` propio.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';

export const MOCK_USER_ID = 'mock-user-01';

export const MOCK_AUTHENTICATED_USER = {
  uid: MOCK_USER_ID,
  email: 'demo@cameia.dev',
  displayName: 'Usuario de prueba',
};

const LEGAL_AGE = 18;
const IMPLAUSIBLE_AGE = 110;
const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 64;
const E164 = /^\+[1-9][0-9]{7,14}$/;

interface RegisterRequestBody {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  password?: string;
  pronoun?: string;
  phoneNumber?: string;
}

interface MockErrorField {
  field: string;
  message: string;
}

/** Misma forma que un `ProblemDetail` real (RFC 7807, `ADR-0007`) — sin `code` propio. */
function errorBody(status: number, title: string, detail: string, errors: MockErrorField[] = []) {
  return { type: 'about:blank', title, status, detail, errors };
}

/** `dd/MM/yyyy`, tal como lo exige `RegisterUserRequest.java`. `null` si no parsea. */
function parseBackendBirthDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Mismas reglas de `AgePolicy.java` (futura → >110 → <18), repetidas a propósito — ver TSDoc de cabecera. */
function ageRejectionReason(birthDate: Date, referenceDate: Date): string | null {
  if (birthDate.getTime() > referenceDate.getTime()) return 'Fecha de nacimiento inválida';

  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthdayThisYear =
    referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= birthDate.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;

  if (age > IMPLAUSIBLE_AGE) return 'La fecha de nacimiento no es plausible, por favor verifícala';
  if (age < LEGAL_AGE) return 'Debes ser mayor de edad';
  return null;
}

/** Mismo `Set` que `PasswordPolicy.java` — ver `features/auth/model/commonPasswords.ts` en el cliente. */
const COMMON_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  '12345678901234',
  '123456789012345',
  '1234567890123456',
  '111111111111',
  '000000000000',
  '121212121212',
  '123123123123',
  'abcdefghijkl',
  'abcd1234abcd',
  'qwertyuiop12',
  'qwertyuiop123',
  'qwertyuiopasd',
  'asdfghjklzxc',
  '1qaz2wsx3edc',
  'password1234',
  'password12345',
  'passwordpassword',
  'contrasena123',
  'contrasena1234',
  'contrasenia123',
  'administrador',
  'administrator',
  'iloveyou1234',
  'letmein12345',
  'welcome12345',
  'superman1234',
  'futbol123456',
  'colombia1234',
  'bogota123456',
  'cameia123456',
]);

/** Mismas reglas de `PasswordPolicy.java` — ver TSDoc de cabecera. */
function passwordRejectionReason(password: string): string | null {
  const length = Array.from(password).length;
  if (length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres`;
  }
  if (length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres`;
  }
  if (COMMON_PASSWORDS.has(password.trim().toLowerCase())) {
    return 'Esta contraseña es demasiado común';
  }
  return null;
}

let registeredEmails: string[] = [];
let nextAccountId = 1;

/** Solo para pruebas: mismo patrón que `resetProfiles()` — evita que un correo de una prueba anterior "ya exista" en la siguiente. */
export function resetRegisteredUsers(): void {
  registeredEmails = [];
  nextAccountId = 1;
}

export const authHandlers: HttpHandler[] = [
  http.post('*/api/v1/users', async ({ request }) => {
    const body = (await request.json()) as RegisterRequestBody;

    // Orden real de RegisterUserService.register(): edad → contraseña →
    // correo duplicado (Firebase) → celular (Account.register). Una
    // `birthDate` que Jackson no puede leer (formato distinto de
    // `dd/MM/yyyy`) nunca llega aquí como `AgePolicy` — cae en
    // `HttpMessageNotReadableException`/`cuerpoIlegible()`, sin `errors[]`
    // (mismo tratamiento residual que el celular, más abajo).
    const birthDate = body.birthDate ? parseBackendBirthDate(body.birthDate) : null;
    if (!birthDate) {
      return HttpResponse.json(
        errorBody(
          422,
          'Datos no válidos',
          'Revisa el formato de los datos enviados. La fecha de nacimiento usa el formato DD/MM/AAAA',
        ),
        { status: 422 },
      );
    }

    const ageReason = ageRejectionReason(birthDate, new Date());
    if (ageReason) {
      return HttpResponse.json(
        errorBody(422, 'Fecha de nacimiento no válida', ageReason, [
          { field: 'birthDate', message: ageReason },
        ]),
        { status: 422 },
      );
    }

    const passwordReason = body.password ? passwordRejectionReason(body.password) : null;
    if (passwordReason) {
      return HttpResponse.json(
        errorBody(422, 'Contraseña no válida', passwordReason, [
          { field: 'password', message: passwordReason },
        ]),
        { status: 422 },
      );
    }

    const email = body.email?.trim().toLowerCase() ?? '';
    if (registeredEmails.includes(email)) {
      return HttpResponse.json(
        errorBody(409, 'Correo ya registrado', 'Ese correo ya tiene una cuenta.'),
        { status: 409 },
      );
    }

    if (body.phoneNumber && !E164.test(body.phoneNumber.trim())) {
      const detail =
        'El número de celular debe incluir el indicativo del país, por ejemplo +573001234567';
      // `valorInvalido()` (IllegalArgumentException) no llama `campo()` en el
      // backend real: este 422 llega sin `errors[]`, a propósito.
      return HttpResponse.json(errorBody(422, 'Datos no válidos', detail), { status: 422 });
    }

    registeredEmails.push(email);
    const id = `account-${nextAccountId}`;
    const firebaseUid = `firebase-mock-${nextAccountId}`;
    nextAccountId += 1;

    return HttpResponse.json(
      { id, firebaseUid, status: 'PENDING_VERIFICATION', plan: 'FREE' },
      { status: 201 },
    );
  }),

  /**
   * Activación tras verificar el correo (CM-14, `REQ-CU-13`). El backend real
   * decide por el claim `email_verified` del ID Token, que MSW no puede leer:
   * aquí se simula con la cabecera `X-Mock-Email-Verified`, que solo existe en
   * los mocks — el cliente nunca la envía. Sin ella se responde `204`, que es
   * el camino feliz; con `false` se responde el `403` del backend real, para
   * poder ejercitar ese estado de la pantalla.
   */
  http.post('*/api/v1/users/me/verification', ({ request }) => {
    if (request.headers.get('X-Mock-Email-Verified') === 'false') {
      return HttpResponse.json(
        errorBody(403, 'Correo sin verificar', 'El correo de la cuenta no está verificado.'),
        { status: 403 },
      );
    }

    return new HttpResponse(null, { status: 204 });
  }),
];
