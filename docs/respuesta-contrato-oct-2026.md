# Cambios del frontend — contratos del 6, 8, 9 y 10 de octubre 2026

**Para:** Paula Andrea Muñoz Delgado (Backend)
**De:** Ana Sofía (Frontend)
**Fecha:** 2026-10-11
**Rama:** `CM-65-habilidades-backlog-v6` · PR #65

---

## Ya implementados en esta rama

Estos cambios ya están en el código del frontend y pasan typecheck, lint y tests:

1. **`fieldOfStudy` eliminado de educación.** Se retiró del tipo `EducationItem`, del DTO
   `AddEducationRequestDto`, del mapper, del schema Zod, del formulario (`EducationSection`),
   de las props de `EditProfilePage`, de los mocks y de todas las pruebas. Las llaves i18n
   `campoEstudio` también se eliminaron de `es-CO` y `en`.

2. **`provenance` ya no se envía en los cuerpos de POST.** Se retiró de los DTOs de request
   (`AddEducationRequestDto`, `AddWorkExperienceRequestDto`, `AddSkillRequestDto`,
   `AddTargetRoleRequestDto`) y del mapper que los construye. Los mocks ahora lo fijan
   internamente como `'MANUAL'`, igual que el backend. El campo sigue existiendo en las
   **respuestas** (el backend lo devuelve) — solo se dejó de enviar.

3. **Longitudes máximas de los campos de texto.** Se agregaron validaciones `.max()` en los
   schemas Zod de educación y experiencia laboral:
   - `company`: 100 caracteres
   - `position`: 100 caracteres
   - `institution`: 150 caracteres
   - `degree`: 150 caracteres

4. **Conteo Unicode con NFC.** Se creó `unicodeLength()` en `src/utils/unicodeLength.ts` que
   cuenta puntos de código tras normalización NFC, igual que el backend. Listo para usar en
   las validaciones `.max()` cuando se conecte (por ahora Zod sigue contando con `.length`,
   que en la inmensa mayoría de los casos coincide).

5. **Mejora del strip de diacríticos en habilidades.** `SkillsSection` ahora usa
   `/\p{M}/gu` (Unicode-aware) para quitar marcas combinantes, y colapsa espacios múltiples.

## Pendientes (esperan que el backend se despliegue en staging o se confirme el contrato)

6. **Validación de caracteres de control** en los schemas Zod (contrato §4 fila 3).

7. **`startDate` opcional en experiencia laboral** — el backend cambió a que ya no es
   obligatoria. Pendiente de ajustar el schema y el formulario.

8. **`PROFILE_UPDATE_IN_PROGRESS` (409)** — error cuando se intenta editar un perfil que
   tiene otra operación en curso. Falta el manejo en el frontend.

9. **`PROFILE_CREATION_IN_PROGRESS`** reemplaza al `503 PROFILE_CREATION_TIMEOUT`. Pendiente
   de migrar el manejo de errores.

10. **`PLAN_LIMIT` (403)** reemplaza al `409` para cuota de perfiles del plan. Pendiente.

11. **Migración de códigos de error de rol objetivo de 422 a 409.** Pendiente de que el
    backend lo despliegue.

12. **`GET /api/v1/users/me`** — nuevo endpoint. No hay UI urgente para esto.

---

**Nota:** Estos cambios son retrocompatibles con el backend actual de staging. Los campos
eliminados (`fieldOfStudy`, `provenance` en requests) simplemente dejan de enviarse; un
backend que aún los acepte los ignorará. Los máximos de longitud son validación de cliente
que protege antes de enviar.
