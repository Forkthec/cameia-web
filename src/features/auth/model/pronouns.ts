/**
 * Catálogo de pronombres del formulario de Registro (`HU-1.1`/`CM-34`).
 * Coincide con el enum real del backend `tech.cameia.cuentas.domain.model.Pronoun`
 * (confirmado 19-sep-2026, ver `SPEC.md` §8, B-09 resuelto) — no es una
 * invención de UI. Obligatorio solo como regla de **cliente**: el campo
 * `pronoun` del backend no lleva `@NotNull`.
 */
export const PRONOUNS = ['HE', 'SHE', 'THEY'] as const;

export type Pronoun = (typeof PRONOUNS)[number];
