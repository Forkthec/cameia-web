/**
 * `/registro` · HU-1.1 / CM-34 / `PRT-01.01`. Compone `AuthLayout` (mismo
 * `headline` que ya usa Login, `ingreso.marca.titular` — SPEC.md §3
 * Registro) + `RegisterForm` + el `Modal` de confirmación de Plan Gratis.
 * Única pieza de la feature que llama `useTranslation`/`useRegister`;
 * `RegisterForm` es puramente presentacional (ver su TSDoc de cabecera).
 *
 * Traduce `errorCode` de `useRegister` con el mismo criterio que
 * `EditProfilePage` (`i18n.exists('errors:codigos.${code}')`, cayendo al
 * mensaje genérico si el código no tiene llave propia) — sin duplicar esa
 * lógica en un archivo de `model/` aparte.
 */
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Modal } from '@/design-system/organisms/Modal';
import { PRONOUNS } from '../model/pronouns';
import { useRegister } from '../hooks/useRegister';
import { RegisterForm } from '../organisms/RegisterForm';

const REGISTRO_CORREO_DUPLICADO = 'REGISTRO_CORREO_DUPLICADO';
const REGISTRO_FECHA_NACIMIENTO_INVALIDA = 'REGISTRO_FECHA_NACIMIENTO_INVALIDA';

export function RegisterPage() {
  const { t, i18n } = useTranslation(['auth', 'errors']);
  const { isSubmitting, isSuccessModalOpen, errorCode, register, closeSuccessModal } =
    useRegister();

  const duplicateEmailErrorMessage =
    errorCode === REGISTRO_CORREO_DUPLICADO
      ? t('errors:codigos.REGISTRO_CORREO_DUPLICADO')
      : undefined;
  const birthDateRejectedByServer = errorCode === REGISTRO_FECHA_NACIMIENTO_INVALIDA;
  const genericErrorMessage =
    errorCode &&
    errorCode !== REGISTRO_CORREO_DUPLICADO &&
    errorCode !== REGISTRO_FECHA_NACIMIENTO_INVALIDA
      ? i18n.exists(`errors:codigos.${errorCode}`)
        ? t(`errors:codigos.${errorCode}`)
        : t('errors:generico')
      : undefined;

  const pronombresOptions = PRONOUNS.map((codigo) => ({
    value: codigo,
    label: t(`registro.pronombres.${codigo}`),
  }));

  return (
    <AuthLayout headline={t('ingreso.marca.titular')}>
      <RegisterForm
        isSubmitting={isSubmitting}
        onSubmit={(values) => void register(values)}
        titleText={t('registro.titulo')}
        googleButtonLabel={t('ingreso.google')}
        dividerLabel={t('ingreso.o')}
        nombreLabel={t('registro.campos.nombre')}
        nombrePlaceholder={t('registro.placeholders.nombre')}
        nombreErrorRequired={t('registro.errores.nombreRequerido')}
        apellidoLabel={t('registro.campos.apellido')}
        apellidoPlaceholder={t('registro.placeholders.apellido')}
        apellidoErrorRequired={t('registro.errores.apellidoRequerido')}
        fechaNacimientoLabel={t('registro.campos.fechaNacimiento.label')}
        fechaNacimientoAyuda={t('registro.campos.fechaNacimiento.helper')}
        fechaNacimientoErrorFutura={t('registro.errores.fechaNacimientoFutura')}
        fechaNacimientoErrorImplausible={t('registro.errores.fechaNacimientoImplausible')}
        fechaNacimientoErrorFormatoInvalido={t('registro.errores.fechaNacimientoInvalida')}
        birthDateRejectedByServer={birthDateRejectedByServer}
        correoLabel={t('registro.campos.correo')}
        correoPlaceholder={t('ingreso.correoPlaceholder')}
        correoErrorRequired={t('registro.errores.correoRequerido')}
        correoErrorInvalid={t('registro.errores.correoInvalido')}
        duplicateEmailErrorMessage={duplicateEmailErrorMessage}
        duplicateEmailLoginLabel={t('registro.correoDuplicado.iniciarSesion')}
        duplicateEmailRecoverLabel={t('registro.correoDuplicado.recuperarContrasena')}
        celularLabel={t('registro.campos.celular')}
        celularPlaceholder={t('registro.placeholders.celular')}
        contrasenaLabel={t('registro.campos.contrasena')}
        contrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        contrasenaErrorRequired={t('registro.errores.contrasenaRequerida')}
        confirmarContrasenaLabel={t('registro.campos.confirmarContrasena')}
        confirmarContrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        confirmarContrasenaErrorRequired={t('registro.errores.confirmarContrasenaRequerida')}
        confirmarContrasenaErrorNoCoincide={t('registro.errores.confirmarContrasenaNoCoincide')}
        showPasswordLabel={t('ingreso.mostrarContrasena')}
        hidePasswordLabel={t('ingreso.ocultarContrasena')}
        pronombresLabel={t('registro.campos.pronombres')}
        pronombresPlaceholder={t('registro.placeholders.pronombres')}
        pronombresOptions={pronombresOptions}
        pronombresErrorRequired={t('registro.errores.pronombresRequerido')}
        genericErrorMessage={genericErrorMessage}
        submitLabel={t('registro.cta')}
        submitLoadingLabel={t('registro.cargando')}
        footerQuestion={t('registro.yaTengoCuenta')}
        footerCta={t('registro.irAIngresar')}
      />

      {isSuccessModalOpen ? (
        <Modal
          title={t('registro.modal.titulo')}
          closeLabel={t('registro.modal.cerrar')}
          primaryActionLabel={t('registro.modal.cta')}
          onPrimaryAction={closeSuccessModal}
          onClose={closeSuccessModal}
        >
          {t('registro.modal.mensaje')}
        </Modal>
      ) : null}
    </AuthLayout>
  );
}
