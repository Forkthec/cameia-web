/**
 * Cortafuegos entre el formulario de Registro y `POST /api/v1/users`
 * (`ADR-0003`): si `CM-35` publica nombres de campo distintos, solo este
 * archivo cambia. Incluye la conversión de fecha que el backend exige y que
 * ningún otro flujo de la app necesitaba hasta ahora — `<input type="date">`
 * entrega ISO (`yyyy-MM-dd`), `RegisterUserRequest.java` exige
 * `dd/MM/yyyy` (`@JsonFormat`) — y la del celular a E.164 completo
 * (`+<indicativo><nacional>`) vía `libphonenumber-js`, nunca concatenación
 * manual: el número nacional puede necesitar normalización propia del país
 * (ceros iniciales, etc.) que solo la librería conoce.
 */
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import type { RegisterFormValues } from '../schemas/register.schema';
import type { RegisterUserRequestDto, RegisteredUserResponseDto } from './register.dto';

/** `undefined` si el número nacional está vacío (celular es opcional, CA-1.1.1) o no parsea. */
function toBackendPhoneNumber(celular: RegisterFormValues['celular']): string | undefined {
  if (celular.numeroNacional.length === 0) return undefined;
  const parsed = parsePhoneNumberFromString(celular.numeroNacional, celular.paisIso as CountryCode);
  return parsed?.number;
}

/** Modelo de UI de la cuenta recién creada — lo que `useRegister` necesita para seguir el flujo, nada del resto del DTO. */
export interface RegisteredAccount {
  id: string;
  firebaseUid: string;
  status: string;
  plan: string;
}

/** `yyyy-MM-dd` (ISO, de `<input type="date">`) → `dd/MM/yyyy` (lo que exige el backend). */
function toBackendBirthDate(isoDate: string): string {
  const [year, month, day] = isoDate.trim().split('-');
  return `${day}/${month}/${year}`;
}

export function toRegisterUserRequest(values: RegisterFormValues): RegisterUserRequestDto {
  return {
    firstName: values.nombre.trim(),
    lastName: values.apellido.trim(),
    birthDate: toBackendBirthDate(values.fechaNacimiento),
    email: values.correo.trim(),
    password: values.contrasena,
    pronoun: values.pronombres || undefined,
    phoneNumber: toBackendPhoneNumber(values.celular),
  };
}

export function toRegisteredAccount(dto: RegisteredUserResponseDto): RegisteredAccount {
  return {
    id: dto.id,
    firebaseUid: dto.firebaseUid,
    status: dto.status,
    plan: dto.plan,
  };
}
