/**
 * Sección «Información General» del Formulario de Perfil Profesional
 * (HU-2.3, PRT-02.03, CM-53): campo «Nombre del perfil» + sección
 * «Información General» con «Resumen profesional». Layout, jerarquía y
 * copy verificados contra el prototipo real de Figma en **ambos**
 * breakpoints (nodo `140:960` lg, `142:638` sm) — no solo el de escritorio.
 * Ver `docs/bitacora-ia/hallazgo-figma-no-revisado-cm53.md`: la primera
 * versión de este archivo se escribió sin abrir Figma y asumía un layout de
 * asistente por pasos que el frame real no tiene.
 *
 * Los campos en sí (nombre, resumen) son idénticos en ambos breakpoints —
 * mismo componente `input`, mismo copy, mismo alto — así que este organismo
 * no necesita ninguna variante `sm`/`lg` propia. El encabezado de sección
 * tampoco: `text-h2` ya cae de 26px a 21px bajo 599px
 * (`styles/index.css:152-166`), que coincide exacto con el `text/h2-sm` de
 * Figma (21px/700/-1.5).
 *
 * **`showSectionTitle` (CM-61):** en `sm`, Figma dibuja el título
 * «Información General» **una sola vez**, como el encabezado del acordeón
 * (`142:667`) — no hay un `<h2>` interno duplicado dentro del contenido
 * expandido. En `lg`, en cambio, el título sí vive dentro del contenido
 * (`140:979`), separado de la etiqueta del índice lateral (`175:1392`, 14px,
 * distinta). `ProfileSectionsLayout` (el armazón que CM-61 construye)
 * resuelve esto pasando `showSectionTitle={isDesktop}`: en el acordeón móvil
 * el encabezado del propio disparador ya es el título, así que este `<h2>`
 * se omite para no duplicarlo.
 *
 * Deliberadamente NO incluye el campo «Ubicación» que sí aparece en el
 * frame: ningún CA de HU-2.3 lo pide, no existe en `GLOSSARY.md` ni en el
 * contrato — es el bloqueo C-10 de `SPEC.md` §8 (CLAUDE.md §16: en
 * comportamiento manda el backlog, siempre, aunque Figma ya lo dibuje).
 *
 * Tampoco arma el `<h2>Información General</h2>` como una pieza aislada de
 * layout de página: esta sección se renderiza como fragmento, lista para
 * insertarse dentro del armazón compartido (índice de secciones + barra de
 * acciones) que construye quien lo arme primero — no es trabajo de CM-53
 * (SPEC.md §3.2, §9).
 *
 * Se renderiza como `<form id={formId}>` para que, cuando exista el botón
 * real («Guardar borrador», fuera de este componente), pueda enviarlo por
 * el atributo HTML `form` en vez de por `onClick`.
 *
 * Los campos van por `<Controller>`, no por `register()`: `Input` (átomo
 * del design system) no acepta `ref` — no usa `forwardRef` ni expone `ref`
 * entre sus props (verificado leyendo `design-system/atoms/Input/Input.tsx`) —
 * así que `register()` no tiene dónde enganchar el nodo del DOM.
 *
 * `name`/`summary` (los valores iniciales) se pasan por props en vez de que
 * el propio formulario haga el `fetch`: quien lo monta decide cuándo hay
 * datos suficientes para montar el formulario, y este componente no
 * necesita saber que existe una petición de red detrás.
 *
 * Igual que `ProfileMethodSelector` (CM-46), sigue la regla de CLAUDE.md
 * §14.7 aunque viva en `features`: no llama `useTranslation`, todo texto
 * visible entra como prop obligatoria (consistencia deliberada con ese
 * organismo, no la alternativa de traducir aquí mismo).
 *
 * Sincronización con `stores/unsavedChanges.store.ts` (`CM-194`, `SPEC.md`
 * de `features/auth` §3): este es el único formulario de la app con una
 * ventana real de "cambios sin guardar" (Educación/Experiencia/Habilidades/
 * Roles Objetivo persisten al vuelo por ítem, sin borrador — decisión `D-C`
 * ya documentada). `formState.isDirty` ya lo provee `react-hook-form`; antes
 * de esta iteración no se leía. El segundo efecto limpia la bandera al
 * desmontar — no lo pide la SPEC textualmente, pero sin él un `isDirty` en
 * `true` quedaría "pegado" si el usuario navega fuera sin guardar y sin que
 * `isDirty` vuelva a `false` por su cuenta.
 *
 * **Autoguardado en `onBlur` (CM-195, decisión D-H):** antes de esta
 * iteración, este formulario solo se enviaba cuando "Guardar borrador"
 * (fuera de este componente) lo disparaba por el atributo HTML `form` —
 * llenar los campos y nunca hacer ese clic perdía el dato en silencio. El
 * `onBlur` del `<form>` (React lo hace burbujear vía `focusout`) dispara un
 * guardado automático, pero solo cuando el foco sale del formulario
 * **completo** (`!event.currentTarget.contains(event.relatedTarget)`) —
 * tabular entre "Nombre" y "Resumen" no dispara nada, solo salir de la
 * sección. `trySave` es el único punto de entrada tanto para ese blur como
 * para el `submit` nativo del botón externo — la validación de zod sigue
 * siendo la única puerta, nunca se guarda un `name` vacío por accidente.
 *
 * `isSubmittingRef` existe por una colisión real: al hacer clic en "Guardar
 * borrador" (vive fuera de este `<form>`), el navegador dispara primero el
 * `blur` del campo enfocado y luego el `submit` del clic — sin el guard,
 * eso son dos `PATCH` seguidos con los mismos valores. Tras un guardado
 * exitoso, `reset(values)` mueve el punto de referencia de "sucio" al valor
 * recién confirmado — si el usuario edita de nuevo, `isDirty` vuelve a
 * `true` y el siguiente blur-fuera-del-formulario guarda otra vez, sin
 * límite. En error, no se llama `reset`: el campo queda "sucio" a propósito,
 * así el próximo blur reintenta solo, sin perder el cambio.
 *
 * `onSubmit` cambia de `(values) => void` a `(values) => Promise<void>`
 * porque `trySave` necesita esperarlo antes de decidir si limpia `isDirty`.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useUnsavedChangesStore } from '@/stores/unsavedChanges.store';
import { cn } from '@/utils/cn';
import { Input } from '@/design-system/atoms/Input';
import { CharacterCounter } from '@/design-system/molecules/CharacterCounter';
import { FormField } from '@/design-system/molecules/FormField';
import { NAME_MAX_LENGTH, SUMMARY_MAX_LENGTH } from '../../model/profile.constants';
import { generalInfoSchema, type GeneralInfoFormValues } from '../../schemas/generalInfo.schema';

interface GeneralInfoFormProps {
  /** Id del `<form>`, para que el botón real de guardado (fuera de este componente) lo envíe por el atributo HTML `form`. */
  formId: string;
  name: string;
  summary: string;
  /** «Información General» — encabezado de la sección (nodo `140:979` del frame). */
  sectionTitle: string;
  /** `false` en el acordeón `sm`, donde el encabezado del propio disparador ya es el título (CM-61). */
  showSectionTitle?: boolean;
  /** `true` mientras la mutación de guardado está en curso: deshabilita los campos. */
  isSaving?: boolean;
  onSubmit: (values: GeneralInfoFormValues) => Promise<void>;
  nameLabel: string;
  /** Copia literal del frame: `Por ejemplo: "Analista de datos" o "Producto senior".` */
  nameHelperText: string;
  /** Copia literal del frame: `Escribe aquí`. */
  namePlaceholder: string;
  /** CA-2.3.5: `name` vacío. */
  nameErrorRequired: string;
  /** CA-2.3.5: `name` mayor a 255 caracteres. */
  nameErrorTooLong: string;
  summaryLabel: string;
  /** Copia literal del frame: `Escribe aquí. Este campo crece con el contenido.` */
  summaryPlaceholder: string;
  /** CA-2.3.3: red de seguridad si `summary` llega a superar 2000 caracteres pese al `maxLength` del campo. */
  summaryErrorTooLong: string;
  /** Recibe el conteo y el máximo ya interpolados (ver `CharacterCounter`). */
  summaryCounterLabel: (count: number, max: number) => string;
  className?: string;
}

export function GeneralInfoForm({
  formId,
  name,
  summary,
  sectionTitle,
  showSectionTitle = true,
  isSaving = false,
  onSubmit,
  nameLabel,
  nameHelperText,
  namePlaceholder,
  nameErrorRequired,
  nameErrorTooLong,
  summaryLabel,
  summaryPlaceholder,
  summaryErrorTooLong,
  summaryCounterLabel,
  className,
}: GeneralInfoFormProps) {
  const { control, handleSubmit, formState, reset } = useForm<GeneralInfoFormValues>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: { name, summary },
  });

  useEffect(() => {
    useUnsavedChangesStore.getState().setUnsavedChanges(formState.isDirty);
  }, [formState.isDirty]);

  useEffect(() => {
    return () => useUnsavedChangesStore.getState().setUnsavedChanges(false);
  }, []);

  const isSubmittingRef = useRef(false);

  /** Único punto de entrada del guardado (blur-fuera-del-formulario y submit nativo) — ver TSDoc de cabecera. */
  async function trySave(values: GeneralInfoFormValues) {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    try {
      await onSubmit(values);
      reset(values);
    } catch {
      // El error ya lo muestra la página (`updateGeneralInfo.isError`); el
      // formulario queda "sucio" a propósito — el próximo blur reintenta solo.
    } finally {
      isSubmittingRef.current = false;
    }
  }

  return (
    <form
      id={formId}
      // gap-space-7 (40px): el mismo espacio que separa "campo-nombre-del-perfil"
      // de "seccion-informacion-general" en el frame (nodo 140:977, "formulario").
      className={cn('gap-space-7 flex flex-col', className)}
      // `handleSubmit` devuelve una función async (el resolver de zod lo es);
      // el `onSubmit` nativo espera `void`, de ahí el `void` explícito.
      onSubmit={(event) => void handleSubmit(trySave)(event)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          void handleSubmit(trySave)();
        }
      }}
      noValidate
    >
      <Controller
        control={control}
        name="name"
        render={({ field, fieldState }) => (
          <FormField
            label={nameLabel}
            helperText={fieldState.error ? undefined : nameHelperText}
            error={
              fieldState.error?.type === 'too_small'
                ? nameErrorRequired
                : fieldState.error?.type === 'too_big'
                  ? nameErrorTooLong
                  : undefined
            }
          >
            <Input
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={namePlaceholder}
              maxLength={NAME_MAX_LENGTH}
              state={isSaving ? 'disabled' : fieldState.error ? 'error' : 'default'}
            />
          </FormField>
        )}
      />

      {/* seccion-informacion-general (nodo 140:978): encabezado + resumen.
          El campo "Ubicación" del frame se omite a propósito — bloqueo C-10. */}
      <div className="gap-space-4 flex flex-col">
        {showSectionTitle ? (
          <h2 className="text-h2 font-display text-text-primary">{sectionTitle}</h2>
        ) : null}
        <Controller
          control={control}
          name="summary"
          render={({ field, fieldState }) => (
            <div className="gap-space-1 flex flex-col">
              <FormField
                label={summaryLabel}
                error={fieldState.error?.type === 'too_big' ? summaryErrorTooLong : undefined}
              >
                <Input
                  type="textarea"
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder={summaryPlaceholder}
                  maxLength={SUMMARY_MAX_LENGTH}
                  state={isSaving ? 'disabled' : fieldState.error ? 'error' : 'default'}
                />
              </FormField>
              <CharacterCounter
                count={field.value.length}
                max={SUMMARY_MAX_LENGTH}
                formatLabel={summaryCounterLabel}
              />
            </div>
          )}
        />
      </div>
    </form>
  );
}
