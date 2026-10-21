/**
 * Lee la entrada del chat que deja la pantalla de inicio (HU-4.5) en el
 * estado de la navegación. Las features no se importan entre sí (CLAUDE.md
 * §3.4), así que el chat no confía en un tipo compartido: valida la forma
 * en tiempo de ejecución y, si no la reconoce, devuelve `null`.
 *
 * Sin HU-5.7 (retomar), una recarga pierde ese estado y el backlog pide
 * iniciar otra entrevista (HU-5.7, «mientras no esté disponible»).
 */
import type { SessionEntry } from './interviewSession.types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * @param state `location.state` de react-router.
 * @returns la entrada del chat, o `null` si falta o no tiene la forma esperada.
 */
export function readSessionEntry(state: unknown): SessionEntry | null {
  if (!isRecord(state) || !isRecord(state.question) || !isRecord(state.progress)) return null;
  const { sessionId, answerFormat, question, progress } = state;
  if (typeof sessionId !== 'string' || (answerFormat !== 'TEXTO' && answerFormat !== 'AUDIO')) {
    return null;
  }
  if (
    typeof question.turnId !== 'string' ||
    typeof question.number !== 'number' ||
    typeof question.text !== 'string' ||
    typeof progress.current !== 'number' ||
    typeof progress.total !== 'number'
  ) {
    return null;
  }
  return {
    sessionId,
    answerFormat,
    question: { turnId: question.turnId, number: question.number, text: question.text },
    progress: { current: progress.current, total: progress.total },
  };
}
