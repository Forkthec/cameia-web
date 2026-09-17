/**
 * `/ingresar` · HU-1.3 / CM-40 / `PRT-01.03`. Compone `AuthLayout` +
 * `LoginForm`: esta página es la única pieza de la feature que llama
 * `useTranslation` y `useLogin` — `LoginForm` es puramente presentacional
 * (ver su TSDoc de cabecera).
 */
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/layouts/AuthLayout';
import { useLogin } from '../hooks/useLogin';
import { LoginForm } from '../organisms/LoginForm';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const { isSubmitting, errorMessageKey, login } = useLogin();

  return (
    <AuthLayout headline={t('ingreso.marca.titular')}>
      <LoginForm
        isSubmitting={isSubmitting}
        genericErrorMessage={errorMessageKey ? t(errorMessageKey) : undefined}
        onSubmit={(values) => void login(values.correo, values.contrasena)}
        titleText={t('ingreso.titulo')}
        googleButtonLabel={t('ingreso.google')}
        dividerLabel={t('ingreso.o')}
        correoLabel={t('ingreso.campos.correo')}
        correoPlaceholder={t('ingreso.correoPlaceholder')}
        correoErrorRequired={t('ingreso.errores.correoRequerido')}
        correoErrorInvalid={t('ingreso.errores.correoInvalido')}
        contrasenaLabel={t('ingreso.campos.contrasena')}
        contrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        contrasenaErrorRequired={t('ingreso.errores.contrasenaRequerida')}
        showPasswordLabel={t('ingreso.mostrarContrasena')}
        hidePasswordLabel={t('ingreso.ocultarContrasena')}
        forgotPasswordLabel={t('ingreso.olvideContrasena')}
        submitLabel={t('ingreso.cta')}
        submitLoadingLabel={t('ingreso.cargando')}
        footerQuestion={t('ingreso.noTengoCuenta')}
        footerCta={t('ingreso.irARegistro')}
      />
    </AuthLayout>
  );
}
