import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * `tailwind-merge` reconoce por defecto valores numéricos/arbitrarios para la
 * escala de espaciado (p-4, gap-2...) y solo "in"/"out"/"in-out" para easing.
 * Nuestros tokens de semantic.css usan nombres propios (`p-space-4`,
 * `ease-inout`) que no calzan con esos validadores por defecto, así que sin
 * esta extensión `cn('p-space-2', 'p-space-4')` dejaría AMBAS clases en vez
 * de resolver el conflicto — verificado corriendo tailwind-merge directamente
 * antes de asumirlo. Colores, sombras y tamaños de texto sí son permisivos
 * por defecto (aceptan cualquier nombre) y no necesitan extensión.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: [
        'space-1',
        'space-2',
        'space-3',
        'space-4',
        'space-5',
        'space-6',
        'space-7',
        'space-8',
        'space-9',
      ],
      ease: ['inout'],
    },
  },
});

/**
 * Combina clases condicionales (`clsx`) y resuelve conflictos de utilidades
 * de Tailwind por especificidad de intención, no por orden de aparición
 * (`tailwind-merge`) — así `cn('p-space-2', condicion && 'p-space-4')` deja
 * `p-space-4` cuando `condicion` es verdadera, en vez de que ambas clases
 * convivan y el navegador resuelva el empate por orden en la hoja de estilos.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
