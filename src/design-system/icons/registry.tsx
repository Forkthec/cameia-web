/**
 * Único archivo del proyecto autorizado a importar de `lucide-react`
 * (CLAUDE.md §3.3), bloqueado en eslint.config.js para cualquier otro
 * archivo mediante `no-restricted-imports`.
 *
 * Expone el mapa {@link icons}, que traduce nombres semánticos de CAMEIA a un
 * componente de ícono concreto. La mayoría son temporales de Lucide mientras
 * no exista su SVG exportado de Figma (ver design-system/icons/svg/README.md);
 * `google` ya migró a su SVG real. Migrar un ícono es cambiar su línea aquí,
 * sin tocar `Icon.tsx` ni a quien consuma `<Icon name="..." />`.
 */
import {
  ArrowLeftRight,
  ArrowRight,
  Briefcase,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Dumbbell,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe,
  Home,
  Info,
  LoaderCircle,
  Lock,
  Mail,
  LogOut,
  Mic,
  MessageCircle,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  X,
} from 'lucide-react';
import { GoogleIcon } from './GoogleIcon';

/**
 * Mapa de nombre semántico → componente de ícono.
 *
 * Se usan los nombres canónicos actuales de Lucide, no sus alias deprecados
 * (p. ej. `CircleCheckBig` en vez de `CheckCircle`), para no depender de
 * exports que la librería ya marcó para retirar en una futura versión mayor.
 */
export const icons = {
  home: Home, // temporal · Lucide, reemplazar por SVG de Figma
  dumbbell: Dumbbell, // temporal · Lucide, reemplazar por SVG de Figma
  microphone: Mic, // temporal · Lucide, reemplazar por SVG de Figma
  message: MessageCircle, // temporal · Lucide, reemplazar por SVG de Figma
  document: FileText, // temporal · Lucide, reemplazar por SVG de Figma
  briefcase: Briefcase, // temporal · Lucide, reemplazar por SVG de Figma
  'check-circle': CircleCheckBig, // temporal · Lucide, reemplazar por SVG de Figma
  clock: Clock, // temporal · Lucide, reemplazar por SVG de Figma
  chart: ChartColumn, // temporal · Lucide, reemplazar por SVG de Figma
  flame: Flame, // temporal · Lucide, reemplazar por SVG de Figma
  'chevron-left': ChevronLeft, // temporal · Lucide, reemplazar por SVG de Figma
  'chevron-right': ChevronRight, // temporal · Lucide, reemplazar por SVG de Figma
  'chevron-down': ChevronDown, // temporal · Lucide, reemplazar por SVG de Figma
  close: X, // temporal · Lucide, reemplazar por SVG de Figma
  plus: Plus, // temporal · Lucide, reemplazar por SVG de Figma
  trash: Trash2, // temporal · Lucide, reemplazar por SVG de Figma
  edit: Pencil, // temporal · Lucide, reemplazar por SVG de Figma
  upload: Upload, // temporal · Lucide, reemplazar por SVG de Figma
  eye: Eye, // temporal · Lucide, reemplazar por SVG de Figma
  'eye-off': EyeOff, // temporal · Lucide, reemplazar por SVG de Figma
  'alert-circle': CircleAlert, // temporal · Lucide, reemplazar por SVG de Figma
  'alert-triangle': TriangleAlert, // temporal · Lucide, reemplazar por SVG de Figma
  info: Info, // temporal · Lucide, reemplazar por SVG de Figma
  sparkles: Sparkles, // temporal · Lucide, reemplazar por SVG de Figma
  user: User, // temporal · Lucide, reemplazar por SVG de Figma
  settings: Settings, // temporal · Lucide, reemplazar por SVG de Figma
  'log-out': LogOut, // temporal · Lucide, reemplazar por SVG de Figma
  mail: Mail, // temporal · Lucide, reemplazar por SVG de Figma
  globe: Globe, // temporal · Lucide, reemplazar por SVG de Figma
  'arrow-right': ArrowRight, // temporal · Lucide, reemplazar por SVG de Figma
  // Sin equivalente en Figma (el nodo real usa icon/chevron-right, ver
  // LanguageSwitcher.tsx): se agrega para la fila de idioma del menú de
  // usuario, pedido explícito del usuario (CM-194, seguimiento UI/UX) —
  // "intercambio" comunica mejor que un clic alterna el valor, en vez de
  // sugerir que se despliega un submenú.
  swap: ArrowLeftRight,
  'loading-arc': LoaderCircle, // temporal · Lucide, reemplazar por SVG de Figma
  lock: Lock, // temporal · Lucide, reemplazar por SVG de Figma
  // "google" ya usa el SVG real exportado de Figma (icon/google, nodo
  // 78:626), no un placeholder de Lucide: el set de Lucide no incluye logos
  // de marca. Excepción explícita a R2 (4 colores fijos de marca de Google),
  // documentada en el propio archivo de diseño.
  google: GoogleIcon,
} as const;
