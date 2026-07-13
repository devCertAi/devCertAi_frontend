import { AlertTriangle, HelpCircle } from 'lucide-react'

/**
 * QuestionAvailabilityTable
 *
 * Shows how many questions actually exist for the section (category) the
 * candidate currently has selected, broken down by difficulty level
 * (Easy / Medium / Hard) — pulled straight from the backend's
 * QuestionBankStats table (see questionStatsService.js / getPhase1Questions),
 * scoped to the current domain + phase.
 *
 * Only the SELECTED section is shown — not every category in the domain.
 * Selection itself still happens via the pill buttons above this table;
 * this is just the readout for whichever one is currently picked.
 */

interface CategoryQuestionCount {
  easy: number
  medium: number
  hard: number
  total: number
}

interface QuestionAvailabilityTableProps {
  // Per-category counts for this domain, as returned by GET /exam/domains
  // (backend/src/controllers/examController.js -> getCategoryCountsForDomains).
  categoryQuestionCounts?: Record<string, CategoryQuestionCount>
  selectedCategory: string | null
  minQuestions: number
}

export function QuestionAvailabilityTable({
  categoryQuestionCounts,
  selectedCategory,
  minQuestions,
}: QuestionAvailabilityTableProps) {
  // Nothing picked yet — nothing to show a breakdown for.
  if (!selectedCategory) {
    return (
      <div className="mb-5 flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-[var(--color-border)] text-[10px] text-[var(--color-muted)]">
        <HelpCircle size={12} className="shrink-0" />
        Pick a section above to see how many questions are available.
      </div>
    )
  }

  // Older backend that hasn't sent categoryQuestionCounts yet, or a section
  // with genuinely zero rows in QuestionBankStats.
  const counts: CategoryQuestionCount = categoryQuestionCounts?.[selectedCategory] ?? {
    easy: 0,
    medium: 0,
    hard: 0,
    total: 0,
  }
  const short = counts.total < minQuestions

  return (
    <div className="mb-5">
      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-[var(--color-surface2)] border-b border-[var(--color-border)]">
              <th className="py-2 pl-3 pr-2 text-left font-medium text-[var(--color-muted)] uppercase tracking-wider text-[10px]">
                Section
              </th>
              <th className="py-2 px-2 text-center font-medium text-[var(--color-success)] uppercase tracking-wider text-[10px]">
                Easy
              </th>
              <th className="py-2 px-2 text-center font-medium text-[var(--color-warning)] uppercase tracking-wider text-[10px]">
                Medium
              </th>
              <th className="py-2 px-2 text-center font-medium text-[var(--color-danger)] uppercase tracking-wider text-[10px]">
                Hard
              </th>
              <th className="py-2 pr-3 pl-2 text-right font-medium text-[var(--color-text)] uppercase tracking-wider text-[10px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]">
              <td className="py-2 pl-3 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-[var(--color-primary)]">{selectedCategory}</span>
                  {short && <AlertTriangle size={11} className="text-[var(--color-danger)] shrink-0" />}
                </div>
              </td>
              <td className="py-2 px-2 text-center text-[var(--color-text)]">{counts.easy}</td>
              <td className="py-2 px-2 text-center text-[var(--color-text)]">{counts.medium}</td>
              <td className="py-2 px-2 text-center text-[var(--color-text)]">{counts.hard}</td>
              <td className="py-2 pr-3 pl-2 text-right font-semibold text-[var(--color-text)]">{counts.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={`text-[10px] mt-1.5 ${short ? 'text-[var(--color-danger)]' : 'text-[var(--color-muted)]'}`}>
        {short
          ? `Not enough questions in this section yet (need at least ${minQuestions}). Try another section.`
          : `A section needs at least ${minQuestions} questions to start an exam.`}
      </p>
    </div>
  )
}
