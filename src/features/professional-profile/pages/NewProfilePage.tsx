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
 * CA-2.2.2 (ruta de IA): la tarjeta de IA está deshabilitada, no hace nada
 * aquí. Ver SPEC §3.1 y §9.
 *
 * **CM-270 (CA-2.2.3):** el rechazo por cupo agotado (`409` hoy, `403` cuando
 * Backend despliegue `PLAN_LIMIT`) se reconoce con `isProfileLimitReached` y
 * muestra `profile:metodo.errorCupoPlan`, versión provisional del Paywall
 * (Sprint 3). Sustituye al mensaje de CM-195 (decisión D-I), que trataba
 * cualquier `409` como «ya tienes un perfil». Cualquier otro fallo sigue
 * mostrando `errors:generico`.
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
import { httpClient } from '@/services/http/httpClient';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { isProfileLimitReached } from '../model/profileLimit';
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

  const isLimitReached = createProfile.isError && isProfileLimitReached(createProfile.error);

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
            ? isLimitReached
              ? t('profile:metodo.errorCupoPlan')
              : t('errors:generico')
            : undefined
        }
      />
    </section>
  );
}
