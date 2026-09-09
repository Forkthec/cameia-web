/**
 * `errorElement` de la ruta raíz: captura errores lanzados durante la carga o
 * el render de una ruta (react-router), no errores de render generales — eso
 * lo cubre `app/providers/RootErrorBoundary.tsx`, un boundary de React aparte.
 */
import { useTranslation } from 'react-i18next';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { EmptyState } from '@/design-system/molecules/EmptyState';

export function RouteErrorBoundary() {
  const { t } = useTranslation('errors');
  const error = useRouteError();
  const description = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : undefined;

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <EmptyState title={t('generico')} description={description} />
    </div>
  );
}
