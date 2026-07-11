import { create } from 'zustand'

/**
 * comboStore
 *
 * Carries the "Combo (P1+P2)" exam state across pages. It is intentionally
 * separate from examStore because ExamRoom calls resetExam() on every mount
 * (Phase 1 room AND Phase 2 room) — if combo data lived in examStore it would
 * get wiped the moment the Phase 2 room loaded, right before it's needed.
 *
 * Flow:
 * 1. ExamSelect -> ComboConfigModal validates the GitHub repo against the
 *    domain, then calls start(). Phase 1 begins as normal.
 * 2. ExamResult (Phase 1) sees `active` is true and, once Phase 1 is graded,
 *    records phase1AttemptId WITHOUT revealing the Phase 1 score — the
 *    candidate instead sees a neutral "Continue to Phase 2" button. Clicking
 *    it starts Phase 2 with the same githubUrl and navigates into the room.
 * 3. ExamResult (Phase 2) fetches the paired Phase 1 attempt via
 *    phase1AttemptId, shows the combined score + full two-phase review, then
 *    calls clear() (active/domain/githubUrl only — phase1AttemptId is left
 *    alone) so a later, unrelated attempt is never mistaken for this run.
 */

interface ComboState {
  active: boolean
  domain: string
  githubUrl: string
  phase2Difficulty: string
  phase2QuestionCount: number
  // Set once Phase 1 finishes so the Phase 2 result page can fetch and
  // display the paired Phase 1 review even though `active` gets cleared
  // the moment Phase 2 starts.
  phase1AttemptId: string | null
  start: (config: {
    domain: string
    githubUrl: string
    phase2Difficulty: string
    phase2QuestionCount: number
  }) => void
  setPhase1AttemptId: (id: string) => void
  clear: () => void
}

export const useComboStore = create<ComboState>((set) => ({
  active: false,
  domain: '',
  githubUrl: '',
  phase2Difficulty: 'medium',
  phase2QuestionCount: 6,
  phase1AttemptId: null,
  start: (config) => set({ active: true, phase1AttemptId: null, ...config }),
  setPhase1AttemptId: (id) => set({ phase1AttemptId: id }),
  clear: () => set({ active: false, domain: '', githubUrl: '' }),
}))
