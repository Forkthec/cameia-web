/**
 * `/verificar-correo` · HU-1.2 / CM-180. Recibe el `oobCode` de Firebase por
 * query param y aplica la verificación del correo electrónico.
 *
 * Tres estados visuales:
 * - **Verificando:** spinner mientras `applyActionCode` resuelve.
 * - **Éxito (CA-1.2.1):** mensaje de bienvenida + botón a `/ingresar`.
 * - **Error (CA-1.2.2):** enlace inválido/vencido + botón a `/ingresar`.
 *
 * Si no hay `oobCode` en la URL, muestra el estado de error directamente.
 */
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { Button } from '@/design-system/atoms/Button';
import { Spinner } from '@/design-system/atoms/Spinner';
import { Icon } from '@/design-system/icons/Icon';
import { AlertInline } from '@/design-system/molecules/AlertInline';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useVerifyEmail } from '../hooks/useVerifyEmail';

export function VerifyEmailPage() {
  const { t } = useTranslation('auth');
  const { status } = useVerifyEmail();
  const navigate = useNavigate();

  function goToLogin() {
    void navigate(ROUTES.ingresar);
  }

  return (
    <AuthLayout>
      <div className="gap-space-5 flex flex-col items-center text-center">
        <Icon name="mail" size={48} className="text-action-primary" />
        <h1 className="text-h1 font-display text-text-primary">{t('verificacion.titulo')}</h1>

        {status === 'verifying' ? (
          <Spinner size={32} label={t('verificacion.verificando')} hideLabel={false} />
        ) : null}

        {status === 'success' ? (
          <>
            <AlertInline variant="success">{t('verificacion.exito.titular')}</AlertInline>
            <p className="text-body text-text-secondary">{t('verificacion.exito.mensaje')}</p>
            <Button size="lg" className="w-full" onClick={goToLogin}>
              {t('verificacion.exito.cta')}
            </Button>
          </>
        ) : null}

        {status === 'error' || status === 'idle' ? (
          <>
            <AlertInline variant="warning">{t('verificacion.error.titular')}</AlertInline>
            <p className="text-body text-text-secondary">{t('verificacion.error.mensaje')}</p>
            <Button size="lg" className="w-full" onClick={goToLogin}>
              {t('verificacion.error.cta')}
            </Button>
          </>
        ) : null}
      </div>
    </AuthLayout>
  );
}
