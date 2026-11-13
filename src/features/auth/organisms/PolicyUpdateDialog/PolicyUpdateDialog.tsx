/**
 * Aviso de política nueva (CM-365, criterio 5): no se puede cerrar
 * (`Modal` con `dismissible={false}`) hasta marcar la casilla y aceptar. Enlaza
 * las tres políticas en otra pestaña, como el registro. Recibe los textos ya
 * traducidos (CLAUDE.md §14.7).
 */
import { useState } from 'react';
import { Checkbox } from '@/design-system/atoms/Checkbox';
import { ErrorText } from '@/design-system/atoms/ErrorText';
import { Modal } from '@/design-system/organisms/Modal';

interface PolicyUpdateDialogProps {
  /** Título: el nombre de la política de tratamiento de datos. */
  title: string;
  /** Texto de la casilla. */
  acceptLabel: string;
  /** Mensaje si se pulsa la acción sin marcar la casilla. */
  requiredMessage: string;
  /** Botón que guarda la aceptación. */
  confirmLabel: string;
  /** Gerundio mientras se guarda. */
  confirmingLabel: string;
  /** Enlaces a las tres políticas; se abren en otra pestaña. */
  links: { label: string; to: string }[];
  /** Nombre accesible del grupo de enlaces. */
  linksLabel: string;
  /** `true` mientras Cuentas guarda la aceptación. */
  isAccepting: boolean;
  /** Error al guardar, ya traducido. */
  errorMessage?: string;
  /** Guarda la aceptación. */
  onAccept: () => void;
}

export function PolicyUpdateDialog({
  title,
  acceptLabel,
  requiredMessage,
  confirmLabel,
  confirmingLabel,
  links,
  linksLabel,
  isAccepting,
  errorMessage,
  onAccept,
}: PolicyUpdateDialogProps) {
  const [checked, setChecked] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const message = errorMessage ?? (attempted && !checked ? requiredMessage : undefined);

  function handleConfirm() {
    setAttempted(true);
    if (checked) onAccept();
  }

  const loading = isAccepting
    ? { primaryActionLoading: true as const, primaryActionLoadingLabel: confirmingLabel }
    : { primaryActionLoading: false as const };

  return (
    <Modal
      dismissible={false}
      title={title}
      primaryActionLabel={confirmLabel}
      onPrimaryAction={handleConfirm}
      {...loading}
    >
      <div className="gap-space-3 flex flex-col">
        <nav aria-label={linksLabel}>
          <ul className="gap-space-1 flex flex-col">
            {links.map((link) => (
              <li key={link.to}>
                <a
                  href={link.to}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-action-primary underline underline-offset-2"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Checkbox
          id="acepta-politica-nueva"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          disabled={isAccepting}
        >
          {acceptLabel}
        </Checkbox>
        {message ? <ErrorText>{message}</ErrorText> : null}
      </div>
    </Modal>
  );
}
