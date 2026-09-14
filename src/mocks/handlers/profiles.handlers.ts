/**
 * Simula el ciclo completo del Perfil Profesional (CLAUDE.md §8, «Todo
 * endpoint tiene su handler equivalente en `mocks/handlers/`») sobre un
 * array en memoria: crear, obtener por id, actualizar por secciones,
 * finalizar y listar. Nada persiste entre ejecuciones del proceso — solo
 * dentro de la sesión de mocks activa (dev o una corrida de pruebas).
 *
 * CM-53: el `PATCH` deriva `summaryProvenance`/`summaryProvenanceOrigin` a
 * partir del valor anterior de `summary` (CA-2.3.1, CA-2.3.2, CA-2.3.4,
 * `SPEC.md` §5) — el cliente nunca envía esos dos campos. Es lógica de
 * negocio que en el contrato real correspondería al backend; vive aquí
 * porque el mock es la única capa contra la que corre el frontend
 * mientras C-01 sigue sin respuesta.
 *
 * El array en memoria y `resetProfiles()` son estado compartido entre
 * archivos de prueba; cualquier prueba futura que consuma estos handlers
 * (incluidas las de `professional-profile`) debe llamar `resetProfiles()`
 * en su propio `beforeEach`, o va a heredar datos de la prueba anterior.
 *
 * Sin contrato real todavía (§12 abierta 1, consulta C-01): las rutas y la
 * forma del cuerpo son una referencia razonable, no un contrato — igual que
 * `docs/referencias/03092026_v1_familias-endpoints-sprint-1.md`, que las
 * inspira pero está desactualizado frente al backlog del 6-sep y al memo
 * del PO del 11-sep.
 *
 * Reconciliación explícita entre dos fuentes: el memo del 11-sep dice que
 * `POST /api/v1/profiles` no lleva body y el nombre se fija después por
 * `PATCH`; el backlog (CA-2.2.1 a CA-2.2.3) valida el nombre en la
 * creación. Aquí el body de `POST` es opcional — sin `name` crea vacío
 * (memo), y si `name` viene, se valida en el mismo sitio que `PATCH`.
 */
import { http, HttpResponse, type HttpHandler } from 'msw';
import { MOCK_USER_ID } from './auth.handlers';

const NAME_MAX_LENGTH = 120;

// Código de mock, no confirmado con backend; puede no coincidir cuando
// exista el contrato real.
const PROFILE_NAME_INVALID = 'PROFILE_NAME_INVALID';

// Código de mock, no confirmado con backend; puede no coincidir cuando
// exista el contrato real.
const EDUCATION_REQUIRED = 'EDUCATION_REQUIRED';

interface EducationItem {
  id: string;
  institution: string;
  program: string;
  level: string;
  inProgress: boolean;
}

interface SkillItem {
  id: string;
  skillName: string;
  level: string;
}

interface WorkExperienceItem {
  id: string;
  company: string;
  role: string;
  current: boolean;
}

type ProfileStatus = 'IN_PROGRESS' | 'COMPLETED';

/**
 * CM-53, CA-2.3.1/CA-2.3.2/CA-2.3.4: procedencia del resumen profesional.
 * `AI_SUGGESTED` es inalcanzable desde la interfaz en Sprint 1 (nace de
 * HU-2.6–2.10, Sprint 2) — solo lo produce `seedProfileForTests` para poder
 * probar la transición a `AI_EDITED` (SPEC.md §2, alcance consciente).
 */
type SummaryProvenance = 'MANUAL' | 'AI_SUGGESTED' | 'AI_EDITED' | null;

interface ProfileRecord {
  id: string;
  ownerId: string;
  status: ProfileStatus;
  name: string;
  summary: string;
  summaryProvenance: SummaryProvenance;
  summaryProvenanceOrigin: string | null;
  workExperience: WorkExperienceItem[];
  education: EducationItem[];
  skills: SkillItem[];
  targetRoleIds: string[];
}

interface ProfilePatchBody {
  name?: string;
  summary?: string;
  workExperience?: WorkExperienceItem[];
  education?: EducationItem[];
  skills?: SkillItem[];
  targetRoleIds?: string[];
}

interface MockErrorDetail {
  field: string;
  code: string;
}

/** Misma forma que `BackendErrorBody` en `services/http/errorMap.ts` — el contrato provisional, no RFC 9457. */
function errorBody(code: string, message: string, details: MockErrorDetail[] = []) {
  return { code, message, details, timestamp: new Date().toISOString() };
}

/** CA-2.2.1 a CA-2.2.3 (backlog 6-sep): nombre vacío o mayor a 120 caracteres. 120, no 255 — ese número viene de un memo sin fuente verificada (consulta C-01). */
function validateName(name: string): ReturnType<typeof errorBody> | undefined {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > NAME_MAX_LENGTH) {
    return errorBody(
      PROFILE_NAME_INVALID,
      `El nombre del perfil debe tener entre 1 y ${NAME_MAX_LENGTH} caracteres.`,
      [{ field: 'name', code: 'INVALID_LENGTH' }],
    );
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

let profiles: ProfileRecord[] = [];
let nextId = 1;

/**
 * Vacía el array en memoria y reinicia el contador de ids. Ver la nota de
 * cabecera de este archivo sobre por qué toda prueba que use estos handlers
 * debe llamarla en su propio `beforeEach`.
 */
export function resetProfiles(): void {
  profiles = [];
  nextId = 1;
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
  const profile: ProfileRecord = {
    id: `profile-${nextId++}`,
    ownerId: MOCK_USER_ID,
    status: 'IN_PROGRESS',
    name: '',
    summary: '',
    summaryProvenance: null,
    summaryProvenanceOrigin: null,
    workExperience: [],
    education: [],
    skills: [],
    targetRoleIds: [],
    ...overrides,
  };
  profiles.push(profile);
  return profile;
}

function createEmptyProfile(name: string): ProfileRecord {
  return {
    id: `profile-${nextId++}`,
    ownerId: MOCK_USER_ID,
    // GLOSSARY.md §3: el perfil se crea en IN_PROGRESS. No existe PENDING.
    status: 'IN_PROGRESS',
    name,
    summary: '',
    summaryProvenance: null,
    summaryProvenanceOrigin: null,
    workExperience: [],
    education: [],
    skills: [],
    targetRoleIds: [],
  };
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
      const profile = profiles.find((item) => item.id === params.id);
      if (!profile) {
        return HttpResponse.json(errorBody('NOT_FOUND', 'Perfil no encontrado.'), { status: 404 });
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
      // Casteos explícitos, no `unknown` a ciegas: este mock confía en la
      // forma que le manda quien construye la feature, no valida cada
      // campo de cada item (no es el contrato real, es la capa de mocks).
      if (Array.isArray(body.workExperience)) {
        profile.workExperience = body.workExperience as WorkExperienceItem[];
      }
      if (Array.isArray(body.education)) {
        profile.education = body.education as EducationItem[];
      }
      if (Array.isArray(body.skills)) {
        profile.skills = body.skills as SkillItem[];
      }
      if (Array.isArray(body.targetRoleIds)) {
        profile.targetRoleIds = body.targetRoleIds as string[];
      }

      return HttpResponse.json(profile, { status: 200 });
    },
  ),

  http.post('*/api/v1/profiles/:id/finalize', ({ params }) => {
    const profile = profiles.find((item) => item.id === params.id);
    if (!profile) {
      return HttpResponse.json(errorBody('NOT_FOUND', 'Perfil no encontrado.'), { status: 404 });
    }

    if (profile.education.length === 0) {
      // HU-2.4 (backlog 6-sep): la educación es obligatoria para activar el perfil.
      return HttpResponse.json(
        errorBody(
          EDUCATION_REQUIRED,
          'Agrega al menos una formación académica antes de finalizar.',
        ),
        { status: 422 },
      );
    }

    // GLOSSARY.md §3: transición única IN_PROGRESS → COMPLETED. Nadie pasa
    // por IN_REVIEW en el flujo manual.
    profile.status = 'COMPLETED';
    return HttpResponse.json(profile, { status: 200 });
  }),

  http.get('*/api/v1/profiles', () => {
    return HttpResponse.json(
      profiles.filter((profile) => profile.ownerId === MOCK_USER_ID),
      { status: 200 },
    );
  }),

  // CM-53: SPEC.md §3.2 ya asumía este endpoint (estado de carga "mientras
  // se obtiene el perfil por id") antes de que existiera. Sin filtro por
  // `ownerId`, igual que PATCH/finalize (nota transversal de SPEC.md §3,
  // C-01: el mock no distingue "no existe" de "no es tuyo").
  http.get('*/api/v1/profiles/:id', ({ params }) => {
    const profile = profiles.find((item) => item.id === params.id);
    if (!profile) {
      return HttpResponse.json(errorBody('NOT_FOUND', 'Perfil no encontrado.'), { status: 404 });
    }
    return HttpResponse.json(profile, { status: 200 });
  }),
];
