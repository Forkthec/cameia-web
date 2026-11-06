/**
 * Comportamiento observable de `ProfileSectionsLayout` (PRT-02.03): en
 * desktop muestra `StepList` con las secciones recibidas y todo el
 * contenido visible a la vez; en móvil muestra un disparador por sección
 * con `aria-expanded`, cada una se abre de forma independiente sin
 * colapsar las demás, y nunca aparece una sección que la página no le pasó
 * (por ejemplo "Expectativas Profesionales" — SPEC.md §9, decisión D-D).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ProfileSectionsLayout, type ProfileSection } from './ProfileSectionsLayout';

const sections: ProfileSection[] = [
  {
    id: 'general-info',
    label: 'Información General',
    status: 'complete',
    content: <p>Formulario A</p>,
  },
  {
    id: 'education',
    label: 'Formación académica',
    status: 'current',
    content: <p>Formulario B</p>,
  },
  {
    id: 'work-experience',
    label: 'Experiencia Laboral',
    status: 'upcoming',
    content: <p>Formulario C</p>,
  },
];

describe('ProfileSectionsLayout', () => {
  it('en desktop muestra el índice StepList y todo el contenido visible', () => {
    render(
      <ProfileSectionsLayout sections={sections} isDesktop stepListLabel="Secciones del perfil" />,
    );

    expect(screen.getByRole('list', { name: 'Secciones del perfil' })).toBeInTheDocument();
    expect(screen.getByText('Formulario A')).toBeInTheDocument();
    expect(screen.getByText('Formulario B')).toBeInTheDocument();
    expect(screen.getByText('Formulario C')).toBeInTheDocument();
  });

  it('en móvil muestra un disparador colapsado por sección, salvo la actual', () => {
    render(
      <ProfileSectionsLayout
        sections={sections}
        isDesktop={false}
        stepListLabel="Secciones del perfil"
      />,
    );

    expect(screen.getByRole('button', { name: 'Información General' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Formación académica' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.queryByText('Formulario A')).not.toBeInTheDocument();
    expect(screen.getByText('Formulario B')).toBeInTheDocument();
  });

  it('cada sección del acordeón se abre de forma independiente, sin colapsar las demás', async () => {
    const user = userEvent.setup();
    render(
      <ProfileSectionsLayout
        sections={sections}
        isDesktop={false}
        stepListLabel="Secciones del perfil"
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Información General' }));

    expect(screen.getByText('Formulario A')).toBeInTheDocument();
    // La sección que ya estaba abierta ("Formación académica") sigue abierta.
    expect(screen.getByText('Formulario B')).toBeInTheDocument();
  });

  it('nunca muestra una sección que la página no le pasó', () => {
    render(
      <ProfileSectionsLayout sections={sections} isDesktop stepListLabel="Secciones del perfil" />,
    );

    expect(screen.queryByText('Expectativas Profesionales')).not.toBeInTheDocument();
  });

  it('CM-195: muestra secondaryLabel en el StepList (desktop) y en el disparador del acordeón (móvil)', () => {
    const sectionsWithOptional: ProfileSection[] = [
      ...sections,
      {
        id: 'skills',
        label: 'Habilidades',
        secondaryLabel: 'Opcional',
        status: 'upcoming',
        content: <p>Formulario D</p>,
      },
    ];

    const { unmount } = render(
      <ProfileSectionsLayout
        sections={sectionsWithOptional}
        isDesktop
        stepListLabel="Secciones del perfil"
      />,
    );
    expect(screen.getByText('Opcional')).toBeInTheDocument();
    unmount();

    render(
      <ProfileSectionsLayout
        sections={sectionsWithOptional}
        isDesktop={false}
        stepListLabel="Secciones del perfil"
      />,
    );
    expect(screen.getByRole('button', { name: 'Habilidades Opcional' })).toBeInTheDocument();
  });
});
