/**
 * Hook de TanStack Query para el catalogo de roles profesionales (CA-4.2.5).
 * El catalogo rara vez cambia, asi que se cachea con `staleTime` largo.
 * El idioma del catalogo sigue el idioma activo de la interfaz (§7).
 * CLAUDE.md §3.6: datos del servidor en TanStack Query, no en Zustand.
 */
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchRoleCatalog } from '../api/interviewSetup.api';

export function useRoleCatalog() {
  const { i18n } = useTranslation();
  const lang = i18n.language === 'en' ? 'en' : 'es';

  return useQuery({
    queryKey: ['roles', 'catalog', lang],
    queryFn: () => fetchRoleCatalog(lang),
    staleTime: 5 * 60 * 1000,
  });
}
