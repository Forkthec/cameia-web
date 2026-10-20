/**
 * Estado efimero del wizard de configuracion de entrevista (Zustand).
 * Mantiene en memoria las elecciones del usuario entre pasos; los datos
 * no se persisten hasta HU-4.4 (crear sesion). CLAUDE.md §3.6: este es
 * estado de cliente (borrador de wizard), no datos del servidor.
 *
 * Valores por defecto de HU-4.3: modo SIMULACION (CA-4.3.1),
 * tono PROFESIONAL_NEUTRO (CA-4.3.2), forma de respuesta AUDIO (CA-4.3.3),
 * idioma es-CO (CA-4.3.4).
 */
import { create } from 'zustand';
import type {
  InterviewSetupData,
  InterviewMode,
  InterviewTone,
  AnswerFormat,
  SessionLanguage,
} from '../model/interviewSetup.types';

interface InterviewSetupState extends InterviewSetupData {
  currentStep: number;
  setProfile: (profileId: string) => void;
  setJobOffer: (jobOffer: string | null) => void;
  setTargetRole: (roleId: string | null) => void;
  setMode: (mode: InterviewMode) => void;
  setTone: (tone: InterviewTone) => void;
  setAnswerFormat: (format: AnswerFormat) => void;
  setSessionLanguage: (lang: SessionLanguage) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  reset: () => void;
}

const INITIAL_STATE: InterviewSetupData & { currentStep: number } = {
  currentStep: 0,
  profileId: null,
  jobOffer: null,
  targetRoleId: null,
  mode: 'SIMULACION',
  tone: 'PROFESIONAL_NEUTRO',
  answerFormat: 'AUDIO',
  sessionLanguage: 'es-CO',
};

export const useInterviewSetupStore = create<InterviewSetupState>((set) => ({
  ...INITIAL_STATE,
  setProfile: (profileId) => set({ profileId }),
  setJobOffer: (jobOffer) => set({ jobOffer }),
  setTargetRole: (roleId) => set({ targetRoleId: roleId }),
  setMode: (mode) => set({ mode }),
  setTone: (tone) => set({ tone }),
  setAnswerFormat: (format) => set({ answerFormat: format }),
  setSessionLanguage: (lang) => set({ sessionLanguage: lang }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  goToStep: (step) => set({ currentStep: step }),
  reset: () => set(INITIAL_STATE),
}));
