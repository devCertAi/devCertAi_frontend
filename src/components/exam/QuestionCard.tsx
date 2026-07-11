import { Question } from '@/types'
import { cn } from '@/lib/utils'

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  answer?: string
  onAnswer: (answer: string) => void
}

export function QuestionCard({ question, index, total, answer, onAnswer }: QuestionCardProps) {
  return (
    <div className="flex-1">
      <div className="mb-2">
        <span className="text-xs text-[var(--color-muted)]">Question {index + 1} of {total}</span>
      </div>
      <h2 className="text-lg font-medium text-[var(--color-text)] mb-6 leading-relaxed">{question.question}</h2>
      {question.type === 'mcq' && question.options ? (
        <div className="space-y-3">
          {question.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => onAnswer(opt)}
              className={cn(
                'w-full text-left px-4 py-3.5 rounded-xl border text-sm transition-all',
                answer === opt
                  ? 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] border-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] text-[var(--color-text)]'
                  : 'bg-[var(--color-bg)] border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-border)] hover:text-[var(--color-text)]'
              )}
            >
              <span className="mr-3 font-medium text-[var(--color-primary)]">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          placeholder={question.type === 'code' ? 'Write your code here...' : 'Type your answer here...'}
          spellCheck={question.type !== 'code'}
          className={cn(
            'w-full h-48 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] resize-none transition-colors',
            question.type === 'code' && 'font-mono'
          )}
        />
      )}
      {question.context && (
        <p className="mt-4 text-xs text-[var(--color-muted)] italic">Context: {question.context}</p>
      )}
    </div>
  )
}
