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
 */
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { ROUTES } from '@/app/router/routes';
import { httpClient } from '@/services/http/httpClient';
import { ProfileMethodSelector } from '../organisms/ProfileMethodSelector';

interface CreateProfileResponse {
  id: string;
}

export function NewProfilePage() {
  const { t } = useTranslation(['profile', 'common', 'errors']);
  const navigate = useNavigate();

  const createProfile = useMutation({
    mutationFn: () => httpClient.post<CreateProfileResponse>('/api/v1/profiles'),
    onSuccess: (profile) => navigate(ROUTES.perfilEditar(profile.id)),
  });

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
        errorMessage={createProfile.isError ? t('errors:generico') : undefined}
      />
    </section>
  );
}
