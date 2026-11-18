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
- Textos y fecha de vigencia (18 de noviembre de 2026) del anexo de Backend del 14-11-2026
  (`14112026_v1_anexo-textos-legales-para-frontend.json`), pegados tal cual en
  `es-CO/legal.json`. Siguen en revisión: si cambian, se pega el archivo nuevo sin tocar código.
- En inglés no hay traducción aprobada: `en/legal.json` no trae secciones ni fecha, así que se
  muestra el texto en español (`fallbackLng`).

## 3. Comportamiento esperado

| Estado | Qué se ve |
| ------ | --------- |
| Carga | No aplica: el texto viene empaquetado en i18n, sin petición. |
| Vacío | Título y versión, sin secciones (si un documento no trae texto). |
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

- Ninguno. Los textos pueden cambiar tras la revisión del equipo (aviso de Backend, 3.3).

## 9. Notas

- No hay prototipo en Figma para estas páginas: se usan los tokens y el `Logo` existentes.
