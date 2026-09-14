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
  /** Guarda la sesión ya resuelta. Pensado para llamarse desde `onAuthStateChanged`. */
  setUser: (user: AuthUser, plan: string | null) => void;
  /** Limpia la sesión: logout explícito, o un 401 del backend en httpClient. */
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  plan: null,
  setUser: (user, plan) => set({ user, plan, isAuthenticated: true, isLoading: false }),
  clear: () => set({ user: null, plan: null, isAuthenticated: false, isLoading: false }),
}));
