/**
 * `Button.loading` (`design-system/atoms/Button/Button.tsx`) exige el
 * literal `true` — con `loading=true` obliga a pasar `loadingLabel`, y
 * TypeScript no permite angostar un `boolean` en tiempo de ejecución a ese
 * literal directamente. Esta función arma el par de props correcto según
 * el booleano real, para poder "spreadearlo" sobre `<Button>` sin repetir
 * el condicional en cada sitio que necesita un botón cuyo estado de carga
 * depende de una mutación (CM-61: `EducationSection`, `WorkExperienceSection`,
 * `ProfileActionsBar`).
 */
interface Loading {
  loading: true;
  loadingLabel: string;
}

interface NotLoading {
  loading: false;
}

/**
 * @param loading estado real, casi siempre `mutation.isPending`.
 * @param loadingLabel gerundio a mostrar mientras `loading` es `true`.
 * @returns el par de props exacto que `Button` acepta para ese estado.
 */
export function buttonLoadingProps(loading: boolean, loadingLabel: string): Loading | NotLoading {
  return loading ? { loading: true, loadingLabel } : { loading: false };
}
