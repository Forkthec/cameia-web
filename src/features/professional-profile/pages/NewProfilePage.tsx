/**
 * CM-46 · HU-2.2 · PRT-02.02 — Selección del método de configuración del
 * perfil. Sin campo de nombre, sin stepper ni botón "Continuar": tocar
 * "Llenado Manual" ES la acción (CA-2.2.1). Vive bajo `AppShell`
 * (NavHeader/TabBar), no bajo `WizardLayout` — no renderiza ningún layout
 * propio (SPEC professional-profile §9).
 *
 * `POST /api/v1/profiles` se llama sin cuerpo (CA-2.2.1: "el POST de
 * creación no recibe body"). Se tipa aquí mismo `{ id: string }`, el único
 * campo que esta página necesita, en vez de crear ya `api/*.dto.ts` —
 * CLAUDE.md §8 deja esa capa para el final, y el contrato real todavía
 * tiene bloqueos abiertos (C-01, C-02). Deuda anotada en SPEC §9: la
 * petición tampoco envía la cabecera `X-User-Id` que la respuesta del PO
 * menciona para HU-2.2 (C-02) — funciona contra el mock, no necesariamente
 * contra el backend real.
 *
 * CA-2.2.2 (ruta de IA) y CA-2.2.3 (rechazo por límite de cupo) NO se
 * implementan: la tarjeta de IA está deshabilitada (Sprint 2) y el mock no
 * modela ningún límite de plan. Ver SPEC §3.1 y §9.
 *
 * **CM-195 (decisión D-I):** `ProfileAlreadyExistsException`/`409` es real
 * (`ProfileController.java#createProfile`, confirmado contra el código
 * fuente) — un usuario que ya tiene un perfil y de todas formas llega aquí
 * (p. ej. por el botón atrás del navegador) ve un mensaje propio, no el
 * genérico de `errors:generico`. Sin `errors[]` en ese `409` (no es un
 * campo inválido), así que basta `ApiError.isConflict()`.
 *
 * Al crear con éxito, guarda el id en `lastUsedProfileId`
 * (`stores/uiPreferences.store.ts`) — conveniencia de cliente ya prevista
 * (`GLO-TBD-06`) pero nunca conectada hasta ahora: es lo que permite que
 * "Perfiles" en `AppShell` deje de mandar siempre aquí una vez que el
 * usuario ya tiene un perfil. También se redirige de inmediato si ese id
 * ya existe al montar esta página — cubre exactamente el caso de "atrás del
 * navegador" que motivó este mensaje de error en primer lugar.
 */
import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { ApiError } from '@/services/http/ApiError';
import { httpClient } from '@/services/http/httpClient';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { ProfileMethodSelector } from '../organisms/ProfileMethodSelector';

interface CreateProfileResponse {
  id: string;
}

export function NewProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'errors']);
  const navigate = useNavigate();
  const lastUsedProfileId = useUiPreferencesStore((state) => state.lastUsedProfileId);
  const setLastUsedProfileId = useUiPreferencesStore((state) => state.setLastUsedProfileId);

  useEffect(() => {
    if (lastUsedProfileId) {
      void navigate(ROUTES.perfilEditar(lastUsedProfileId), { replace: true });
    }
    // Solo al montar: si `lastUsedProfileId` cambia después (p. ej. por otra
    // pestaña), no se quiere interrumpir a alguien ya interactuando aquí.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createProfile = useMutation({
    mutationFn: () => httpClient.post<CreateProfileResponse>('/api/v1/profiles'),
    onSuccess: (profile) => {
      setLastUsedProfileId(profile.id);
      void navigate(ROUTES.perfilEditar(profile.id));
    },
  });

  const isAlreadyExists =
    createProfile.isError &&
    createProfile.error instanceof ApiError &&
    createProfile.error.isConflict();

  return (
    <section className="py-space-6 mx-auto max-w-[45rem]">
      <h1 className="text-h1 font-display mb-space-6">{t('profile:metodo.titulo')}</h1>
      <ProfileMethodSelector
        groupLabel={t('profile:metodo.grupoEtiqueta')}
        manualTitle={t('profile:metodo.manual.titulo')}
        manualDescription={t('profile:metodo.manual.descripcion')}
        aiTitle={t('profile:metodo.ia.titulo')}
        aiDescription={t('profile:metodo.ia.descripcion')}
        aiBadgeLabel={t('profile:metodo.ia.insignia')}
        loadingLabel={t('common:estados.cargando')}
        onSelectManual={() => createProfile.mutate()}
        loading={createProfile.isPending}
        errorMessage={
          createProfile.isError
            ? isAlreadyExists
              ? t('profile:metodo.errorYaExiste')
              : t('errors:generico')
            : undefined
        }
      />
    </section>
  );
}
