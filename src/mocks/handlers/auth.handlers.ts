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
 * `POST /api/v1/users` (CM-34, Registro) sí es un handler real: simula las
 * dos excepciones de dominio de `RegisterUserService.register()` que el
 * frontend distingue visualmente (`EmailAlreadyRegisteredException`,
 * `InvalidBirthDateException` — `ADR-0006`, `SPEC.md` §3/§4). No importa
 * `utils/calculateAge` (la matriz de fronteras de `eslint.config.js` no deja
 * que `mocks` importe `utils`): la cuenta de edad se repite aquí en una
 * forma mínima, deliberadamente separada del código de producción.
 * `WeakPasswordException` no se simula — sin política de fuerza publicada
 * (Bloqueo B-12), ningún valor de `password` la dispara todavía.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';

export const MOCK_USER_ID = 'mock-user-01';

export const MOCK_AUTHENTICATED_USER = {
  uid: MOCK_USER_ID,
  email: 'demo@cameia.dev',
  displayName: 'Usuario de prueba',
};

// PROVISIONAL — códigos sin confirmar por CM-35, mismo estado que el resto
// de `errors:codigos.*` provisionales (SPEC.md §8, B-06).
const REGISTRO_CORREO_DUPLICADO = 'REGISTRO_CORREO_DUPLICADO';
const REGISTRO_FECHA_NACIMIENTO_INVALIDA = 'REGISTRO_FECHA_NACIMIENTO_INVALIDA';

const LEGAL_AGE = 18;

interface RegisterRequestBody {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  email?: string;
  password?: string;
  pronoun?: string;
  phoneNumber?: string;
}

/** Misma forma que `BackendErrorBody` en `services/http/errorMap.ts` — el contrato provisional, no RFC 9457. */
function registerErrorBody(code: string, message: string) {
  return { code, message, details: [], timestamp: new Date().toISOString() };
}

/** `dd/MM/yyyy`, tal como lo exige `RegisterUserRequest.java`. `null` si no parsea. */
function parseBackendBirthDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Misma regla de `isAdult` (`utils/calculateAge.ts`), repetida a propósito — ver TSDoc de cabecera. */
function isAdult(birthDate: Date, referenceDate: Date): boolean {
  let age = referenceDate.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthdayThisYear =
    referenceDate.getUTCMonth() > birthDate.getUTCMonth() ||
    (referenceDate.getUTCMonth() === birthDate.getUTCMonth() &&
      referenceDate.getUTCDate() >= birthDate.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= LEGAL_AGE;
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
    const email = body.email?.trim().toLowerCase() ?? '';

    if (registeredEmails.includes(email)) {
      return HttpResponse.json(
        registerErrorBody(REGISTRO_CORREO_DUPLICADO, 'Ese correo ya tiene una cuenta.'),
        { status: 409 },
      );
    }

    const birthDate = body.birthDate ? parseBackendBirthDate(body.birthDate) : null;
    if (!birthDate || !isAdult(birthDate, new Date())) {
      return HttpResponse.json(
        registerErrorBody(REGISTRO_FECHA_NACIMIENTO_INVALIDA, 'Debes ser mayor de edad.'),
        { status: 422 },
      );
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
];
