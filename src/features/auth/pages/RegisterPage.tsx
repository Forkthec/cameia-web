/**
 * `/registro` · HU-1.1 / CM-34 / `PRT-01.01`. Compone `AuthLayout` (mismo
 * `headline` que ya usa Login, `ingreso.marca.titular` — SPEC.md §3
 * Registro) + `RegisterForm` + el `Modal` de confirmación de Plan Gratis.
 * Única pieza de la feature que llama `useTranslation`/`useRegister`;
 * `RegisterForm` es puramente presentacional (ver su TSDoc de cabecera).
 *
 * Traduce `errorInfo` de `useRegister` (`ADR-0007`: `httpStatus` + `field`,
 * ya no un `code` propio) a la llave de `auth.json`/`errors.json` que le
 * corresponde a cada combinación conocida — correo duplicado (409) y
 * fecha de nacimiento (422, `field: 'birthDate'`) reutilizan el mismo
 * tratamiento visual que ya tenía cada campo; cualquier otra combinación
 * cae al mensaje genérico (`errors:generico`) o al de red (`errors:red`,
 * `httpStatus: 0`).
 */
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/layouts/AuthLayout';
import { Modal } from '@/design-system/organisms/Modal';
import { PRONOUNS } from '../model/pronouns';
import { useRegister } from '../hooks/useRegister';
import { RegisterForm } from '../organisms/RegisterForm';

export function RegisterPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const { isSubmitting, isSuccessModalOpen, errorInfo, register, closeSuccessModal } =
    useRegister();

  const isDuplicateEmail = errorInfo?.httpStatus === 409;
  const isBirthDateRejected = errorInfo?.httpStatus === 422 && errorInfo.field === 'birthDate';
  const isPasswordRejected = errorInfo?.httpStatus === 422 && errorInfo.field === 'password';

  const duplicateEmailErrorMessage = isDuplicateEmail
    ? t('registro.correoDuplicado.mensaje')
    : undefined;
  const contrasenaServerErrorMessage = isPasswordRejected
    ? t('registro.errores.contrasenaGenerica')
    : undefined;
  const genericErrorMessage =
    errorInfo && !isDuplicateEmail && !isBirthDateRejected && !isPasswordRejected
      ? errorInfo.httpStatus === 0
        ? t('errors:red')
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
        birthDateRejectedByServer={isBirthDateRejected}
        correoLabel={t('registro.campos.correo')}
        correoPlaceholder={t('ingreso.correoPlaceholder')}
        correoErrorRequired={t('registro.errores.correoRequerido')}
        correoErrorInvalid={t('registro.errores.correoInvalido')}
        duplicateEmailErrorMessage={duplicateEmailErrorMessage}
        duplicateEmailLoginLabel={t('registro.correoDuplicado.iniciarSesion')}
        duplicateEmailRecoverLabel={t('registro.correoDuplicado.recuperarContrasena')}
        celularPaisLabel={t('registro.celular.pais')}
        celularBuscarPaisLabel={t('registro.celular.buscarPais')}
        celularSinResultadosLabel={t('registro.celular.sinResultados')}
        celularNumeroLabel={t('registro.celular.numero')}
        celularNumeroPlaceholder={t('registro.celular.numeroPlaceholder')}
        celularAyuda={t('registro.celular.ayuda')}
        celularErrorInvalido={t('registro.celular.errorInvalido')}
        contrasenaLabel={t('registro.campos.contrasena')}
        contrasenaPlaceholder={t('ingreso.contrasenaPlaceholder')}
        contrasenaErrorMuyCorta={t('registro.errores.contrasenaMuyCorta')}
        contrasenaErrorMuyLarga={t('registro.errores.contrasenaMuyLarga')}
        contrasenaErrorComun={t('registro.errores.contrasenaComun')}
        contrasenaServerErrorMessage={contrasenaServerErrorMessage}
        contrasenaFuerzaDebil={t('registro.fuerzaContrasena.weak')}
        contrasenaFuerzaAceptable={t('registro.fuerzaContrasena.fair')}
        contrasenaFuerzaBuena={t('registro.fuerzaContrasena.good')}
        contrasenaFuerzaFuerte={t('registro.fuerzaContrasena.strong')}
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
