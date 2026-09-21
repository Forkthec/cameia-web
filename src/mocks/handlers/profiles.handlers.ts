/**
 * Simula el ciclo completo del Perfil Profesional (CLAUDE.md §8, «Todo
 * endpoint tiene su handler equivalente en `mocks/handlers/`») sobre un
 * array en memoria: crear, obtener por id, actualizar información general,
 * agregar/eliminar experiencia laboral y educación por ítem, finalizar y
 * listar. Nada persiste entre ejecuciones del proceso — solo dentro de la
 * sesión de mocks activa (dev o una corrida de pruebas).
 *
 * CM-53: el `PATCH` deriva `summaryProvenance`/`summaryProvenanceOrigin` a
 * partir del valor anterior de `summary` (CA-2.3.1, CA-2.3.2, CA-2.3.4,
 * `SPEC.md` §5) — el cliente nunca envía esos dos campos. Es lógica de
 * negocio que en el contrato real correspondería al backend; vive aquí
 * porque el mock es la única capa contra la que corre el frontend
 * mientras C-01 sigue sin respuesta.
 *
 * CM-61: la gestión de experiencia laboral y educación es por ítem
 * (`POST`/`DELETE`, nunca un `PATCH` de colección) — confirmado tanto por
 * el memo del PO del 11-sep ("gestión por ítem POST/DELETE") como por el
 * backend real de `cameia-perfil` (`ProfileController.java`,
 * `AddWorkExperienceRequest`, `AddEducationRequest`, `WorkExperience.java`,
 * `Education.java`), compartido en la sesión que escribió este archivo. Las
 * reglas de fecha/estado que este mock valida son las reglas de dominio
 * reales de esas dos clases, no invenciones: `WorkExperience.java` exige
 * `endDate` cuando `employmentStatus=ENDED` (y que no sea anterior a
 * `startDate`) y prohíbe `endDate` en cualquier otro estado;
 * `Education.java` prohíbe `endDate` cuando `inProgress=true`. `fieldOfStudy`
 * no se valida en `Education.java` (ni `@NotBlank` en el DTO ni
 * `requireNonBlankMax` en el dominio) — por eso aquí tampoco es obligatorio,
 * a diferencia de `institution`/`degree`, que el dominio real sí exige.
 *
 * CM-65: Habilidades es gestión por ítem (`POST`/`DELETE`), igual que
 * experiencia/educación, confirmado por el código real de
 * `ProfileController.java` (`AddSkillCommand`) — reemplaza el `PATCH`
 * masivo de `skills` que este archivo simulaba antes de conocer el
 * contrato. `POST /api/v1/profiles/:id/completion` (no `.../finalize`,
 * como este archivo simulaba desde CM-61 hasta esta corrección — ver
 * `SPEC.md` §5) valida los 5 requisitos reales en orden y devuelve
 * **todos** los incumplidos en `errors`, nunca solo el primero.
 *
 * CM-69: Roles Objetivo también es gestión por ítem (`POST`/`PATCH`/
 * `DELETE`), confirmado contra el código real de `ProfileController.java`
 * (`addTargetRole`, `updateTargetRole`, `removeTargetRole`) y contra el memo
 * del PO del 13-sep (C-05: "sustituir" es un `PATCH` real, no
 * "eliminar+agregar", y conserva el id del Rol Objetivo). Reemplaza el
 * `targetRoleIds: string[]` que este archivo simulaba antes de conocer el
 * contrato real: el backend expone cada Rol Objetivo como su propio
 * recurso, con su propio id, no como un arreglo plano de ids de catálogo.
 *
 * CM-65 y CM-69 se construyeron en ramas independientes en paralelo, cada
 * una con una referencia de solo lectura al recurso de la otra; este
 * archivo ya está fusionado con ambos conjuntos de handlers reales.
 *
 * **CM-195 (bug de crash, 20-sep-2026):** este mock devolvía
 * `workExperience`/`education`/`skills` en el `ProfileRecord` — nombres
 * inventados que nunca coincidieron con el `record ProfileResponse` real de
 * `cameia-perfil` (`workExperiences`/`educations`/`profileSkills`,
 * confirmado línea por línea contra el código fuente Java + una captura HAR
 * real). El propio mock reproducía el bug en vez de detectarlo: como
 * frontend y mock compartían el mismo nombre equivocado, ninguna prueba
 * contra estos handlers atrapaba el crash real de `toProfile` en
 * `profile.mapper.ts`. Corregido: el `ProfileRecord` interno ahora usa los
 * nombres reales, y se agregan los campos del record real que faltaban
 * (`reviewStatus`, `provenance` de perfil, `salaryExpectation`,
 * `preferredModality`, `createdAt`, `updatedAt`, `roleTitle` por rol
 * objetivo) para que este mock deje de mentir sobre el contrato.
 *
 * El array en memoria y `resetProfiles()` son estado compartido entre
 * archivos de prueba; cualquier prueba futura que consuma estos handlers
 * (incluidas las de `professional-profile`) debe llamar `resetProfiles()`
 * en su propio `beforeEach`, o va a heredar datos de la prueba anterior.
 *
 * Sin contrato HTTP oficial todavía (§12 abierta 1, consulta C-01): la
 * forma del cuerpo replica el DTO real de `cameia-perfil` donde se conoce
 * (experiencia, educación); el resto sigue siendo una referencia razonable,
 * no un contrato, igual que
 * `docs/referencias/03092026_v1_familias-endpoints-sprint-1.md`, que las
 * inspira pero está desactualizado frente al backlog del 6-sep y al memo
 * del PO del 11-sep.
 *
 * Reconciliación explícita entre dos fuentes: el memo del 11-sep dice que
 * `POST /api/v1/profiles` no lleva body y el nombre se fija después por
 * `PATCH`; el backlog (CA-2.2.1 a CA-2.2.3) valida el nombre en la
 * creación. Aquí el body de `POST` es opcional — sin `name` crea vacío
 * (memo), y si `name` viene, se valida en el mismo sitio que `PATCH`.
 *
 * **Errores (`ADR-0007`):** el cuerpo de cada error simula un `ProblemDetail`
 * real (RFC 7807, `title`/`status`/`detail` + la extensión `errors:
 * [{field, message}]`) — sin `code` propio, porque `ApiExceptionHandler.java`
 * (el backend real de `cameia-perfil`, ya citado en `SPEC.md` §4) tampoco lo
 * envía. Cada llamador de este mock discrimina por `httpStatus`, nunca por
 * un código inventado.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { MOCK_USER_ID } from './auth.handlers';
import { PROFESSIONAL_ROLES } from '../data/catalogs';

const NAME_MAX_LENGTH = 255;
const SUMMARY_MAX_LENGTH = 2000;
const DESCRIPTION_MAX_LENGTH = 500;
const SKILL_NAME_MAX_LENGTH = 255;
const MAX_TARGET_ROLES = 5;

const EDUCATION_LEVELS = ['TECHNICAL', 'UNDERGRADUATE', 'POSTGRADUATE'] as const;
const EMPLOYMENT_STATUSES = ['CURRENT', 'UNKNOWN_END', 'ENDED'] as const;
const SKILL_LEVELS = ['BASIC', 'INTERMEDIATE', 'ADVANCED'] as const;
const DATA_PROVENANCES = ['MANUAL', 'AI_SUGGESTED', 'AI_EDITED'] as const;

type EducationLevel = (typeof EDUCATION_LEVELS)[number];
type EmploymentStatus = (typeof EMPLOYMENT_STATUSES)[number];
type SkillLevel = (typeof SKILL_LEVELS)[number];
type DataProvenance = (typeof DATA_PROVENANCES)[number];

/** `"YYYY-MM"` — el backend real almacena `java.time.YearMonth`, sin día. */
interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  level: EducationLevel;
  startDate: string;
  endDate: string | null;
  inProgress: boolean;
  provenance: DataProvenance;
}

interface SkillItem {
  id: string;
  skillName: string;
  level: SkillLevel;
  provenance: DataProvenance;
}

/**
 * `id` es el identificador propio del Rol Objetivo — `PATCH` lo conserva al sustituir
 * `professionalRoleId` (ver TSDoc de cabecera, C-05). `roleTitle` (CM-195): campo real del
 * record Java, resuelto aquí contra `PROFESSIONAL_ROLES` (ver `resolveRoleTitle`).
 */
interface TargetRoleItem {
  id: string;
  professionalRoleId: string;
  roleTitle: string;
  provenance: DataProvenance;
}

interface WorkExperienceItem {
  id: string;
  company: string;
  position: string;
  description: string | null;
  startDate: string;
  endDate: string | null;
  employmentStatus: EmploymentStatus;
  provenance: DataProvenance;
}

type ProfileStatus = 'IN_PROGRESS' | 'COMPLETED';

/** CM-195: `record ProfileResponse` real, confirmado — `PENDING_REVIEW` es el único valor que un perfil manual alcanza en Sprint 1 (no hay endpoint que produzca `REVIEWED` en el contrato conocido). */
type ReviewStatus = 'PENDING_REVIEW' | 'REVIEWED';

/** CM-195: `record ProfileResponse` real, confirmado — sin UI ni endpoint que lo fije en Sprint 1; se simula `null` siempre. */
type WorkModality = 'REMOTE' | 'HYBRID' | 'ON_SITE';

/**
 * CM-53, CA-2.3.1/CA-2.3.2/CA-2.3.4: procedencia del resumen profesional.
 * `AI_SUGGESTED` es inalcanzable desde la interfaz en Sprint 1 (nace de
 * HU-2.6–2.10, Sprint 2) — solo lo produce `seedProfileForTests` para poder
 * probar la transición a `AI_EDITED` (SPEC.md §2, alcance consciente).
 *
 * **CM-195:** el `record ProfileResponse` real confirmado no tiene este
 * campo en absoluto — es simulación adelantada de una funcionalidad de
 * Sprint 2 que el backend real todavía no expone (ver TSDoc de `ProfileDto`
 * en el frontend). Se conserva porque las pruebas de CA-2.3.x de esta
 * feature siguen siendo el único lugar donde esa regla de negocio se
 * verifica hoy; no se elimina sin que Producto decida qué pasa con ella.
 */
type SummaryProvenance = 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;

interface ProfileRecord {
  id: string;
  ownerId: string;
  status: ProfileStatus;
  reviewStatus: ReviewStatus;
  /** Procedencia del PERFIL completo (CM-195) — no confundir con la `provenance` de cada ítem (`DataProvenance`, ya existente). Siempre `MANUAL`: no hay flujo que cree un perfil por IA en Sprint 1. */
  provenance: DataProvenance;
  name: string;
  summary: string;
  summaryProvenance: SummaryProvenance;
  summaryProvenanceOrigin: string | null;
  salaryExpectation: number | null;
  preferredModality: WorkModality | null;
  createdAt: string;
  updatedAt: string;
  workExperiences: WorkExperienceItem[];
  educations: EducationItem[];
  profileSkills: SkillItem[];
  targetRoles: TargetRoleItem[];
}

/** CM-195: resuelve el `roleTitle` real que el backend ya manda resuelto — cae al propio id si el catálogo no lo tiene (no debería pasar: `professionalRoleId` ya se valida contra `PROFESSIONAL_ROLES` antes de llamar esto). */
function resolveRoleTitle(professionalRoleId: string): string {
  return (
    PROFESSIONAL_ROLES.find((role) => role.id === professionalRoleId)?.nombre ?? professionalRoleId
  );
}

/** CM-61/CM-65/CM-69: `workExperience`/`education`/`skills`/`targetRoles` ya NO viajan por aquí — la gestión de las cuatro es por ítem (ver TSDoc de cabecera). */
interface ProfilePatchBody {
  name?: string;
  summary?: string;
}

interface MockErrorField {
  field: string;
  message: string;
}

/** Misma forma que un `ProblemDetail` real (RFC 7807, `ADR-0007`) — sin `code` propio. */
function errorBody(status: number, title: string, detail: string, errors: MockErrorField[] = []) {
  return { type: 'about:blank', title, status, detail, errors };
}

function notFound(detail: string) {
  return errorBody(404, 'No encontrado', detail);
}

/** CA-2.2.1 a CA-2.2.3: nombre vacío o mayor a 255 caracteres, confirmado por la respuesta oficial del PO del 13-sep (C-01) contra el código/OpenAPI de MicroPerfilPro. */
function validateName(name: string): ReturnType<typeof errorBody> | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > NAME_MAX_LENGTH) {
    const detail = `El nombre del perfil debe tener entre 1 y ${NAME_MAX_LENGTH} caracteres.`;
    return errorBody(400, 'Datos no válidos', detail, [{ field: 'name', message: detail }]);
  }
  return undefined;
}

/** `request.json()` lanza con un cuerpo vacío (el memo del 11-sep dice que la creación no lleva body); se trata como "sin datos", no como error. */
async function safeJson(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    return (await request.json()) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

/** `"YYYY-MM"`, el único formato que el backend real acepta para `YearMonth` (sin día). */
function isYearMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}$/.test(value);
}

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

let profiles: ProfileRecord[] = [];
let nextId = 1;
let nextWorkExperienceId = 1;
let nextEducationId = 1;
let nextSkillId = 1;
let nextTargetRoleId = 1;

/**
 * Vacía el array en memoria y reinicia los contadores de id. Ver la nota de
 * cabecera de este archivo sobre por qué toda prueba que use estos handlers
 * debe llamarla en su propio `beforeEach`.
 */
export function resetProfiles(): void {
  profiles = [];
  nextId = 1;
  nextWorkExperienceId = 1;
  nextEducationId = 1;
  nextSkillId = 1;
  nextTargetRoleId = 1;
}

/**
 * Solo para pruebas: siembra un perfil con campos arbitrarios, incluido
 * `summaryProvenance: 'AI_SUGGESTED'`, estado que ningún endpoint público
 * puede producir en Sprint 1 (CA-2.3.2 es inalcanzable desde la interfaz
 * hasta HU-2.6–2.10, Sprint 2). Ninguna feature puede importar este
 * archivo — `eslint-plugin-boundaries` no incluye `mocks` entre los
 * destinos permitidos desde `features` (`eslint.config.js`) — así que este
 * helper no puede llegar a producción por ese camino.
 */
export function seedProfileForTests(overrides: Partial<ProfileRecord> = {}): ProfileRecord {
  const now = new Date().toISOString();
  const profile: ProfileRecord = {
    id: `profile-${nextId++}`,
    ownerId: MOCK_USER_ID,
    status: 'IN_PROGRESS',
    reviewStatus: 'PENDING_REVIEW',
    provenance: 'MANUAL',
    name: '',
    summary: '',
    summaryProvenance: null,
    summaryProvenanceOrigin: null,
    salaryExpectation: null,
    preferredModality: null,
    createdAt: now,
    updatedAt: now,
    workExperiences: [],
    educations: [],
    profileSkills: [],
    targetRoles: [],
    ...overrides,
  };
  profiles.push(profile);
  return profile;
}

function createEmptyProfile(name: string): ProfileRecord {
  const now = new Date().toISOString();
  return {
    id: `profile-${nextId++}`,
    ownerId: MOCK_USER_ID,
    // GLOSSARY.md §3: el perfil se crea en IN_PROGRESS. No existe PENDING.
    status: 'IN_PROGRESS',
    // CM-195: confirmado por HAR real — un perfil recién creado ya nace `PENDING_REVIEW`.
    reviewStatus: 'PENDING_REVIEW',
    provenance: 'MANUAL',
    name,
    summary: '',
    summaryProvenance: null,
    summaryProvenanceOrigin: null,
    salaryExpectation: null,
    preferredModality: null,
    createdAt: now,
    updatedAt: now,
    workExperiences: [],
    educations: [],
    profileSkills: [],
    targetRoles: [],
  };
}

function findProfile(id: string): ProfileRecord | undefined {
  return profiles.find((item) => item.id === id);
}

export const profilesHandlers: HttpHandler[] = [
  http.post('*/api/v1/profiles', async ({ request }) => {
    const body = await safeJson(request);
    const rawName = body?.name;

    // Se valida cuando `name` VIENE en el body, sin importar si viene vacío
    // — un `name: ''` no es lo mismo que "sin body" (memo del 11-sep): es
    // exactamente el caso que CA-2.2.1 pide rechazar.
    if (typeof rawName === 'string') {
      const error = validateName(rawName);
      if (error) return HttpResponse.json(error, { status: 400 });
    }

    const profile = createEmptyProfile(typeof rawName === 'string' ? rawName : '');
    profiles.push(profile);
    return HttpResponse.json(profile, { status: 201 });
  }),

  http.patch<{ id: string }, ProfilePatchBody>(
    '*/api/v1/profiles/:id',
    async ({ request, params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }

      const body = await safeJson(request);
      if (body === undefined) {
        return HttpResponse.json(profile, { status: 200 });
      }

      if (typeof body.name === 'string') {
        const error = validateName(body.name);
        if (error) return HttpResponse.json(error, { status: 400 });
        profile.name = body.name;
      }
      // El cliente nunca envía `summaryProvenance`: lo deriva este mock a
      // partir del valor anterior, tal como lo haría el backend real
      // (SPEC.md §5). Orden: CA-2.3.4 (vaciar) primero; si el texto no
      // cambió, no hay transición que hacer (guardar un resumen intacto no
      // es "editarlo"); luego CA-2.3.2 (edición de un resumen sugerido por
      // IA); CA-2.3.1 como caso general.
      if (typeof body.summary === 'string') {
        const trimmed = body.summary.trim();
        const unchanged = body.summary === profile.summary;
        if (trimmed.length === 0) {
          profile.summary = '';
          profile.summaryProvenance = null;
          profile.summaryProvenanceOrigin = null;
        } else if (unchanged) {
          // No-op: conserva la procedencia actual tal cual (MANUAL,
          // AI_SUGGESTED o AI_EDITED) — no hubo edición.
        } else if (profile.summaryProvenance === 'AI_SUGGESTED') {
          profile.summary = body.summary;
          profile.summaryProvenance = 'AI_EDITED';
          // El origen de ejecución se conserva por trazabilidad (CA-2.3.2).
        } else {
          profile.summary = body.summary;
          profile.summaryProvenance = 'MANUAL';
          profile.summaryProvenanceOrigin = null;
        }
      }

      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-61: alta de experiencia laboral. Reglas de `WorkExperience.java`
  // (backend real): `startDate` obligatoria; `employmentStatus=ENDED`
  // exige `endDate` >= `startDate`; cualquier otro estado prohíbe `endDate`.
  http.post<{ id: string }>(
    '*/api/v1/profiles/:id/work-experiences',
    async ({ request, params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }

      const body = (await safeJson(request)) ?? {};
      const { company, position, description, startDate, endDate, employmentStatus, provenance } =
        body;

      if (
        !isNonBlankString(company) ||
        !isNonBlankString(position) ||
        !isYearMonth(startDate) ||
        !EMPLOYMENT_STATUSES.includes(employmentStatus as EmploymentStatus) ||
        !DATA_PROVENANCES.includes(provenance as DataProvenance) ||
        (description !== undefined && description !== null && typeof description !== 'string') ||
        (typeof description === 'string' && description.length > DESCRIPTION_MAX_LENGTH)
      ) {
        return HttpResponse.json(
          errorBody(400, 'Datos no válidos', 'Revisa los datos de la experiencia laboral.'),
          { status: 400 },
        );
      }

      const status = employmentStatus as EmploymentStatus;
      const hasEndDate = endDate !== undefined && endDate !== null && endDate !== '';

      if (status === 'ENDED') {
        if (!isYearMonth(endDate)) {
          const detail = 'La fecha de fin es obligatoria si ya no trabajas ahí.';
          return HttpResponse.json(
            errorBody(422, 'Fecha no válida', detail, [{ field: 'endDate', message: detail }]),
            { status: 422 },
          );
        }
        if (endDate < startDate) {
          const detail = 'La fecha de fin no puede ser anterior a la de inicio.';
          return HttpResponse.json(
            errorBody(422, 'Fecha no válida', detail, [{ field: 'endDate', message: detail }]),
            { status: 422 },
          );
        }
      } else if (hasEndDate) {
        const detail = 'No puedes indicar una fecha de fin en este estado.';
        return HttpResponse.json(
          errorBody(422, 'Fecha no válida', detail, [{ field: 'endDate', message: detail }]),
          { status: 422 },
        );
      }

      const item: WorkExperienceItem = {
        id: `work-experience-${nextWorkExperienceId++}`,
        company,
        position,
        description: typeof description === 'string' ? description : null,
        startDate,
        endDate: status === 'ENDED' ? (endDate as string) : null,
        employmentStatus: status,
        provenance: provenance as DataProvenance,
      };
      profile.workExperiences.push(item);
      return HttpResponse.json(profile, { status: 201 });
    },
  ),

  http.delete<{ id: string; workExperienceId: string }>(
    '*/api/v1/profiles/:id/work-experiences/:workExperienceId',
    ({ params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }
      const index = profile.workExperiences.findIndex(
        (item) => item.id === params.workExperienceId,
      );
      if (index === -1) {
        return HttpResponse.json(notFound('Experiencia laboral no encontrada.'), { status: 404 });
      }
      profile.workExperiences.splice(index, 1);
      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-61: alta de educación. Reglas de `Education.java` (backend real):
  // `institution`/`degree`/`startDate` obligatorias; `fieldOfStudy` NO se
  // valida (a diferencia de los otros dos); `inProgress=true` prohíbe `endDate`.
  http.post<{ id: string }>('*/api/v1/profiles/:id/educations', async ({ request, params }) => {
    const profile = findProfile(params.id);
    if (!profile) {
      return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
    }

    const body = (await safeJson(request)) ?? {};
    const { institution, degree, fieldOfStudy, level, startDate, endDate, inProgress, provenance } =
      body;

    if (
      !isNonBlankString(institution) ||
      !isNonBlankString(degree) ||
      !EDUCATION_LEVELS.includes(level as EducationLevel) ||
      !isYearMonth(startDate) ||
      typeof inProgress !== 'boolean' ||
      !DATA_PROVENANCES.includes(provenance as DataProvenance) ||
      (fieldOfStudy !== undefined && fieldOfStudy !== null && typeof fieldOfStudy !== 'string')
    ) {
      return HttpResponse.json(
        errorBody(400, 'Datos no válidos', 'Revisa los datos de la formación académica.'),
        { status: 400 },
      );
    }

    const hasEndDate = endDate !== undefined && endDate !== null && endDate !== '';
    if (inProgress && hasEndDate) {
      const detail = 'Una formación en curso no puede tener fecha de finalización.';
      return HttpResponse.json(
        errorBody(422, 'Fecha no válida', detail, [{ field: 'endDate', message: detail }]),
        { status: 422 },
      );
    }
    if (hasEndDate && !isYearMonth(endDate)) {
      return HttpResponse.json(
        errorBody(400, 'Datos no válidos', 'La fecha de finalización no es válida.'),
        { status: 400 },
      );
    }

    const item: EducationItem = {
      id: `education-${nextEducationId++}`,
      institution,
      degree,
      fieldOfStudy: typeof fieldOfStudy === 'string' ? fieldOfStudy : '',
      level: level as EducationLevel,
      startDate,
      endDate: !inProgress && hasEndDate ? endDate : null,
      inProgress,
      provenance: provenance as DataProvenance,
    };
    profile.educations.push(item);
    return HttpResponse.json(profile, { status: 201 });
  }),

  http.delete<{ id: string; educationId: string }>(
    '*/api/v1/profiles/:id/educations/:educationId',
    ({ params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }
      const index = profile.educations.findIndex((item) => item.id === params.educationId);
      if (index === -1) {
        return HttpResponse.json(notFound('Educación no encontrada.'), { status: 404 });
      }
      profile.educations.splice(index, 1);
      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-65: alta de habilidad. Reglas reales (`ProfileController.java#addSkill`):
  // `skillName` 1-255, texto libre, sin catálogo; `level` del enum real;
  // 409 si ya existe una habilidad con el mismo texto (sin distinguir
  // mayúsculas ni espacios — memo del PO del 13-sep, C-06).
  http.post<{ id: string }>('*/api/v1/profiles/:id/skills', async ({ request, params }) => {
    const profile = findProfile(params.id);
    if (!profile) {
      return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
    }

    const body = (await safeJson(request)) ?? {};
    const { skillName, level, provenance } = body;

    if (
      !isNonBlankString(skillName) ||
      skillName.trim().length > SKILL_NAME_MAX_LENGTH ||
      !SKILL_LEVELS.includes(level as SkillLevel) ||
      !DATA_PROVENANCES.includes(provenance as DataProvenance)
    ) {
      return HttpResponse.json(
        errorBody(400, 'Datos no válidos', 'Revisa los datos de la habilidad.'),
        { status: 400 },
      );
    }

    const normalized = skillName.trim().toLowerCase();
    if (
      profile.profileSkills.some((skill) => skill.skillName.trim().toLowerCase() === normalized)
    ) {
      return HttpResponse.json(
        errorBody(409, 'Habilidad duplicada', 'Esa habilidad ya está en tu perfil.'),
        { status: 409 },
      );
    }

    const item: SkillItem = {
      id: `skill-${nextSkillId++}`,
      skillName: skillName.trim(),
      level: level as SkillLevel,
      provenance: provenance as DataProvenance,
    };
    profile.profileSkills.push(item);
    return HttpResponse.json(profile, { status: 201 });
  }),

  http.delete<{ id: string; skillId: string }>(
    '*/api/v1/profiles/:id/skills/:skillId',
    ({ params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }
      const index = profile.profileSkills.findIndex((skill) => skill.id === params.skillId);
      if (index === -1) {
        return HttpResponse.json(notFound('Habilidad no encontrada.'), { status: 404 });
      }
      profile.profileSkills.splice(index, 1);
      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-69: alta de rol objetivo. Reglas reales (`ProfileController.java#addTargetRole`):
  // `professionalRoleId` debe existir en el catálogo cerrado; 409 si ya
  // está asociado al perfil; 422 al llegar al máximo (5, sin prioridad ni
  // reordenamiento — memo del PO del 13-sep, C-05).
  http.post<{ id: string }>('*/api/v1/profiles/:id/target-roles', async ({ request, params }) => {
    const profile = findProfile(params.id);
    if (!profile) {
      return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
    }

    const body = (await safeJson(request)) ?? {};
    const { professionalRoleId, provenance } = body;

    if (
      !isNonBlankString(professionalRoleId) ||
      !PROFESSIONAL_ROLES.some((role) => role.id === professionalRoleId) ||
      !DATA_PROVENANCES.includes(provenance as DataProvenance)
    ) {
      return HttpResponse.json(
        errorBody(400, 'Datos no válidos', 'Revisa el rol objetivo enviado.'),
        { status: 400 },
      );
    }

    if (profile.targetRoles.length >= MAX_TARGET_ROLES) {
      return HttpResponse.json(
        errorBody(
          422,
          'Máximo de roles alcanzado',
          `Ya tienes el máximo de ${MAX_TARGET_ROLES} roles objetivo.`,
        ),
        { status: 422 },
      );
    }

    if (profile.targetRoles.some((role) => role.professionalRoleId === professionalRoleId)) {
      return HttpResponse.json(
        errorBody(409, 'Rol objetivo duplicado', 'Ese rol objetivo ya está en tu perfil.'),
        { status: 409 },
      );
    }

    const item: TargetRoleItem = {
      id: `target-role-${nextTargetRoleId++}`,
      professionalRoleId,
      roleTitle: resolveRoleTitle(professionalRoleId),
      provenance: provenance as DataProvenance,
    };
    profile.targetRoles.push(item);
    return HttpResponse.json(profile, { status: 201 });
  }),

  // CM-69: sustituir el rol profesional referenciado, conservando el id del
  // Rol Objetivo (`ProfileController.java#updateTargetRole`, C-05) — nunca
  // "eliminar y agregar".
  http.patch<{ id: string; roleId: string }>(
    '*/api/v1/profiles/:id/target-roles/:roleId',
    async ({ request, params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }
      const item = profile.targetRoles.find((role) => role.id === params.roleId);
      if (!item) {
        return HttpResponse.json(notFound('Rol objetivo no encontrado.'), { status: 404 });
      }

      const body = (await safeJson(request)) ?? {};
      const { professionalRoleId } = body;

      if (
        !isNonBlankString(professionalRoleId) ||
        !PROFESSIONAL_ROLES.some((role) => role.id === professionalRoleId)
      ) {
        return HttpResponse.json(
          errorBody(400, 'Datos no válidos', 'Revisa el rol objetivo enviado.'),
          { status: 400 },
        );
      }

      if (
        profile.targetRoles.some(
          (role) => role.id !== item.id && role.professionalRoleId === professionalRoleId,
        )
      ) {
        return HttpResponse.json(
          errorBody(409, 'Rol objetivo duplicado', 'Ese rol objetivo ya está en tu perfil.'),
          { status: 409 },
        );
      }

      item.professionalRoleId = professionalRoleId;
      item.roleTitle = resolveRoleTitle(professionalRoleId);
      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-69: eliminar solo se bloquea cuando es el último rol objetivo de un
  // perfil ya `COMPLETED` (`ProfileController.java#removeTargetRole`) — con
  // el perfil todavía `IN_PROGRESS` sí se puede quedar sin roles.
  http.delete<{ id: string; roleId: string }>(
    '*/api/v1/profiles/:id/target-roles/:roleId',
    ({ params }) => {
      const profile = findProfile(params.id);
      if (!profile) {
        return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
      }
      const index = profile.targetRoles.findIndex((role) => role.id === params.roleId);
      if (index === -1) {
        return HttpResponse.json(notFound('Rol objetivo no encontrado.'), { status: 404 });
      }
      if (profile.targetRoles.length === 1 && profile.status === 'COMPLETED') {
        return HttpResponse.json(
          errorBody(
            422,
            'No se puede eliminar',
            'No puedes quedarte sin roles objetivo con el perfil activo.',
          ),
          { status: 422 },
        );
      }
      profile.targetRoles.splice(index, 1);
      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  // CM-65: `POST .../completion`, no `.../finalize` (ver TSDoc de cabecera y
  // `SPEC.md` §5) — confirmado por `ProfileController.java#completeProfile`.
  // Valida los 5 requisitos reales EN ORDEN pero acumula TODOS los
  // incumplidos antes de responder, nunca solo el primero.
  http.post('*/api/v1/profiles/:id/completion', ({ params }) => {
    const profile = findProfile(params.id as string);
    if (!profile) {
      return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
    }

    if (profile.status === 'COMPLETED') {
      return HttpResponse.json(errorBody(409, 'Perfil ya activo', 'Este perfil ya está activo.'), {
        status: 409,
      });
    }

    const missing: MockErrorField[] = [];
    if (profile.name.trim().length === 0) {
      missing.push({ field: 'name', message: 'Obligatorio' });
    }
    if (profile.summary.trim().length === 0 || profile.summary.length > SUMMARY_MAX_LENGTH) {
      missing.push({ field: 'summary', message: 'Obligatorio' });
    }
    if (profile.educations.length === 0) {
      missing.push({ field: 'education', message: 'Obligatorio' });
    }
    if (profile.profileSkills.length === 0) {
      missing.push({ field: 'skills', message: 'Obligatorio' });
    }
    if (profile.targetRoles.length === 0) {
      missing.push({ field: 'targetRoles', message: 'Obligatorio' });
    }

    if (missing.length > 0) {
      return HttpResponse.json(
        errorBody(
          422,
          'Perfil incompleto',
          'Todavía no cumples los requisitos para finalizar.',
          missing,
        ),
        { status: 422 },
      );
    }

    // GLOSSARY.md §3: transición única IN_PROGRESS → COMPLETED. Nadie pasa
    // por IN_REVIEW en el flujo manual. El backend real responde 201, no
    // 200 (`ProfileController.java#completeProfile`).
    profile.status = 'COMPLETED';
    return HttpResponse.json(profile, { status: 201 });
  }),

  // CM-53: SPEC.md §3.2 ya asumía este endpoint (estado de carga "mientras
  // se obtiene el perfil por id") antes de que existiera. Sin filtro por
  // `ownerId`, igual que PATCH/completion (nota transversal de SPEC.md §3,
  // C-01: el mock no distingue "no existe" de "no es tuyo").
  http.get('*/api/v1/profiles/:id', ({ params }) => {
    const profile = findProfile(params.id as string);
    if (!profile) {
      return HttpResponse.json(notFound('Perfil no encontrado.'), { status: 404 });
    }
    return HttpResponse.json(profile, { status: 200 });
  }),
];
