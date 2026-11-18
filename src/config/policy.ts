/**
 * Versión vigente de las políticas que la persona acepta (CM-365): política de
 * tratamiento de datos, aviso de privacidad y términos y condiciones. Los
 * textos viven en cameia-web (namespace `legal`) y esta es su versión, con el
 * formato `AAAA-MM-vN`. El registro y la reaceptación la envían como
 * `policyVersion`; si Cuentas tiene otra vigente responde `422
 * POLICY_VERSION_OUTDATED`. Al publicar textos nuevos se cambia aquí y en
 * `CAMEIA_POLICY_VERSION` de Cuentas, el mismo día.
 */
export const POLICY_VERSION = '2026-11-v1';
