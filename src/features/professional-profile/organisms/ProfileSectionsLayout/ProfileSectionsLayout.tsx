/**
 * Armazón compartido de `/perfiles/:id/editar` (PRT-02.03): índice de
 * secciones (`step-list` vertical en desktop, acordeón en móvil) que
 * alterna por breakpoint. Verificado contra Figma en vivo (CLAUDE.md §13):
 * nodo `132:200` ("indice-secciones") en `lg`, nodo `142:664`
 * ("acordeon-secciones") en `sm`.
 *
 * Nadie era dueño de este armazón hasta ahora (SPEC.md §3: "todo eso lo
 * posee el armazón compartido, que sigue sin dueño"). Muestra únicamente 3
 * secciones — "Expectativas Profesionales" queda fuera del MVP (decisión
 * D-02) y no se construye ni se lista (SPEC.md §9, decisión D-D):
 * `sections` lo decide quien monta este organismo (`EditProfilePage`), no
 * este componente.
 *
 * `isDesktop` llega por prop en vez de que este organismo llame
 * `useMediaQuery` directamente: así se prueba en ambas ramas sin stub de
 * `matchMedia`, y la página (única capa que ya resuelve el breakpoint para
 * decidir qué `showSectionTitle` pasarle a cada sección) es la única fuente
 * de verdad de en qué modo está la pantalla.
 *
 * El disparador de cada ítem del acordeón vive en un componente interno
 * (`AccordionSection`, no exportado): cada ítem necesita su propio
 * `useDisclosure`, y los hooks no pueden llamarse dentro de un `.map()`.
 * Cada sección se abre y se cierra de forma independiente (no es un
 * acordeón exclusivo): colapsar las demás mientras el usuario escribe en
 * una sería un defecto, no una mejora.
 */
import { useId, type ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { useDisclosure } from '@/hooks/useDisclosure';
import { Icon } from '@/design-system/icons/Icon';
import { StepList, type StepListItem } from '@/design-system/molecules/StepList';
import type { StepStatus } from '@/design-system/molecules/Stepper';

export interface ProfileSection {
  id: string;
  label: string;
  status: StepStatus;
  content: ReactNode;
}

interface AccordionSectionProps {
  section: ProfileSection;
}

function AccordionSection({ section }: AccordionSectionProps) {
  const { isOpen, toggle } = useDisclosure(section.status === 'current');
  const panelId = useId();

  return (
    <div className="bg-bg-surface p-space-4 rounded-lg">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={toggle}
        className="gap-space-2 flex w-full items-center justify-between text-left"
      >
        <span className="text-h2 font-display text-text-primary">{section.label}</span>
        <Icon
          name="chevron-down"
          className={cn('text-text-muted transition-transform', isOpen && 'rotate-180')}
        />
      </button>
      {isOpen ? (
        <div id={panelId} className="pt-space-4">
          {section.content}
        </div>
      ) : null}
    </div>
  );
}

interface ProfileSectionsLayoutProps {
  sections: ProfileSection[];
  /** La página resuelve el breakpoint (`useMediaQuery`) y decide el modo; ver TSDoc de cabecera. */
  isDesktop: boolean;
  /** Nombre accesible de `StepList` en desktop (p. ej. "Secciones del perfil"). */
  stepListLabel: string;
  className?: string;
}

export function ProfileSectionsLayout({
  sections,
  isDesktop,
  stepListLabel,
  className,
}: ProfileSectionsLayoutProps) {
  if (!isDesktop) {
    return (
      <div className={cn('gap-space-3 flex flex-col', className)}>
        {sections.map((section) => (
          <AccordionSection key={section.id} section={section} />
        ))}
      </div>
    );
  }

  const stepListItems: StepListItem[] = sections.map((section) => ({
    label: section.label,
    status: section.status,
  }));

  return (
    <div className={cn('gap-space-6 grid md:grid-cols-[minmax(0,15rem)_1fr]', className)}>
      <div className="bg-bg-surface p-space-5 rounded-lg">
        <StepList items={stepListItems} label={stepListLabel} />
      </div>
      <div className="gap-space-6 flex flex-col">
        {sections.map((section) => (
          <div key={section.id} className="bg-bg-surface p-space-5 rounded-lg">
            {section.content}
          </div>
        ))}
      </div>
    </div>
  );
}
