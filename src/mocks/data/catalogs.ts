/**
 * Catálogos simulados para construir los selectores del Perfil Profesional.
 * Ninguno de los tres tiene endpoint real todavía (§12 abierta 1, T-01):
 * cada uno documenta en su propio comentario qué tan firme es su contenido,
 * para que quien los consuma no los confunda con un contrato.
 */

/**
 * Niveles educativos — enum fijo, no catálogo de base de datos (T-01,
 * `docs/decisiones/11092026_v2_…`). Textos en español pendientes de
 * aprobación por el PO (consulta C-07); no incluye tecnólogo ni distingue
 * especialización de maestría, revisar si eso cambia.
 */
export const EDUCATION_LEVELS = ['TECHNICAL', 'UNDERGRADUATE', 'POSTGRADUATE'] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

/**
 * Niveles de habilidad — valores de `SkillLevel` sin confirmar (consulta
 * C-06); son un placeholder para poder construir el selector, no un
 * contrato. Las habilidades en sí son texto libre, no catálogo
 * (`docs/decisiones/11092026_v2_…`, D-01/T-01).
 */
export const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const;
export type SkillLevel = (typeof SKILL_LEVELS)[number];

/**
 * Roles profesionales — SÍ es catálogo cerrado (backlog 6-sep, HU-2.11): el
 * usuario selecciona de aquí, nunca escribe libre. Ejemplo realista para el
 * dominio de la aplicación (entrevistas, tecnología, áreas afines).
 * `GET /api/v1/profiles/professional-roles`
 * (`mocks/handlers/professionalRoles.handlers.ts`, CM-69) ya simula el
 * endpoint real (`ProfessionalRoleController.java`, CM-23). Forma y ruta
 * corregidas en CM-195 (auditoría 20-sep-2026): el backend real responde
 * `{id, nombre, categoria}`, en español — este catálogo mock refleja
 * directamente esa forma cruda (es lo que el handler MSW devuelve sin pasar
 * por el mapper de la app real). `categoria` es agrupación de ejemplo, sin
 * confirmar contra un catálogo real de categorías del backend.
 */
export interface ProfessionalRole {
  id: string;
  nombre: string;
  categoria: string;
}

export const PROFESSIONAL_ROLES: ProfessionalRole[] = [
  { id: 'software-developer', nombre: 'Desarrollador de Software', categoria: 'Desarrollo' },
  { id: 'frontend-developer', nombre: 'Desarrollador Frontend', categoria: 'Desarrollo' },
  { id: 'backend-developer', nombre: 'Desarrollador Backend', categoria: 'Desarrollo' },
  { id: 'fullstack-developer', nombre: 'Desarrollador Full Stack', categoria: 'Desarrollo' },
  { id: 'data-engineer', nombre: 'Ingeniero de Datos', categoria: 'Datos' },
  { id: 'data-scientist', nombre: 'Científico de Datos', categoria: 'Datos' },
  {
    id: 'machine-learning-engineer',
    nombre: 'Ingeniero de Machine Learning',
    categoria: 'Datos',
  },
  { id: 'qa-analyst', nombre: 'Analista de QA', categoria: 'Desarrollo' },
  { id: 'devops-engineer', nombre: 'Ingeniero DevOps', categoria: 'Infraestructura' },
  {
    id: 'cloud-specialist',
    nombre: 'Especialista en Cloud Computing',
    categoria: 'Infraestructura',
  },
  {
    id: 'security-specialist',
    nombre: 'Especialista en Ciberseguridad',
    categoria: 'Infraestructura',
  },
  {
    id: 'database-administrator',
    nombre: 'Administrador de Bases de Datos',
    categoria: 'Infraestructura',
  },
  { id: 'network-engineer', nombre: 'Ingeniero de Redes', categoria: 'Infraestructura' },
  { id: 'solutions-architect', nombre: 'Arquitecto de Soluciones', categoria: 'Infraestructura' },
  { id: 'product-manager', nombre: 'Product Manager', categoria: 'Producto y Diseño' },
  { id: 'ux-ui-designer', nombre: 'Diseñador UX/UI', categoria: 'Producto y Diseño' },
  { id: 'scrum-master', nombre: 'Scrum Master', categoria: 'Producto y Diseño' },
  { id: 'business-analyst', nombre: 'Analista de Negocios', categoria: 'Producto y Diseño' },
];
