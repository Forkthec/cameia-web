/**
 * Estado efimero del wizard de configuracion de entrevista (Zustand).
 * Mantiene en memoria las elecciones del usuario entre pasos; los datos
 * no se persisten hasta HU-4.4 (crear sesion). CLAUDE.md §3.6: este es
 * estado de cliente (borrador de wizard), no datos del servidor.
 */
import { create } from 'zustand';
import type { InterviewSetupData } from '../model/interviewSetup.types';

interface InterviewSetupState extends InterviewSetupData {
  currentStep: number;
  setProfile: (profileId: string) => void;
  setJobOffer: (jobOffer: string | null) => void;
  setTargetRole: (roleId: string | null) => void;
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
};

export const useInterviewSetupStore = create<InterviewSetupState>((set) => ({
  ...INITIAL_STATE,
  setProfile: (profileId) => set({ profileId }),
  setJobOffer: (jobOffer) => set({ jobOffer }),
  setTargetRole: (roleId) => set({ targetRoleId: roleId }),
  nextStep: () => set((s) => ({ currentStep: s.currentStep + 1 })),
  prevStep: () => set((s) => ({ currentStep: Math.max(0, s.currentStep - 1) })),
  goToStep: (step) => set({ currentStep: step }),
  reset: () => set(INITIAL_STATE),
}));
