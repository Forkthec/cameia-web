/** Ruta catch-all (`path: '*'`) de `app/router/index.tsx`. */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { EmptyState } from '@/design-system/molecules/EmptyState';
import { ROUTES } from './routes';

export function NotFoundPage() {
  const { t } = useTranslation(['errors', 'common']);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center justify-center">
      <EmptyState
        title={t('errors:NOT_FOUND')}
        actionLabel={t('common:acciones.volverInicio')}
        onAction={() => {
          void navigate(ROUTES.landing);
        }}
      />
    </div>
  );
}
