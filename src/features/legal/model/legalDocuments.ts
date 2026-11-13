/**
 * Las tres políticas públicas que la persona acepta al registrarse (CM-365,
 * criterio 1). El código nombra la llave de i18n (`legal:documentos.<código>`)
 * y su ruta pública.
 */
export const LEGAL_DOCUMENTS = ['politicaDatos', 'avisoPrivacidad', 'terminos'] as const;
export type LegalDocument = (typeof LEGAL_DOCUMENTS)[number];

/** Sección de una política: título y párrafos, en el orden del texto aprobado. */
export interface LegalSection {
  titulo: string;
  parrafos: string[];
}
