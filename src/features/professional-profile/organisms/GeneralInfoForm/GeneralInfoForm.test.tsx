/**
 * Comportamiento observable de `GeneralInfoForm` (HU-2.3, CA-2.3.3,
 * CA-2.3.5): que muestra el encabezado de sección y los valores iniciales,
 * que la ayuda del nombre es la copia literal del frame, que bloquea el
 * envío sin llamar a `onSubmit` cuando `name` queda vacío o supera 255
 * caracteres, que los campos NO cortan lo escrito al llegar al máximo (CM-272,
 * CA-2.3.3 y CA-2.3.10: se puede escribir de más y aparece el aviso, RT-01-CA07)
 * y que el contador refleja el conteo real, y que
 * un envío válido llega a `onSubmit` con los valores actuales. `CM-194`
 * suma: sincroniza `formState.isDirty` con `stores/unsavedChanges.store.ts`
 * mientras el usuario edita, y limpia la bandera al desmontarse.
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';
import { GeneralInfoForm } from './GeneralInfoForm';

const baseProps = {
  formId: 'general-info-form',
  name: 'Ana María Pérez',
  summary: 'Desarrolladora backend con experiencia en Java.',
  sectionTitle: 'Información General',
  onSubmit: () => Promise.resolve(),
  nameLabel: 'Nombre del perfil',
  nameHelperText: 'Por ejemplo: "Analista de datos" o "Producto senior".',
  namePlaceholder: 'Escribe aquí',
  nameErrorRequired: 'Ingresa un nombre para el perfil.',
  nameErrorTooLong: 'El nombre no puede superar los 255 caracteres.',
  summaryLabel: 'Resumen profesional',
  summaryPlaceholder: 'Escribe aquí. Este campo crece con el contenido.',
  summaryErrorTooLong: 'El resumen no puede superar los 2000 caracteres.',
  summaryCounterLabel: (count: number, max: number) => `${count} / ${max} caracteres`,
};

describe('GeneralInfoForm', () => {
  afterEach(() => {
    useUnsavedChangesStore.setState({ hasUnsavedChanges: false });
  });

  it('muestra el encabezado de sección y los valores iniciales de name y summary', () => {
    render(<GeneralInfoForm {...baseProps} />);

    expect(screen.getByRole('heading', { name: 'Información General' })).toBeInTheDocument();
    expect(screen.getByLabelText('Nombre del perfil')).toHaveValue('Ana María Pérez');
    expect(screen.getByLabelText('Resumen profesional')).toHaveValue(
      'Desarrolladora backend con experiencia en Java.',
    );
  });

  it('showSectionTitle=false no renderiza el encabezado de sección (acordeón sm)', () => {
    render(<GeneralInfoForm {...baseProps} showSectionTitle={false} />);

    expect(screen.queryByRole('heading', { name: 'Información General' })).not.toBeInTheDocument();
  });

  it('muestra la ayuda literal del nombre mientras no hay error', () => {
    render(<GeneralInfoForm {...baseProps} />);

    expect(
      screen.getByText('Por ejemplo: "Analista de datos" o "Producto senior".'),
    ).toBeInTheDocument();
  });

  it('el contador refleja el conteo real de summary', () => {
    render(<GeneralInfoForm {...baseProps} />);

    // 'Desarrolladora backend con experiencia en Java.'.length === 47
    expect(screen.getByText('47 / 2000 caracteres')).toBeInTheDocument();
  });

  it('name vacío bloquea el envío y no llama a onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Nombre del perfil'));
    // El botón real que envía este formulario vive fuera de este componente
    // (se conecta por el atributo HTML form, ver TSDoc de cabecera): se
    // dispara el submit del <form> directamente por su id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    expect(await screen.findByText('Ingresa un nombre para el perfil.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('name mayor a 255 caracteres bloquea el envío', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    // El campo ya no lleva `maxLength` (CM-272, CA-2.3.10): los 256 caracteres se
    // escriben de verdad y zod los rechaza al enviar.
    const nameInput = screen.getByLabelText('Nombre del perfil');
    await user.clear(nameInput);
    await user.click(nameInput);
    await user.paste('a'.repeat(256));
    // Ver nota arriba sobre por qué se accede al <form> por id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    expect(
      await screen.findByText('El nombre no puede superar los 255 caracteres.'),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('el resumen admite escribir más de 2000 caracteres sin cortar nada (CA-2.3.3)', async () => {
    const user = userEvent.setup();
    render(<GeneralInfoForm {...baseProps} />);
    const summary = screen.getByLabelText('Resumen profesional');

    await user.clear(summary);
    await user.click(summary);
    await user.paste('a'.repeat(2001));

    expect(summary).toHaveValue('a'.repeat(2001));
    expect(screen.getByText('2001 / 2000 caracteres')).toBeInTheDocument();
  });

  it('un envío válido llega a onSubmit con los valores actuales', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText('Nombre del perfil');
    await user.clear(nameInput);
    await user.type(nameInput, 'Ana Pérez');
    // Ver nota arriba sobre por qué se accede al <form> por id.
    const form = document.getElementById('general-info-form') as HTMLFormElement;
    form.requestSubmit();

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    // Un solo argumento: `trySave` (interno, ver TSDoc de cabecera CM-195) es
    // quien recibe el segundo argumento nativo de RHF, no el `onSubmit` de props.
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      summary: 'Desarrolladora backend con experiencia en Java.',
    });
  });

  it('CM-195: sacar el foco del formulario guarda automáticamente, sin ningún clic', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <div>
        <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
        <button type="button">Fuera del formulario</button>
      </div>,
    );

    await user.type(screen.getByLabelText('Resumen profesional'), ' Node.js.');
    await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana María Pérez',
      summary: 'Desarrolladora backend con experiencia en Java. Node.js.',
    });
  });

  it('CM-195: tabular entre Nombre y Resumen (dentro del formulario) no guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    screen.getByLabelText('Nombre del perfil').focus();
    await user.tab();

    expect(screen.getByLabelText('Resumen profesional')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CM-195: tras un autoguardado exitoso, editar de nuevo y salir vuelve a guardar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <div>
        <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
        <button type="button">Fuera del formulario</button>
      </div>,
    );
    const outsideButton = screen.getByRole('button', { name: 'Fuera del formulario' });

    await user.type(screen.getByLabelText('Resumen profesional'), ' Node.js.');
    await user.click(outsideButton);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    await user.click(screen.getByLabelText('Resumen profesional'));
    await user.type(screen.getByLabelText('Resumen profesional'), ' React.');
    await user.click(outsideButton);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it('CM-195: si el autoguardado falla, el formulario queda con cambios sin guardar', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error('network'));
    render(
      <div>
        <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
        <button type="button">Fuera del formulario</button>
      </div>,
    );

    await user.type(screen.getByLabelText('Resumen profesional'), ' Node.js.');
    await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);
  });

  it('al modificar un campo, marca hasUnsavedChanges en true en el store', async () => {
    const user = userEvent.setup();
    render(<GeneralInfoForm {...baseProps} />);

    await user.type(screen.getByLabelText('Nombre del perfil'), ' Jr.');

    await waitFor(() => {
      expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);
    });
  });

  it('al restaurar el valor original, vuelve a marcar hasUnsavedChanges en false', async () => {
    const user = userEvent.setup();
    render(<GeneralInfoForm {...baseProps} />);
    const nameInput = screen.getByLabelText('Nombre del perfil');

    await user.type(nameInput, ' Jr.');
    await waitFor(() => expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true));
    await user.type(nameInput, '{Backspace>4}');

    await waitFor(() => {
      expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(false);
    });
  });

  it('al desmontarse, limpia hasUnsavedChanges', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<GeneralInfoForm {...baseProps} />);

    await user.type(screen.getByLabelText('Nombre del perfil'), ' Jr.');
    await waitFor(() => expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true));

    unmount();

    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(false);
  });
});

/**
 * CM-272 (HU-2.3, CA-2.3.13 y CA-2.3.14; `SPEC.md` §3.2 «Alcance de CM-272»,
 * puntos 3 y 4, y D-J): el autoguardado pasa de «el foco sale del formulario»
 * a «el foco sale de CADA campo», y solo se envía si el formulario tiene
 * cambios (`formState.isDirty`). **Conflicto deliberado con el test
 * `CM-195: tabular entre Nombre y Resumen (dentro del formulario) no guarda`
 * de arriba**, que afirma hoy lo contrario: se deja intacto y la decisión de
 * reemplazarlo o reescribirlo queda para la implementación. Aquí `onSubmit`
 * es un doble: lo que se prueba es cuándo el formulario decide guardar, no la
 * red.
 */
function settle() {
  return new Promise<void>((resolve) => setTimeout(resolve, 100));
}

describe('GeneralInfoForm · autoguardado por campo y solo con cambios (CM-272)', () => {
  afterEach(() => {
    useUnsavedChangesStore.setState({ hasUnsavedChanges: false });
  });

  it('CM-272: tabular de Nombre a Resumen habiendo cambiado el nombre guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    await user.type(screen.getByLabelText('Nombre del perfil'), ' Jr.');
    await user.tab();

    expect(screen.getByLabelText('Resumen profesional')).toHaveFocus();
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Ana María Pérez Jr.',
      summary: baseProps.summary,
    });
  });

  it('CM-272: salir del campo Nombre con un valor inválido muestra el mensaje y no guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    await user.clear(screen.getByLabelText('Nombre del perfil'));
    await user.tab();

    expect(await screen.findByText(baseProps.nameErrorRequired)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CM-272: salir de un campo sin haber modificado nada no guarda (salida fuera del formulario)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <div>
        <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
        <button type="button">Fuera del formulario</button>
      </div>,
    );

    await user.click(screen.getByLabelText('Nombre del perfil'));
    await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CM-272: tabular entre Nombre y Resumen sin haber modificado nada no guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('Nombre del perfil'));
    await user.tab();
    await settle();

    expect(screen.getByLabelText('Resumen profesional')).toHaveFocus();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('CM-272: tras un guardado fallido el formulario sigue sucio y la siguiente salida de campo reintenta', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(undefined);
    render(
      <div>
        <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
        <button type="button">Fuera del formulario</button>
      </div>,
    );
    const outside = screen.getByRole('button', { name: 'Fuera del formulario' });

    await user.type(screen.getByLabelText('Resumen profesional'), ' Node.js.');
    await user.click(outside);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    expect(useUnsavedChangesStore.getState().hasUnsavedChanges).toBe(true);

    await user.click(screen.getByLabelText('Resumen profesional'));
    await user.click(outside);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it('CM-272 (defecto B): salir de un campo Nombre vacío sin haberlo tocado muestra el mensaje y no guarda', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<GeneralInfoForm {...baseProps} name="" onSubmit={onSubmit} />);

    await user.click(screen.getByLabelText('Nombre del perfil'));
    await user.tab();

    expect(await screen.findByText(baseProps.nameErrorRequired)).toBeInTheDocument();
    await settle();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  describe('CM-272: sin maxLength, el aviso de longitud sale y no se guarda (CA-2.3.3, CA-2.3.10)', () => {
    async function pasteInto(label: string, text: string) {
      const user = userEvent.setup();
      const field = screen.getByLabelText(label);
      await user.clear(field);
      await user.click(field);
      await user.paste(text);
      return { user, field };
    }

    it('CA-2.3.3: 2001 caracteres en el resumen muestran el contador y el mensaje y NO guardan, al salir del campo', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <div>
          <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
          <button type="button">Fuera del formulario</button>
        </div>,
      );

      const { user, field } = await pasteInto('Resumen profesional', 'a'.repeat(2001));
      await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

      expect(await screen.findByText(baseProps.summaryErrorTooLong)).toBeInTheDocument();
      expect(screen.getByText('2001 / 2000 caracteres')).toBeInTheDocument();
      expect(field).toHaveValue('a'.repeat(2001));
      await settle();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('CA-2.3.10: 256 caracteres en el nombre muestran el mensaje y NO guardan, al salir del campo', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <div>
          <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
          <button type="button">Fuera del formulario</button>
        </div>,
      );

      const { user, field } = await pasteInto('Nombre del perfil', 'a'.repeat(256));
      await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

      expect(await screen.findByText(baseProps.nameErrorTooLong)).toBeInTheDocument();
      expect(field).toHaveValue('a'.repeat(256));
      await settle();
      expect(onSubmit).not.toHaveBeenCalled();
    });

    // Guardas por abajo (CA-2.3.7 y CA-2.3.9): pueden nacer verdes; protegen el límite exacto.
    it('CA-2.3.7: 2000 caracteres exactos en el resumen SÍ se guardan', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <div>
          <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
          <button type="button">Fuera del formulario</button>
        </div>,
      );

      const { user } = await pasteInto('Resumen profesional', 'a'.repeat(2000));
      await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
      expect(onSubmit).toHaveBeenCalledWith({
        name: baseProps.name,
        summary: 'a'.repeat(2000),
      });
    });

    it('CA-2.3.9: 255 caracteres exactos en el nombre SÍ se guardan', async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      render(
        <div>
          <GeneralInfoForm {...baseProps} onSubmit={onSubmit} />
          <button type="button">Fuera del formulario</button>
        </div>,
      );

      const { user } = await pasteInto('Nombre del perfil', 'a'.repeat(255));
      await user.click(screen.getByRole('button', { name: 'Fuera del formulario' }));

      await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'a'.repeat(255),
        summary: baseProps.summary,
      });
    });
  });
});
