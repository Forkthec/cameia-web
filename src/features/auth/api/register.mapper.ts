/**
 * Cortafuegos entre el formulario de Registro y `POST /api/v1/users`
 * (`ADR-0003`): si `CM-35` publica nombres de campo distintos, solo este
 * archivo cambia. Incluye la conversión de fecha que el backend exige y que
 * ningún otro flujo de la app necesitaba hasta ahora — `<input type="date">`
 * entrega ISO (`yyyy-MM-dd`), `RegisterUserRequest.java` exige
 * `dd/MM/yyyy` (`@JsonFormat`).
 */
import type { RegisterFormValues } from '../schemas/register.schema';
import type { RegisterUserRequestDto, RegisteredUserResponseDto } from './register.dto';

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
    phoneNumber: values.celular.trim() || undefined,
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
