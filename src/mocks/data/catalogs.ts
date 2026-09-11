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
 * dominio de la aplicación (entrevistas, tecnología, áreas afines);
 * pendiente el endpoint real de lectura (T-01).
 */
export interface ProfessionalRole {
  id: string;
  name: string;
}

export const PROFESSIONAL_ROLES: ProfessionalRole[] = [
  { id: 'software-developer', name: 'Desarrollador de Software' },
  { id: 'frontend-developer', name: 'Desarrollador Frontend' },
  { id: 'backend-developer', name: 'Desarrollador Backend' },
  { id: 'fullstack-developer', name: 'Desarrollador Full Stack' },
  { id: 'data-engineer', name: 'Ingeniero de Datos' },
  { id: 'data-scientist', name: 'Científico de Datos' },
  { id: 'machine-learning-engineer', name: 'Ingeniero de Machine Learning' },
  { id: 'qa-analyst', name: 'Analista de QA' },
  { id: 'devops-engineer', name: 'Ingeniero DevOps' },
  { id: 'cloud-specialist', name: 'Especialista en Cloud Computing' },
  { id: 'security-specialist', name: 'Especialista en Ciberseguridad' },
  { id: 'database-administrator', name: 'Administrador de Bases de Datos' },
  { id: 'network-engineer', name: 'Ingeniero de Redes' },
  { id: 'solutions-architect', name: 'Arquitecto de Soluciones' },
  { id: 'product-manager', name: 'Product Manager' },
  { id: 'ux-ui-designer', name: 'Diseñador UX/UI' },
  { id: 'scrum-master', name: 'Scrum Master' },
  { id: 'business-analyst', name: 'Analista de Negocios' },
];
