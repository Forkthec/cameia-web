/**
 * Dialogo de aviso cuando el usuario tiene una entrevista en curso (CA-4.4.7).
 * Usa el Modal del design system con tres acciones: "Iniciar la nueva" (primaria),
 * "Volver a mi entrevista" (secundaria), y "Cancelar" (cierre).
 */
import { Modal } from '@/design-system/organisms/Modal';

interface InProgressWarningDialogProps {
  title: string;
  message: string;
  startNewLabel: string;
  backToInterviewLabel: string;
  cancelLabel: string;
  onStartNew: () => void;
  onBackToInterview: () => void;
  onCancel: () => void;
}

export function InProgressWarningDialog({
  title,
  message,
  startNewLabel,
  backToInterviewLabel,
  cancelLabel,
  onStartNew,
  onBackToInterview,
  onCancel,
}: InProgressWarningDialogProps) {
  return (
    <Modal
      title={title}
      closeLabel={cancelLabel}
      onClose={onCancel}
      primaryActionLabel={startNewLabel}
      onPrimaryAction={onStartNew}
      secondaryActionLabel={backToInterviewLabel}
      onSecondaryAction={onBackToInterview}
      variant="destructive"
    >
      <p>{message}</p>
    </Modal>
  );
}
