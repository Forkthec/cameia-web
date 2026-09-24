/**
 * Envoltorio de Firebase Authentication. El texto de error del SDK NUNCA se
 * muestra al usuario: cada código `auth/*` se traduce a un código propio de
 * CAMEIA (mismo principio que ApiError — un código estable, no el mensaje
 * crudo, es lo que el resto de la app puede usar como llave de i18n).
 */
import {
  getAuth,
  getIdToken as getFirebaseIdToken,
  onAuthStateChanged as onFirebaseAuthStateChanged,
  sendEmailVerification as sendFirebaseEmailVerification,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type Unsubscribe,
  type User,
} from 'firebase/auth';
import { firebaseApp } from './firebaseApp';

const auth = getAuth(firebaseApp);

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
