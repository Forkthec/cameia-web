---
feature: legal
estado: EN_CURSO
hu: [HU-1.1]
prt: []
jira: [CM-365, CM-368]
rutas: [/politica-de-tratamiento-de-datos, /aviso-de-privacidad, /terminos-y-condiciones]
documentacion: tsdoc-es
backlog: 16092026_01
decisiones: []
figma: Cameia · Mockups MVP
revisado: 2026-11-12
---

# Feature · Políticas públicas (legal)

## 1. Propósito

Publica las tres políticas que la persona acepta al registrarse (CM-365, criterio 1): política de
tratamiento de datos personales, aviso de privacidad y términos y condiciones. Son públicas: se
abren desde el registro en otra pestaña y también con sesión iniciada.

## 2. Alcance

- Tres rutas públicas, fuera de los guardias de sesión.
- Cada página muestra título, versión vigente (`POLICY_VERSION`), fecha de vigencia y el texto por
  secciones.
- **Pendiente:** el texto aprobado por la Product Owner y la fecha de vigencia. Mientras no
  lleguen, `legal.json` tiene `secciones: []` y `fechaVigencia` vacío.

## 3. Comportamiento esperado

| Estado | Qué se ve |
| ------ | --------- |
| Carga | No aplica: el texto viene empaquetado en i18n, sin petición. |
| Vacío | Título y versión, sin secciones (hoy, hasta tener el texto aprobado). |
| Error | No aplica: no hay red. |
| Éxito | Título, versión, vigencia y secciones con sus párrafos. |

## 4. Contrato observable

La versión que muestra la página es la misma que el registro y el aviso de política nueva envían
como `policyVersion` (`src/config/policy.ts`). Al publicar textos nuevos se cambian `legal.json` y
`POLICY_VERSION` aquí, y `CAMEIA_POLICY_VERSION` en Cuentas, el mismo día.

## 5. Enlace HTTP · PROVISIONAL

Ninguno.

## 6. Criterios de aceptación

| Criterio | Qué hace el frontend |
| -------- | -------------------- |
| CM-365 criterio 1 | Las tres páginas públicas con versión y vigencia, texto editable sin tocar código (namespace `legal`). |

## 7. Estado de implementación

| Archivo | Qué implementa | Prueba |
| ------- | -------------- | ------ |
| `src/features/legal/model/legalDocuments.ts` | Catálogo de las tres políticas y tipo de sección | — |
| `src/features/legal/pages/LegalDocumentPage.tsx` | Página de una política | `src/features/legal/pages/LegalDocumentPage.test.tsx` |
| `src/features/legal/routes.tsx` | Las tres rutas públicas | — |
| `src/i18n/locales/es-CO/legal.json`, `src/i18n/locales/en/legal.json` | Títulos, versión, vigencia y secciones | — |

## 8. Bloqueos

- Falta el texto aprobado de las tres políticas y su fecha de vigencia (Product Owner).

## 9. Notas

- No hay prototipo en Figma para estas páginas: se usan los tokens y el `Logo` existentes.
