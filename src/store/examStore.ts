import { create } from 'zustand'
import { ExamAttempt } from '@/types'

/**
 * examStore
 *
 * BUGS FIXED:
 * 1. answers used numeric index as key everywhere, but backend grades Phase 1
 *    by question.id (string). Store now distinguishes phase and uses correct key.
 * 2. No Phase 2 state — githubUrl, phase2Questions, phase2Step were all missing.
 * 3. resetExam was never called when a new exam started — stale answers/state
 *    from a previous exam bled into the new one (especially markedForReview Set).
 * 4. markedForReview serializes as an empty object in devtools; preserved as Set.
 */

interface Phase2Step {
  step: 'project_input' | 'questions' | 'done'
}

interface ExamState {
  currentAttempt: ExamAttempt | null
  currentQuestion: number
  // Phase 1: Record<questionId, answer> (string key = question.id)
  // Phase 2: Record<index, answer> (numeric index, text answers)
  answers: Record<string, string>
  markedForReview: Set<number>
  timeRemaining: number
  isSubmitting: boolean
  violationCount: number

  // Phase 2 specific
  phase2Step: Phase2Step['step']
  githubUrl: string

  // Actions
  setAttempt: (attempt: ExamAttempt) => void
  setAnswer: (key: string | number, answer: string) => void
  toggleReview: (index: number) => void
  setTimeRemaining: (t: number) => void
  setCurrentQuestion: (q: number) => void
  addViolation: () => void
  setPhase2Step: (step: Phase2Step['step']) => void
  setGithubUrl: (url: string) => void
  setPhase2Questions: (questions: ExamAttempt['questions']) => void
  resetExam: () => void
}

const initialState = {
  currentAttempt: null,
  currentQuestion: 0,
  answers: {},
  markedForReview: new Set<number>(),
  timeRemaining: 2700,
  isSubmitting: false,
  violationCount: 0,
  phase2Step: 'project_input' as Phase2Step['step'],
  githubUrl: '',
}

export const useExamStore = create<ExamState>((set, get) => ({
  ...initialState,

  setAttempt: (attempt) =>
    set({
      currentAttempt: attempt,
      timeRemaining: attempt.timeLimitSec,
      // Reset question navigator when a new attempt loads
      currentQuestion: 0,
      answers: {},
      markedForReview: new Set(),
    }),

  // Accepts both string (phase 1 question.id) and number (phase 2 index)
  setAnswer: (key, answer) =>
    set((state) => ({
      answers: { ...state.answers, [String(key)]: answer },
    })),

  toggleReview: (index) =>
    set((state) => {
      const s = new Set(state.markedForReview)
      if (s.has(index)) s.delete(index)
      else s.add(index)
      return { markedForReview: s }
    }),

  setTimeRemaining: (t) => set({ timeRemaining: t }),
  setCurrentQuestion: (q) => set({ currentQuestion: q }),
  addViolation: () => set((state) => ({ violationCount: state.violationCount + 1 })),
  setPhase2Step: (step) => set({ phase2Step: step }),
  setGithubUrl: (url) => set({ githubUrl: url }),

  setPhase2Questions: (questions) =>
    set((state) => ({
      currentAttempt: state.currentAttempt
        ? { ...state.currentAttempt, questions }
        : null,
      currentQuestion: 0,
      answers: {},
    })),

  resetExam: () => set({ ...initialState, markedForReview: new Set() }),
}))
