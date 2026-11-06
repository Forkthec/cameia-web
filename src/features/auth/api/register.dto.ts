// PROVISIONAL — pendiente de OpenAPI de cameia-cuentas (CM-35)
/**
 * Forma cruda de `POST /api/v1/users`. Nombres de campo confirmados
 * 19-sep-2026 contra el código real de `cameia-cuentas`
 * (`RegisterUserRequest.java`/`RegisteredUserResponse.java`) — `pronoun`
 * (singular) y `phoneNumber`, no `pronouns`/`phone` como asumía la primera
 * versión de `SPEC.md`. Sigue marcado `// PROVISIONAL` en conjunto porque
 * `CM-35` no ha cerrado el ticket ni publicado el formato de error.
 */
export interface RegisterUserRequestDto {
  firstName: string;
  lastName: string;
  /** `dd/MM/yyyy` — el backend lo declara con `@JsonFormat(pattern = "dd/MM/yyyy")`, no ISO. */
  birthDate: string;
  email: string;
  password: string;
  /** Opcional del lado del backend (sin `@NotNull`); obligatorio solo como regla de cliente. */
  pronoun?: string;
  phoneNumber?: string;
}

/** Forma exacta de `RegisteredUserResponse.java`. `status` es siempre `PENDING_VERIFICATION` al registrarse; `plan` siempre `FREE`. */
export interface RegisteredUserResponseDto {
  id: string;
  firebaseUid: string;
  status: string;
  plan: string;
}
