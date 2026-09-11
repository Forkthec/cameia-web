/**
 * Sincroniza `onAuthStateChanged` de Firebase (services/firebase/auth.service.ts)
 * con `stores/auth.store.ts`. No bloquea el render de `children`: mientras se
 * resuelve el primer estado, `auth.store.isLoading` sigue en `true` y quien lo
 * consume (p. ej. `RequireAuth`) decide qué mostrar mientras tanto.
 */
import { getIdTokenResult } from 'firebase/auth';
import { useEffect, type ReactNode } from 'react';
import { onAuthStateChanged } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/auth.store';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      if (!user) {
        useAuthStore.getState().clear();
        return;
      }

      void getIdTokenResult(user).then((tokenResult) => {
        // PROVISIONAL — pendiente de contrato del backend: nombre y forma del
        // custom claim de plan todavía no está publicado en ningún OpenAPI.
        const plan = typeof tokenResult.claims.plan === 'string' ? tokenResult.claims.plan : null;
        useAuthStore
          .getState()
          .setUser({ uid: user.uid, email: user.email, displayName: user.displayName }, plan);
      });
    });

    return unsubscribe;
  }, []);

  return children;
}
