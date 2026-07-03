const BLOCKS = [
  { t: 'repo', c: '#5EEAD4', top: 86 },
  { t: 'quality', c: '#8B7CF6', top: 40 },
  { t: 'architecture', c: '#8B7CF6', top: -6 },
  { t: 'security', c: '#EF4444', top: -52 },
  { t: 'score: 77', c: '#FBBF54', top: -98 },
]

export function BuildTower() {
  return (
    <div className="flex items-center justify-center h-[360px] mt-[46px]" style={{ perspective: 1200 }}>
      <div
        className="relative"
        style={{
          width: 210,
          height: 250,
          transformStyle: 'preserve-3d',
          animation: 'towerSpin 14s linear infinite',
        }}
      >
        {BLOCKS.map((b, i) => (
          <div
            key={b.t}
            className="absolute left-1/2"
            style={{
              top: `calc(50% + ${b.top}px)`,
              width: 134,
              height: 44,
              marginLeft: -67,
              transformStyle: 'preserve-3d',
              opacity: 0,
              animation: `blockRise .8s cubic-bezier(.2,.9,.3,1.2) forwards`,
              animationDelay: `${0.1 + i * 0.4}s`,
            }}
          >
            {/* front face */}
            <div
              className="absolute inset-0 rounded-[6px] flex items-center justify-center gap-1.5 font-mono text-[10.5px] text-[var(--color-inverse)] font-bold"
              style={{
                background: b.c,
                transform: 'translateZ(22px)',
                backfaceVisibility: 'hidden',
              }}
            >
              {b.t}
            </div>

            {/* back face */}
            <div
              className="absolute inset-0 rounded-[6px]"
              style={{
                background: b.c,
                transform: 'translateZ(-22px) rotateY(180deg)',
                filter: 'brightness(.6)',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* right side face */}
            <div
              className="absolute top-0 rounded-[6px]"
              style={{
                width: 44,
                height: 44,
                left: '50%',
                marginLeft: -22,
                background: b.c,
                filter: 'brightness(.5)',
                transform: 'rotateY(90deg) translateZ(67px)',
                backfaceVisibility: 'hidden',
              }}
            />

            {/* left side face */}
            <div
              className="absolute top-0 rounded-[6px]"
              style={{
                width: 44,
                height: 44,
                left: '50%',
                marginLeft: -22,
                background: b.c,
                filter: 'brightness(.5)',
                transform: 'rotateY(-90deg) translateZ(67px)',
                backfaceVisibility: 'hidden',
              }}
            />
          </div>
        ))}
      </div>

      <style>{`
        @keyframes towerSpin {
          from { transform: rotateY(0deg) rotateX(-8deg); }
          to { transform: rotateY(360deg) rotateX(-8deg); }
        }
        @keyframes blockRise {
          0% { opacity: 0; transform: translateY(115px) translateZ(-100px) rotateX(40deg); }
          70% { opacity: 1; }
          100% { opacity: 1; transform: translateY(0) translateZ(0) rotateX(0deg); }
        }
      `}</style>
    </div>
  )
}