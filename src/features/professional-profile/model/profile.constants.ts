/**
 * Límites de caracteres y otras constantes de negocio del Formulario de
 * Perfil Profesional. Citadas desde los schemas de validación y desde
 * `CharacterCounter` — nunca repetidas como número suelto en otro archivo
 * (CLAUDE.md §7, ninguna constante de negocio se hardcodea sin origen).
 *
 * `NAME_MAX_LENGTH` es 255, confirmado por la respuesta oficial del PO del
 * 13-sep (`docs/decisiones/13092026_v1_respuesta-oficial-frontend-C01-C09.md`
 * C-01): fuente única es el código/OpenAPI de MicroPerfilPro, ya reflejado en
 * el backlog corregido `13092026_01_Backlog.xlsx`. Cierra el bloqueo C-01 de
 * `SPEC.md` §8, que fijaba 120 mientras la cifra de 255 no tenía fuente
 * documentable.
 *
 * `SUMMARY_MAX_LENGTH` viene de `docs/GLOSSARY.md` §2, respaldado también
 * por HU-2.5 (backlog 12-sep) y por el memo del PO del 11-sep (línea 155):
 * a diferencia de `name`, este cambio sí llegó al backlog vigente.
 *
 * `DESCRIPTION_MAX_LENGTH` (CM-61) viene del backend real:
 * `WorkExperience.MAX_TEXT_LENGTH` en `cameia-perfil` (código fuente, no un
 * memo). Figma dibuja un contador "0 / 1000 caracteres" en la sección de
 * Experiencia Laboral — se usa 500 porque el backend rechaza cualquier
 * `description` más larga con un 422; documentado como bloqueo C-13 de
 * `SPEC.md` §8, mismo criterio que ya aplicó C-11 (contador 600 vs 2000 de
 * GeneralInfoForm): el contrato real manda sobre el número que dibuja Figma.
 *
 * `EDUCATION_LEVELS` y `MANUAL_PROVENANCE` son los valores literales del
 * contrato real (`EducationLevel.java`, `DataProvenance.java`), no un
 * catálogo consultado por HTTP — a diferencia de los roles profesionales
 * (HU-2.11), que sí vienen de un endpoint.
 *
 * `PROFILE_COMPLETENESS_MAX` son los 5 requisitos reales de finalización
 * (HU-2.5): nombre, resumen, ≥1 educación, ≥1 habilidad, ≥1 rol objetivo.
 * CM-61 solo puede calcular 3; se fija en 5 desde ya para que la fracción de
 * la barra de completitud ("3 de 5") no mienta sobre cuánto falta cuando
 * CM-65/CM-69 sumen los otros dos (SPEC.md §9, decisión D-D).
 *
 * `DESKTOP_MEDIA_QUERY` duplica `--breakpoint-md: 600px` de
 * `styles/index.css`: `design-system`/`features` no pueden leer una
 * variable CSS en JS sin un valor calculado en tiempo de ejecución, así que
 * se repite aquí con el comentario del porqué, igual que ya hace
 * `stores/uiPreferences.store.ts` con `SUPPORTED_LANGUAGES`.
 */
import type { DataProvenance, EducationLevel } from './profile.types';

export const NAME_MAX_LENGTH = 255;
export const SUMMARY_MAX_LENGTH = 2000;

export const DESCRIPTION_MAX_LENGTH = 500;

export const EDUCATION_LEVELS: readonly EducationLevel[] = [
  'TECHNICAL',
  'UNDERGRADUATE',
  'POSTGRADUATE',
] as const;

/** Todo ítem agregado a mano desde este formulario lleva esta procedencia (CA-2.3.1, extendido a experiencia/educación). */
export const MANUAL_PROVENANCE: DataProvenance = 'MANUAL';

export const PROFILE_COMPLETENESS_MAX = 5;

export const GENERAL_INFO_FORM_ID = 'general-info-form';
export const EDUCATION_FORM_ID = 'education-form';
export const WORK_EXPERIENCE_FORM_ID = 'work-experience-form';

/** Ver la nota de cabecera: mismo valor que `--breakpoint-md` de `styles/index.css`, repetido a propósito. */
export const DESKTOP_MEDIA_QUERY = '(min-width: 600px)';
