/**
 * Tipos de dominio del Perfil Profesional. Nacieron acotados a Información
 * General (CM-53); CM-61 agrega Formación académica y Experiencia Laboral
 * (HU-2.4); CM-65 agrega Habilidades (HU-2.5) y una referencia de solo
 * lectura a Roles Objetivo (necesaria para verificar el 5º requisito de
 * finalización, sin construir su gestión — eso es CM-69, rama independiente
 * en paralelo, ver TSDoc de `Profile.targetRoles` más abajo).
 *
 * `SummaryProvenance` incluye `AI_SUGGESTED`, que en Sprint 1 es
 * inalcanzable desde la interfaz (nace de HU-2.6–2.10, Sprint 2): se modela
 * igual porque CA-2.3.2 exige que el sistema sepa distinguirlo de
 * `AI_EDITED` cuando exista, y porque `src/mocks/handlers/profiles.handlers.ts`
 * ya lo produce internamente para las pruebas de esa regla (SPEC.md §2).
 *
 * `EducationLevel` y `EmploymentStatus` son literales, no un archivo de
 * catálogo aparte: a diferencia de los roles profesionales (HU-2.11, un
 * catálogo real de backend), estos dos son enumerados fijos de dominio —
 * confirmados contra el código real de `cameia-perfil`
 * (`EducationLevel.java`, `EmploymentStatus.java`), no inventados.
 * `YearMonth` documenta el formato real del backend (`java.time.YearMonth`,
 * `"YYYY-MM"`, sin día) para que quien lo use no lo confunda con una fecha
 * completa — la conversión vive en `model/yearMonth.ts` (bloqueo C-14).
 *
 * `SkillLevel` = `BASIC`/`INTERMEDIATE`/`ADVANCED`, confirmado por el memo
 * del PO del 13-sep (C-06) y por el código real de `ProfileController.java`
 * (parámetros de `AddSkillCommand`), compartidos en la sesión que construyó
 * CM-65 — no un valor inventado.
 */
export type ProfileStatus = 'IN_PROGRESS' | 'COMPLETED';

export type SummaryProvenance = 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;

/** Procedencia de un dato del perfil (backend real: `DataProvenance.java`). A diferencia de `SummaryProvenance`, nunca es nula: todo ítem de experiencia/educación la lleva. */
export type DataProvenance = 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED';

/** Año y mes, formato `"YYYY-MM"` — así almacena el backend real las fechas de experiencia y educación (`java.time.YearMonth`, sin día). Ver `model/yearMonth.ts`. */
export type YearMonth = string;

/** Backend real: `EducationLevel.java`. Colombia no distingue "tecnólogo" en este enumerado — bloqueo C-07 de `docs/GLOSSARY.md` §6, ya confirmado en el código aunque el texto en español siga pendiente. */
export type EducationLevel = 'TECHNICAL' | 'UNDERGRADUATE' | 'POSTGRADUATE';

/**
 * Backend real: `EmploymentStatus.java`. Nunca se muestra al usuario — en
 * Figma son dos checkboxes ("Trabajo aquí actualmente" / "No recuerdo la
 * fecha exacta de finalización"), mutuamente excluyentes, que
 * `profile.mapper.ts` traduce a este enumerado al enviar (SPEC.md §9,
 * decisión D-F).
 */
export type EmploymentStatus = 'CURRENT' | 'UNKNOWN_END' | 'ENDED';

/** Formación académica ya persistida (HU-2.4). `fieldOfStudy` y `startDate` los exige el contrato real aunque Figma no los dibuje — bloqueo C-12 de `SPEC.md` §8. */
export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  level: EducationLevel;
  startDate: YearMonth;
  /** `null` cuando `inProgress` es `true` (regla de dominio: `Education.java`). */
  endDate: YearMonth | null;
  inProgress: boolean;
  provenance: DataProvenance;
}

/** Experiencia laboral ya persistida (HU-2.4). `description` puede ser `null` (campo opcional del frame). */
export interface WorkExperienceItem {
  id: string;
  company: string;
  position: string;
  description: string | null;
  startDate: YearMonth;
  /** `null` cuando `employmentStatus` es `CURRENT` o `UNKNOWN_END` (regla de dominio: `WorkExperience.java`). */
  endDate: YearMonth | null;
  employmentStatus: EmploymentStatus;
  provenance: DataProvenance;
}

export type SkillLevel = 'BASIC' | 'INTERMEDIATE' | 'ADVANCED';

/** Habilidad ya persistida (HU-2.5). `skillName` es texto libre, sin catálogo — a diferencia de Rol Objetivo (HU-2.11). */
export interface SkillItem {
  id: string;
  skillName: string;
  level: SkillLevel;
  provenance: DataProvenance;
}

/**
 * Rol objetivo ya asociado al perfil (HU-2.11). Modelado igual que en
 * CM-69 (rama independiente en paralelo, `ProfileController.java`): CM-65
 * solo necesita contar `targetRoles.length` para el 5º requisito de
 * finalización y no construye su gestión (agregar/sustituir/eliminar) —
 * eso es exclusivamente CM-69. Se modela con la forma real del backend, no
 * con un `string[]` simplificado, para que ambas ramas coincidan en este
 * campo al fusionarse.
 */
export interface TargetRoleItem {
  id: string;
  professionalRoleId: string;
  provenance: DataProvenance;
}

export interface Profile {
  id: string;
  status: ProfileStatus;
  name: string;
  summary: string;
  summaryProvenance: SummaryProvenance;
  education: EducationItem[];
  workExperience: WorkExperienceItem[];
  skills: SkillItem[];
  targetRoles: TargetRoleItem[];
}
