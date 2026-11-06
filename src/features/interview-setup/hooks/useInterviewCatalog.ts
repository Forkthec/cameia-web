/**
 * Hook de TanStack Query para el catálogo de personalización (HU-4.3,
 * CA-4.3.10): modalidades, tonos, formas de respuesta e idiomas, y si cada
 * uno está disponible. Backend no envía `Cache-Control` y pide consultarlo al
 * abrir el asistente, así que no se guarda entre visitas (`gcTime` 0).
 * El `403 EMAIL_NOT_VERIFIED` lo resuelve `httpClient` (aviso 3.4 de Backend).
 */
import { useQuery } from '@tanstack/react-query';
import { fetchInterviewCatalog } from '../api/interviewSetup.api';

export function useInterviewCatalog() {
  return useQuery({
    queryKey: ['interviews', 'config', 'catalog'],
    queryFn: fetchInterviewCatalog,
    gcTime: 0,
  });
}
