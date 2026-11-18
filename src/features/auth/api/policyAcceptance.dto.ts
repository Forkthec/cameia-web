/**
 * Contrato de Cuentas para la aceptación de la política (CM-367, PR #94 de
 * cameia-cuentas): `policyAcceptance` dentro de `GET /api/v1/users/me` y el
 * cuerpo de `POST /api/v1/users/me/policy-acceptance`.
 */

/** `PolicyAcceptanceResponse.java`: `acceptedVersion` es `sin-aceptar` si nunca aceptó una. */
export interface PolicyAcceptanceDto {
  acceptedVersion: string;
  acceptedAt: string | null;
  currentVersion: string;
}

/** Lo que este flujo lee de `CurrentAccountResponse.java`; el resto de campos no se usa aquí. */
export interface CurrentAccountDto {
  policyAcceptance: PolicyAcceptanceDto;
}

export interface PolicyAcceptanceRequestDto {
  policyVersion: string;
}
