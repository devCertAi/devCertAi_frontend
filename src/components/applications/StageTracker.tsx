import { Check, X, Clock, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Application } from '@/types'
import { useState, useEffect } from 'react'
import  api  from '@/services/api'
import { formatRelativeTime } from '@/lib/utils'

interface StageTrackerProps {
  application: Application
}

interface Step {
  key: string
  label: string
  stages: string[]
}

export function StageTracker({ application }: StageTrackerProps) {
  const hasAssignment = !!application.jobPosting?.assignmentBrief
  const examEnabled = !!application.jobPosting?.examEnabled
  // FIX: 'exam_phase2_sent' / 'exam_phase2_completed' were never included in
  // any step's `stages` list, so once an application reached those stages
  // `currentStepIndex` came back -1 and the whole tracker looked "undone".
  const examPhase2 = !!application.jobPosting?.examPhase2
  const [messages, setMessages] = useState<any[]>([])

  useEffect(() => {
    api.get(`/applications/${application.id}/messages`)
      .then(r => setMessages(r.data.data.messages || []))
      .catch(() => {})
  }, [application.id])

  const steps: Step[] = [
    { key: 'applied', label: 'Applied', stages: ['applied'] },
    { key: 'screened', label: 'Screened', stages: ['screened'] },
  ]
  if (hasAssignment) {
    steps.push({ key: 'assignment', label: 'Assignment', stages: ['assignment_sent', 'assignment_submitted'] })
    steps.push({ key: 'project_evaluated', label: 'Project Review', stages: ['project_evaluated'] })
  }
  if (examEnabled) {
    const examStages = ['exam_sent', 'exam_completed']
    if (examPhase2) examStages.push('exam_phase2_sent', 'exam_phase2_completed')
    steps.push({ key: 'exam', label: 'Assessment', stages: examStages })
  }
  steps.push({ key: 'ranked', label: 'Result', stages: ['ranked'] })

  const currentStepIndex = steps.findIndex(s => s.stages.includes(application.stage))
  const isRejected = application.status === 'rejected'
  const isSelected = application.status === 'selected'

  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex || (idx === steps.length - 1 && (isSelected || isRejected))
          const isCurrent = idx === currentStepIndex && application.status === 'in_progress'
          const isLast = idx === steps.length - 1

          let icon = <span className="text-xs font-semibold">{idx + 1}</span>
          let circleClass = 'bg-[var(--color-surface2)] text-[var(--color-muted)] border-[var(--color-border)]'

          if (isLast && isRejected) {
            icon = <X size={14} />
            circleClass = 'bg-[color-mix(in_srgb,var(--color-danger)_15%,transparent)] text-[var(--color-danger)] border-[color-mix(in_srgb,var(--color-danger)_30%,transparent)]'
          } else if (isLast && isSelected) {
            icon = <Check size={14} />
            circleClass = 'bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]'
          } else if (isDone) {
            icon = <Check size={14} />
            circleClass = 'bg-[color-mix(in_srgb,var(--color-primary)_15%,transparent)] text-[var(--color-primary)] border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)]'
          } else if (isCurrent) {
            icon = <Clock size={14} />
            circleClass = 'bg-[color-mix(in_srgb,var(--color-secondary)_15%,transparent)] text-[var(--color-secondary)] border-[color-mix(in_srgb,var(--color-secondary)_30%,transparent)] animate-pulse'
          }

          return (
            <div key={step.key} className={cn('flex items-center', !isLast && 'flex-1')}>
              <div className="flex flex-col items-center gap-1.5 shrink-0">
                <div className={cn('w-7 h-7 rounded-full flex items-center justify-center border', circleClass)}>
                  {icon}
                </div>
                <span className="text-[10px] text-[var(--color-muted)] whitespace-nowrap text-center">{step.label}</span>
              </div>
              {!isLast && (
                <div className={cn('flex-1 h-px mx-1 mb-4', idx < currentStepIndex ? 'bg-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]' : 'bg-[var(--color-surface2)]')} />
              )}
            </div>
          )
        })}
      </div>

      {/* Part F2 — messages from recruiter (candidate view) */}
      {messages.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={14} style={{ color: 'var(--color-primary)' }} />
            <span className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>Messages from recruiter</span>
          </div>
          <div className="space-y-2">
            {messages.map((m: any) => (
              <div key={m.id} className="rounded-xl p-3 text-xs" style={{ background: 'var(--color-surface2)' }}>
                <p style={{ color: 'var(--color-text)' }}>{m.body}</p>
                <span style={{ color: 'var(--color-muted)' }}>{formatRelativeTime(m.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
