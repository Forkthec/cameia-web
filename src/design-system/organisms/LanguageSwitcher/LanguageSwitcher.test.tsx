/**
 * Comportamiento observable de {@link LanguageSwitcher}: el nombre accesible
 * viene de `label` (nunca hardcodeado, CLAUDE.md §14.7), el idioma activo se
 * refleja con `aria-pressed`, y hacer clic en el otro idioma dispara
 * `onChange` con el código correcto — el propio componente no cambia el
 * idioma de la app, delega esa decisión a quien lo use (HeaderPublico).
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LanguageSwitcher } from './LanguageSwitcher';

describe('LanguageSwitcher', () => {
  it('usa "label" como nombre accesible del grupo', () => {
    render(<LanguageSwitcher value="es" onChange={vi.fn()} label="Idioma de la interfaz" />);

    expect(screen.getByRole('group', { name: 'Idioma de la interfaz' })).toBeInTheDocument();
  });

  it('marca como presionado el idioma activo recibido en "value"', () => {
    render(<LanguageSwitcher value="en" onChange={vi.fn()} label="Idioma de la interfaz" />);

    expect(screen.getByRole('button', { name: 'EN' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'ES' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('llama a "onChange" con el código del idioma en el que se hace clic', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<LanguageSwitcher value="es" onChange={onChange} label="Idioma de la interfaz" />);

    await user.click(screen.getByRole('button', { name: 'EN' }));

    expect(onChange).toHaveBeenCalledWith('en');
  });
});
