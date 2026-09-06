// Único archivo del proyecto autorizado a importar de lucide-react (CLAUDE.md §3.3).
// Bloqueado en eslint.config.js para cualquier otro archivo.
import {
  ArrowRight,
  AtSign,
  Briefcase,
  ChartColumn,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock,
  Eye,
  EyeOff,
  FileText,
  Flame,
  Globe,
  Info,
  LoaderCircle,
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

export const icons = {
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
  globe: Globe, // temporal · Lucide, reemplazar por SVG de Figma
  'arrow-right': ArrowRight, // temporal · Lucide, reemplazar por SVG de Figma
  'loading-arc': LoaderCircle, // temporal · Lucide, reemplazar por SVG de Figma
  // temporal · Lucide no tiene logos de marca; reemplazar por el logo oficial de Google en SVG
  google: AtSign,
} as const;
