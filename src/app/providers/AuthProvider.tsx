/**
 * Sincroniza `onAuthStateChanged` de Firebase (services/firebase/auth.service.ts)
 * con `stores/auth.store.ts`. No bloquea el render de `children`: mientras se
 * resuelve el primer estado, `auth.store.isLoading` sigue en `true` y quien lo
 * consume (p. ej. `RequireAuth`) decide qué mostrar mientras tanto.
 *
 * Cuando Firebase reporta que no hay usuario también borra
 * `lastUsedProfileId` (`CA-1.8.3`, CM-243): es el punto común de logout, 401
 * y sesión vencida, así que ninguna cuenta hereda el perfil de la anterior.
 */
import { getIdTokenResult } from 'firebase/auth';
import { useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    let version = 0;

    const unsubscribe = onAuthStateChanged((user) => {
      const thisVersion = ++version;

      if (!user) {
        useAuthStore.getState().clear();
        // CA-1.8.3: este listener es el embudo común de las tres formas de
        // perder la sesión (logout, 401 de httpClient, sesión vencida), y el
        // único sitio desde el que el 401 puede llegar a este store sin que
        // `services` importe de `stores`.
        useUiPreferencesStore.getState().setLastUsedProfileId(null);
        return;
      }

      void getIdTokenResult(user).then((tokenResult) => {
        // Si onAuthStateChanged volvió a dispararse (p. ej. signOut inmediato
        // tras signIn de un correo no verificado, CM-180), este resultado ya
        // es obsoleto y aplicarlo re-pondría isAuthenticated en true.
        if (thisVersion !== version) return;

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
      });
    });

    return unsubscribe;
  }, []);

  return children;
}
