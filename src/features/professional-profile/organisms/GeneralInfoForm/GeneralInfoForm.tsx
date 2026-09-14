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
 * **Advertencia para quien arme el armazón compartido:** en `sm`, Figma
 * dibuja el título «Información General» **una sola vez**, como el
 * encabezado del acordeón (`142:667`) — no hay un `<h2>` interno duplicado
 * dentro del contenido expandido. En `lg`, en cambio, el título sí vive
 * dentro del contenido (`140:979`), separado de la etiqueta del índice
 * lateral (`175:1392`, 14px, distinta). Si el acordeón de `sm` monta este
 * organismo completo (con su propio `<h2>`) además de renderizar su propio
 * encabezado de disparador, el título queda duplicado. No se resuelve aquí
 * —depende de cómo se construya ese acordeón, fuera del alcance de CM-53—
 * pero queda registrado para que no se repita el mismo error de no revisar
 * Figma antes de ensamblarlo.
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
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
  /** `true` mientras la mutación de guardado está en curso: deshabilita los campos. */
  isSaving?: boolean;
  onSubmit: (values: GeneralInfoFormValues) => void;
  nameLabel: string;
  /** Copia literal del frame: `Por ejemplo: "Analista de datos" o "Producto senior".` */
  nameHelperText: string;
  /** Copia literal del frame: `Escribe aquí`. */
  namePlaceholder: string;
  /** CA-2.3.5: `name` vacío. */
  nameErrorRequired: string;
  /** CA-2.3.5: `name` mayor a 120 caracteres. */
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
  const { control, handleSubmit } = useForm<GeneralInfoFormValues>({
    resolver: zodResolver(generalInfoSchema),
    defaultValues: { name, summary },
  });

  return (
    <form
      id={formId}
      // gap-space-7 (40px): el mismo espacio que separa "campo-nombre-del-perfil"
      // de "seccion-informacion-general" en el frame (nodo 140:977, "formulario").
      className={cn('gap-space-7 flex flex-col', className)}
      // `handleSubmit` devuelve una función async (el resolver de zod lo es);
      // el `onSubmit` nativo espera `void`, de ahí el `void` explícito.
      onSubmit={(event) => void handleSubmit(onSubmit)(event)}
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
        <h2 className="text-h2 font-display text-text-primary">{sectionTitle}</h2>
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
