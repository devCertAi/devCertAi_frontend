import { useEffect, useState } from 'react'
import { Upload, FileText } from 'lucide-react'

const STEP_TIME = 2800

const STEPS = [
  { label: '01 · Submit' },
  { label: '02 · Evaluate' },
  { label: '03 · Certify' },
]

export function TutorialWalkthrough() {
  const [step, setStep] = useState(0)
  const [dropAnimKey, setDropAnimKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % 3)
    }, STEP_TIME)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (step === 0) setDropAnimKey((k) => k + 1)
  }, [step])

  return (
    <div
      className="rounded-[18px] overflow-hidden"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-panel)' }}
    >
      {/* chrome bar */}
      <div className="flex items-center gap-[9px] px-[18px] py-[13px]" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
        <span className="w-[9px] h-[9px] rounded-full" style={{ background: 'var(--color-border)' }} />
        <span
          className="ml-2 font-mono text-[11px] px-3.5 py-1 rounded-md"
          style={{ background: 'var(--color-surface2)', color: 'var(--color-muted)' }}
        >
          devcert.dev/submit
        </span>
      </div>

      {/* stage */}
      <div className="relative h-[300px] overflow-hidden">
        {/* step 0: drop zone */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-[30px] transition-all duration-500"
          style={{
            opacity: step === 0 ? 1 : 0,
            transform: step === 0 ? 'translateX(0)' : 'translateX(28px)',
            pointerEvents: step === 0 ? 'auto' : 'none',
          }}
        >
          <div
            className="w-[270px] h-[150px] rounded-[14px] flex flex-col items-center justify-center gap-2.5 relative"
            style={{
              border: `2px dashed ${step === 0 ? 'var(--color-primary)' : 'var(--color-border)'}`,
              background: step === 0 ? 'color-mix(in srgb, var(--color-primary) 5%, transparent)' : 'transparent',
            }}
          >
            <Upload size={26} strokeWidth={1.6} style={{ color: 'var(--color-muted)' }} />
            <div className="text-[12.5px] font-mono" style={{ color: 'var(--color-muted)' }}>
              Drag repo here or paste a GitHub URL
            </div>
            {step === 0 && (
              <div
                key={dropAnimKey}
                className="absolute -top-5 left-1/2 font-mono text-[11px] px-3 py-[7px] rounded-lg flex items-center gap-[7px]"
                style={{
                  background: 'var(--color-surface2)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text)',
                  animation: 'dropIn 1.8s ease forwards',
                }}
              >
                <FileText size={13} strokeWidth={2} />
                <span>your-project.zip</span>
              </div>
            )}
          </div>
        </div>

        {/* step 1: scanning */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-[30px] transition-all duration-500"
          style={{
            opacity: step === 1 ? 1 : 0,
            transform: step === 1 ? 'translateX(0)' : 'translateX(28px)',
            pointerEvents: step === 1 ? 'auto' : 'none',
          }}
        >
          <div
            className="w-[270px] h-[150px] rounded-xl relative overflow-hidden p-[14px]"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}
          >
            <div className="flex flex-col gap-2">
              <div className="h-[7px] rounded-[3px] w-[90%]" style={{ background: 'rgba(127,127,127,.18)' }} />
              <div className="h-[7px] rounded-[3px] w-[70%]" style={{ background: 'rgba(127,127,127,.18)' }} />
              <div className="h-[7px] rounded-[3px] w-[80%]" style={{ background: 'rgba(127,127,127,.18)' }} />
              <div className="h-[7px] rounded-[3px] w-[55%]" style={{ background: 'rgba(127,127,127,.18)' }} />
            </div>
            {step === 1 && (
              <div
                className="absolute left-0 right-0 h-[34px]"
                style={{
                  background: 'linear-gradient(180deg, transparent, rgba(0,212,255,.28), transparent)',
                  animation: 'scanMove 1.8s linear infinite',
                }}
              />
            )}
          </div>
        </div>

        {/* step 2: result */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-[30px] transition-all duration-500"
          style={{
            opacity: step === 2 ? 1 : 0,
            transform: step === 2 ? 'translateX(0)' : 'translateX(28px)',
            pointerEvents: step === 2 ? 'auto' : 'none',
          }}
        >
          <div
            className="w-[270px] rounded-xl p-[18px] text-center"
            style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface2)' }}
          >
            <div className="text-[38px] font-bold" style={{ color: 'var(--color-primary)', fontFamily: "'Space Grotesk', sans-serif" }}>
              77
            </div>
            <div className="font-mono text-[11.5px] mt-1" style={{ color: 'var(--color-muted)' }}>
              / 100 · Certified · verifiable
            </div>
          </div>
        </div>
      </div>

      {/* step nav */}
      <div className="flex" style={{ borderTop: '1px solid var(--color-border)' }}>
        {STEPS.map((s, i) => (
          <button
            key={i}
            onClick={() => setStep(i)}
            className="flex-1 py-[15px] text-center font-mono text-[11px] relative transition-colors"
            style={{
              color: step === i ? 'var(--color-primary)' : 'var(--color-muted)',
              borderRight: i < STEPS.length - 1 ? '1px solid var(--color-border)' : 'none',
            }}
          >
            {s.label}
            {step === i && (
              <span
                key={`${i}-${step}`}
                className="absolute bottom-0 left-0 h-[2px]"
                style={{
                  background: 'var(--color-primary)',
                  animation: `growWidth ${STEP_TIME}ms linear forwards`,
                }}
              />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes dropIn {
          0% { transform: translate(-50%, -90px); opacity: 0; }
          35% { opacity: 1; }
          60% { transform: translate(-50%, 30px); }
          100% { transform: translate(-50%, 0px); opacity: 1; }
        }
        @keyframes scanMove {
          0% { top: -40px; }
          100% { top: 160px; }
        }
        @keyframes growWidth {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  )
}
