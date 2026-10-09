/**
 * Estado de cliente del usuario autenticado (CLAUDE.md §3.6: los datos de
 * servidor viven en TanStack Query, Zustand es solo para estado de cliente
 * como la sesión de auth). Este store no importa Firebase ni sabe de
 * `onAuthStateChanged`: quien cablee ese listener (todavía no existe,
 * `app/providers/` es de un prompt posterior) llama a `setUser`/`clear` con
 * lo que ya resolvió.
 *
 * El ID Token de Firebase NUNCA se guarda aquí a propósito: es de corta
 * duración y se refresca solo, así que `httpClient` se lo vuelve a pedir al
 * SDK (`getIdToken()`) en cada petición en vez de leer uno potencialmente
 * vencido desde este store.
 */
import { create } from 'zustand';

/**
 * Recorte del `User` de Firebase con los únicos campos que la UI necesita
 * mostrar (nombre, correo). El resto del objeto de Firebase (proveedor,
 * metadata de tokens, etc.) no tiene por qué viajar por el estado global.
 */
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  /**
   * `userCredential.user.emailVerified` de Firebase. HU-1.3/CM-40 solo lo
   * persiste para consumo futuro (CA-1.3.1) — el banner de correo sin
   * verificar que ese criterio exige no se renderiza todavía en ninguna
   * pantalla (Bloqueo B-03 de `features/auth/SPEC.md`).
   */
  emailVerified: boolean;
}

interface AuthState {
  /** `null` mientras no hay sesión resuelta o el usuario cerró sesión. */
  user: AuthUser | null;
  /**
   * `true` solo hasta que se resuelve el primer estado de auth al arrancar
   * la app. Evita, por ejemplo, mandar a /ingresar antes de saber si en
   * realidad ya hay una sesión activa.
   */
  isLoading: boolean;
  isAuthenticated: boolean;
  /**
   * Plan del usuario, tal como llega en los custom claims del ID Token.
   * CLAUDE.md §3.7: ninguna constante de negocio se hardcodea — el catálogo
   * de planes lo define el backend, no este store.
   */
  plan: string | null;
  /**
   * Correo del usuario que intentó ingresar sin verificar (CA-1.3.7, CM-180).
   * Vive en el store global porque `useLogin` necesita que sobreviva al
   * remount que causa el ciclo `signIn` → `onAuthStateChanged` → redirect →
   * `signOut` → redirect back.
   */
  unverifiedEmail: string | null;
  /** Indica que el correo de verificación se reenvió exitosamente (CM-180). */
  verificationResent: boolean;
  /** Guarda la sesión ya resuelta. Pensado para llamarse desde `onAuthStateChanged`. */
  setUser: (user: AuthUser, plan: string | null) => void;
  /** Limpia la sesión: logout explícito, o un 401 del backend en httpClient. */
  clear: () => void;
  /** Marca que un usuario intentó ingresar sin verificar su correo. */
  setUnverifiedEmail: (email: string | null) => void;
  setVerificationResent: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  plan: null,
  unverifiedEmail: null,
  verificationResent: false,
  setUser: (user, plan) => set({ user, plan, isAuthenticated: true, isLoading: false }),
  clear: () => set({ user: null, plan: null, isAuthenticated: false, isLoading: false }),
  setUnverifiedEmail: (email) => set({ unverifiedEmail: email, verificationResent: false }),
  setVerificationResent: (value) => set({ verificationResent: value }),
}));
