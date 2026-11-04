type StepState = 'done' | 'active' | 'pending'

export interface StudioStep {
  label: string
  description: string
  statusLabel: string
  state: StepState
  ready: boolean
  lockReason?: string
  onSelect: () => void
}

interface StepperVisualProps {
  steps: StudioStep[]
}

/**
 * Visual production stepper only. Does not enforce stage guards.
 */
export function StepperVisual({ steps }: StepperVisualProps) {
  return (
    <div className="border-t border-border">
      {steps.map((step, index) => {
        const locked = !step.ready
        return (
          <button
            key={step.label}
            type="button"
            disabled={locked}
            onClick={step.onSelect}
            className={[
              'flex w-full items-center gap-4 border-b border-border py-4 text-left',
              locked ? 'opacity-55' : 'bg-transparent',
            ].join(' ')}
          >
            <span
              className={[
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                step.state === 'done'
                  ? 'border-ink bg-ink text-surface'
                  : step.state === 'active'
                    ? 'border-sage bg-transparent text-sage'
                    : 'border-border bg-surface-alt text-ink-faint',
              ].join(' ')}
            >
              {step.state === 'done' ? '✓' : index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-serif text-sm font-bold">{step.label}</p>
                <span
                  className={[
                    'shrink-0 text-[10px] font-semibold tracking-[0.08em]',
                    step.state === 'done'
                      ? 'text-ink'
                      : step.state === 'active'
                        ? 'text-sage'
                        : 'text-ink-faint',
                  ].join(' ')}
                >
                  {step.statusLabel}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-ink-muted">{step.description}</p>
              {locked && step.lockReason && (
                <p className="mt-1.5 text-[11px] leading-4 text-ink-faint">잠금 · {step.lockReason}</p>
              )}
            </div>
            {step.ready && step.state !== 'done' && (
              <span className="text-ink-faint" aria-hidden>
                ›
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
