/**
 * Envoltorio de Firebase Authentication. El texto de error del SDK NUNCA se
 * muestra al usuario: cada código `auth/*` se traduce a un código propio de
 * CAMEIA (mismo principio que ApiError — un código estable, no el mensaje
 * crudo, es lo que el resto de la app puede usar como llave de i18n).
 *
 * En local (`VITE_APP_ENV=local`) se conecta al emulador de Firebase Auth
 * (CM-188) en vez de al proyecto real — mismo mecanismo que ya usan
 * `cameia-gateway` y `cameia-cuentas`, para desarrollar sin credenciales de un
 * proyecto de Firebase real. `VITE_FIREBASE_AUTH_EMULATOR_HOST` es opcional:
 * si no se define, se usa `localhost:9099`.
 */
import {
  applyActionCode as firebaseApplyActionCode,
  connectAuthEmulator,
  getAuth,
  getIdToken as getFirebaseIdToken,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  sendEmailVerification as sendFirebaseEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { env } from '@/config/env';
import { firebaseApp } from './firebaseApp';

/** Host del emulador de Firebase Auth cuando no se configura uno (puerto publicado por cameia-gateway). */
export const DEFAULT_AUTH_EMULATOR_HOST = 'localhost:9099';

/**
 * El emulador se usa si y solo si `VITE_APP_ENV === 'local'` (regla del PR #61) — nunca en
 * staging ni production, aunque exista un host configurado. Función pura y exportada para
 * probarla sin reimportar el módulo (la conexión real ocurre una sola vez, más abajo).
 */
export function shouldUseAuthEmulator(appEnv: string): boolean {
  return appEnv === 'local';
}

/** Host `host:puerto` del emulador: el configurado, o {@link DEFAULT_AUTH_EMULATOR_HOST} si falta o está vacío. */
export function resolveAuthEmulatorHost(configuredHost: string | undefined): string {
  return configuredHost?.trim() || DEFAULT_AUTH_EMULATOR_HOST;
}

/** URL del emulador a la que conectar, o `undefined` si el entorno no debe usarlo. */
export function getAuthEmulatorUrl(
  appEnv: string,
  configuredHost: string | undefined,
): string | undefined {
  return shouldUseAuthEmulator(appEnv)
    ? `http://${resolveAuthEmulatorHost(configuredHost)}`
    : undefined;
}

const auth = getAuth(firebaseApp);

// `disableWarnings` evita el aviso del SDK en consola en cada arranque de la app en desarrollo.
const authEmulatorUrl = getAuthEmulatorUrl(env.appEnv, env.firebase.authEmulatorHost);
if (authEmulatorUrl) {
  connectAuthEmulator(auth, authEmulatorUrl, { disableWarnings: true });
}

const DEFAULT_AUTH_ERROR_CODE = 'AUTH_UNKNOWN_ERROR';

/**
 * Solo cubre los códigos que `signIn()` puede lanzar de verdad (CA-1.3.1/
 * CA-1.3.2). El registro (`CM-34`) ya no crea la credencial en el cliente
 * (`ADR-0006`: `POST /api/v1/users` sin sesión, el backend llama a
 * `createUser` del Admin SDK) — los códigos de `createUserWithEmailAndPassword`
 * (`auth/email-already-in-use`, `auth/invalid-email`, `auth/weak-password`)
 * se retiraron con `signUp()`, sin consumidor desde entonces.
 */
const FIREBASE_ERROR_CODE_MAP: Record<string, string> = {
  // user-not-found/wrong-password/invalid-credential se mapean al mismo
  // código a propósito: no hay que revelar cuál de los dos datos es el
  // incorrecto.
  'auth/user-not-found': 'AUTH_INVALID_CREDENTIALS',
  'auth/wrong-password': 'AUTH_INVALID_CREDENTIALS',
  'auth/invalid-credential': 'AUTH_INVALID_CREDENTIALS',
  'auth/too-many-requests': 'AUTH_TOO_MANY_REQUESTS',
  'auth/network-request-failed': 'AUTH_NETWORK_ERROR',
  'auth/user-disabled': 'AUTH_USER_DISABLED',
  'auth/invalid-action-code': 'AUTH_INVALID_ACTION_CODE',
  'auth/expired-action-code': 'AUTH_EXPIRED_ACTION_CODE',
};

/** Error tipado con un código de CAMEIA — nunca con el mensaje del SDK de Firebase. */
export class AuthError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = 'AuthError';
    this.code = code;
  }
}

function isFirebaseAuthError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
  );
}

function toAuthError(error: unknown): AuthError {
  const firebaseCode = isFirebaseAuthError(error) ? error.code : undefined;
  const code = firebaseCode
    ? (FIREBASE_ERROR_CODE_MAP[firebaseCode] ?? DEFAULT_AUTH_ERROR_CODE)
    : DEFAULT_AUTH_ERROR_CODE;
  return new AuthError(code);
}

export async function signIn(email: string, password: string): Promise<User> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    throw toAuthError(error);
  }
}

/** Envuelto en `AuthError` igual que `signIn()` (`CM-194`, corrige una inconsistencia real del archivo). */
export async function signOut(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw toAuthError(error);
  }
}

/** Envía el correo de verificación (`CM-34`, `ADR-0006`) — no pasa por el Gateway, directo contra Firebase. */
export async function sendEmailVerification(user: User): Promise<void> {
  try {
    await sendFirebaseEmailVerification(user);
  } catch (error) {
    throw toAuthError(error);
  }
}

/** `null` cuando no hay sesión activa; httpClient lo usa para decidir si adjunta Authorization. */
export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return getFirebaseIdToken(user);
}

export function onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
  return onFirebaseAuthStateChanged(auth, callback);
}

/** Aplica un código de acción de Firebase (verificación de correo, CM-180). */
export async function applyActionCode(oobCode: string): Promise<void> {
  try {
    await firebaseApplyActionCode(auth, oobCode);
  } catch (error) {
    throw toAuthError(error);
  }
}
