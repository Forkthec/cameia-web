/**
 * Aplica el código de verificación de correo que Firebase envía por enlace
 * (CA-1.2.1 / CA-1.2.2, HU-1.2 / CM-180). Extrae `oobCode` de los query
 * params de la URL y llama a `applyActionCode` del servicio de auth.
 *
 * Estados posibles: `idle` (sin código en la URL), `verifying` (llamada en
 * curso), `success` (correo verificado) y `error` (enlace inválido o vencido).
 */
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { applyActionCode, AuthError } from '@/services/firebase/auth.service';

type VerifyStatus = 'idle' | 'verifying' | 'success' | 'error';

interface UseVerifyEmailResult {
  status: VerifyStatus;
  errorCode: string | null;
}

export function useVerifyEmail(): UseVerifyEmailResult {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');
  const [status, setStatus] = useState<VerifyStatus>(oobCode ? 'verifying' : 'idle');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const calledRef = useRef(false);

  useEffect(() => {
    if (!oobCode || calledRef.current) return;
    calledRef.current = true;

    applyActionCode(oobCode)
      .then(() => {
        setStatus('success');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setErrorCode(error instanceof AuthError ? error.code : 'AUTH_UNKNOWN_ERROR');
      });
  }, [oobCode]);

  return { status, errorCode };
}
