/**
 * Muestra el aviso de política nueva sobre el área autenticada cuando la
 * versión aceptada no es la vigente (CM-365, criterio 5). Une el hook con el
 * diálogo y traduce los textos; `AuthenticatedAppShell` lo monta una vez.
 */
import { useTranslation } from 'react-i18next';
import { ROUTES } from '@/app/router/routes';
import { useAuthStore } from '@/stores/auth.store';
import { useLogout } from '../../hooks/useLogout';
import { usePolicyAcceptance } from '../../hooks/usePolicyAcceptance';
import { PolicyConsentLabel } from '../PolicyConsentLabel';
import { PolicyUpdateDialog } from '../PolicyUpdateDialog';

export function PolicyAcceptanceGate() {
  const { t } = useTranslation(['auth', 'legal', 'errors', 'common']);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const policy = usePolicyAcceptance(isAuthenticated);
  const { logout, isLoggingOut } = useLogout();

  if (!policy.needsAcceptance) return null;

  const errorMessage =
    policy.error === 'cambio'
      ? t('auth:registro.politica.cambio')
      : policy.error
        ? t(`errors:${policy.error}`)
        : undefined;

  return (
    <PolicyUpdateDialog
      title={t('legal:documentos.politicaDatos.titulo')}
      acceptLabel={<PolicyConsentLabel />}
      requiredMessage={t('auth:registro.politica.requerida')}
      confirmLabel={t('auth:politicaNueva.aceptar')}
      confirmingLabel={t('common:estados.cargando')}
      linksLabel={t('auth:registro.politica.enlaces')}
      links={[
        { label: t('legal:documentos.politicaDatos.titulo'), to: ROUTES.politicaDatos },
        { label: t('legal:documentos.avisoPrivacidad.titulo'), to: ROUTES.avisoPrivacidad },
        { label: t('legal:documentos.terminos.titulo'), to: ROUTES.terminos },
      ]}
      isAccepting={policy.isAccepting}
      errorMessage={errorMessage}
      onAccept={policy.accept}
      logoutLabel={
        isLoggingOut ? t('auth:politicaNueva.cerrandoSesion') : t('auth:politicaNueva.cerrarSesion')
      }
      onLogout={() => void logout()}
    />
  );
}
