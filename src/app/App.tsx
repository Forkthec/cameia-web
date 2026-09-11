/**
 * Raíz de la aplicación: monta los providers globales (`AppProviders`) y
 * el router (`RouterProvider`). No declara rutas ni providers propios —
 * ambos viven en `./providers` y en `./router`; este componente solo los
 * compone.
 */
import { RouterProvider } from 'react-router';
import { router } from './router';
import { AppProviders } from './providers/AppProviders';

export function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
