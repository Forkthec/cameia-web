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
 * **CM-270 (CA-2.2.3):** el rechazo por cupo agotado (`PROFILE_LIMIT_REACHED`
 * hoy, `PLAN_LIMIT` cuando Backend lo despliegue) se reconoce con
 * `isProfileLimitReached` y muestra `profile:metodo.errorCupoPlan`, versión
 * provisional del Paywall (Sprint 3). Sustituye al mensaje de CM-195
 * (decisión D-I), que trataba cualquier `409` como «ya tienes un perfil».
 *
 * **CM-298 (`ADR-0008`):** ambos casos se reconocen por `code`, no por estado
 * HTTP. `PROFILE_CREATION_IN_PROGRESS` (otra creación sin terminar) muestra
 * `profile:metodo.errorCreacionEnCurso` y la tarjeta sigue activa para
 * reintentar. Cualquier otro fallo, incluido un `409` o `403` sin `code`,
 * muestra `errors:generico`.
 *
 * **DF-004 (CA-2.2.7):** `createProfile.isPending` llega al selector solo tras
 * un re-render, y dos clics a 2,9 ms (QA, staging) se colaron antes de él: dos
 * `POST`. `isCreatingRef` es la guarda síncrona: se levanta en el primer clic y
 * `onSettled` la baja, en éxito y en error, para poder reintentar. Mismo patrón
 * que `isSubmittingRef` de `GeneralInfoForm`. `loading` sigue mostrando el
 * estado (seleccionada y `disabled`) pero ya no es la defensa.
 *
 * Al crear con éxito, guarda el id en `lastUsedProfileId`
 * (`stores/uiPreferences.store.ts`) — conveniencia de cliente ya prevista
 * (`GLO-TBD-06`) pero nunca conectada hasta ahora: es lo que permite que
 * "Perfiles" en `AppShell` deje de mandar siempre aquí una vez que el
 * usuario ya tiene un perfil. También se redirige de inmediato si ese id
 * ya existe al montar esta página — cubre exactamente el caso de "atrás del
 * navegador" que motivó este mensaje de error en primer lugar.
 *
 * **CA-10.4.3 / CA-10.4.4 (backend real):** `lastUsedProfileId` vive solo en
 * este navegador; con otra sesión, otro equipo o tras cerrar sesión llega
 * vacío aunque el Usuario ya tenga perfil, y «Mi Perfil Profesional» o
 * «Perfiles» terminaban aquí ofreciendo crear otro (y el backend respondía
 * con el cupo del plan). Por eso, sin ese id, se consulta
 * `GET /api/v1/profiles`: si hay alguno, se abre su formulario; si no hay o
 * la consulta falla, se muestra la selección del método como antes.
 */
import { useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { httpClient } from '@/services/http/httpClient';
import { useUiPreferencesStore } from '@/stores/uiPreferences.store';
import { isProfileCreationInProgress, isProfileLimitReached } from '../model/profileLimit';
import { Spinner } from '@/design-system/atoms/Spinner';
import { ProfileMethodSelector } from '../organisms/ProfileMethodSelector';

interface CreateProfileResponse {
  id: string;
}

interface ProfileListResponse {
  profiles: { id: string }[];
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

  const existingProfiles = useQuery({
    queryKey: ['profiles', 'list'],
    queryFn: () => httpClient.get<ProfileListResponse>('/api/v1/profiles'),
    enabled: !lastUsedProfileId,
  });
  const existingProfileId = existingProfiles.data?.profiles[0]?.id;

  useEffect(() => {
    if (!existingProfileId) return;
    setLastUsedProfileId(existingProfileId);
    void navigate(ROUTES.perfilEditar(existingProfileId), { replace: true });
  }, [existingProfileId, navigate, setLastUsedProfileId]);

  const isCreatingRef = useRef(false);

  const createProfile = useMutation({
    mutationFn: () => httpClient.post<CreateProfileResponse>('/api/v1/profiles'),
    onSuccess: (profile) => {
      setLastUsedProfileId(profile.id);
      void navigate(ROUTES.perfilEditar(profile.id));
    },
  });

  /** Guarda síncrona contra la doble creación — ver TSDoc de cabecera (DF-004). */
  function handleSelectManual() {
    if (isCreatingRef.current) return;
    isCreatingRef.current = true;
    createProfile.mutate(undefined, {
      onSettled: () => {
        isCreatingRef.current = false;
      },
    });
  }

  let errorMessage: string | undefined;
  if (createProfile.isError) {
    if (isProfileLimitReached(createProfile.error)) {
      errorMessage = t('profile:metodo.errorCupoPlan');
    } else if (isProfileCreationInProgress(createProfile.error)) {
      errorMessage = t('profile:metodo.errorCreacionEnCurso');
    } else {
      errorMessage = t('errors:generico');
    }
  }

  if (lastUsedProfileId || existingProfiles.isPending || existingProfileId) {
    return (
      <div className="py-space-9 flex justify-center">
        <Spinner label={t('common:estados.cargando')} />
      </div>
    );
  }

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
        onSelectManual={handleSelectManual}
        loading={createProfile.isPending}
        errorMessage={errorMessage}
      />
    </section>
  );
}
