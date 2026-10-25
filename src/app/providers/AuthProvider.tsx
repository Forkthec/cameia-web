/**
 * Sincroniza `onAuthStateChanged` de Firebase (services/firebase/auth.service.ts)
 * con `stores/auth.store.ts`. No bloquea el render de `children`: mientras se
 * resuelve el primer estado, `auth.store.isLoading` sigue en `true` y quien lo
 * consume (p. ej. `RequireAuth`) decide qué mostrar mientras tanto.
 *
 * Cuando Firebase reporta que no hay usuario también borra
 * `lastUsedProfileId` (`CA-1.8.3`, CM-243): es el punto común de logout, 401
 * y sesión vencida, así que ninguna cuenta hereda el perfil de la anterior.
 *
 * **Sesión cerrada en otro dispositivo (CA-1.8.9, CM-337).** Al recargar,
 * Firebase restaura el usuario con el token guardado, que sirve hasta una
 * hora aunque «Cerrar sesión» ya haya revocado la sesión en otro dispositivo
 * (CM-331). Por eso, solo al restaurar una sesión guardada, se pide un token
 * nuevo: si Firebase responde que la sesión fue revocada, se cierra y se va a
 * «Iniciar sesión» con «Tu sesión expiró. Inicia sesión de nuevo.». Sin red
 * se sigue con el token guardado; el backend responde 401 cuando haga falta.
 */
import { getIdTokenResult, type IdTokenResult, type User } from 'firebase/auth';
import { useEffect, type ReactNode } from 'react';
import { ROUTES } from '@/app/router/routes';
import { onAuthStateChanged, signOut } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';

/** Códigos de Firebase que indican una sesión revocada o inválida, no un fallo de red. */
const REVOKED_SESSION_CODES = new Set([
  'auth/user-token-expired',
  'auth/invalid-user-token',
  'auth/user-disabled',
]);

function isRevokedSession(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && REVOKED_SESSION_CODES.has(code);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    let version = 0;
    // El primer aviso de Firebase con usuario es una sesión guardada que se
    // restaura (recarga); los siguientes vienen de iniciar sesión aquí mismo.
    let isFirstEvent = true;

    const unsubscribe = onAuthStateChanged((user) => {
      const thisVersion = ++version;
      const isRestoring = isFirstEvent;
      isFirstEvent = false;

      if (!user) {
        useAuthStore.getState().clear();
        // CA-1.8.3: este listener es el embudo común de las tres formas de
        // perder la sesión (logout, 401 de httpClient, sesión vencida), y el
        // único sitio desde el que el 401 puede llegar a este store sin que
        // `services` importe de `stores`.
        useUiPreferencesStore.getState().setLastUsedProfileId(null);
        return;
      }

      const applyToken = (tokenResult: IdTokenResult) => {
        // Si onAuthStateChanged volvió a dispararse (p. ej. signOut inmediato
        // tras signIn de un correo no verificado, CM-180), este resultado ya
        // es obsoleto y aplicarlo re-pondría isAuthenticated en true.
        if (thisVersion !== version) return;

        // DF-003/DF-006: si el correo no está verificado, cerramos la sesión
        // de Firebase y limpiamos el store para que isLoading pase a false y
        // RequireAuth redirija a /ingresar en vez de mostrar «Cargando…» sin fin.
        if (!user.emailVerified) {
          void signOut();
          return;
        }

        // PROVISIONAL — pendiente de contrato del backend: nombre y forma del
        // custom claim de plan todavía no está publicado en ningún OpenAPI.
        const plan = typeof tokenResult.claims.plan === 'string' ? tokenResult.claims.plan : null;
        useAuthStore.getState().setUser(
          {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified,
          },
          plan,
        );
      };

      void readToken(user, isRestoring).then((tokenResult) => {
        if (tokenResult) applyToken(tokenResult);
      });
    });

    /** Lee el token; al restaurar, pide uno nuevo para notar una sesión revocada. */
    async function readToken(user: User, forceRefresh: boolean): Promise<IdTokenResult | null> {
      try {
        return await getIdTokenResult(user, forceRefresh);
      } catch (error) {
        if (forceRefresh && isRevokedSession(error)) {
          await signOut();
          window.location.replace(`${ROUTES.ingresar}?sesionExpirada=1`);
          return null;
        }
        if (forceRefresh) return getIdTokenResult(user);
        throw error;
      }
    }

    return unsubscribe;
  }, []);

  return children;
}
