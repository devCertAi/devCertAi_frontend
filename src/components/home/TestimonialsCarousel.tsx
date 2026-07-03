import { useEffect, useRef, useState, useCallback } from "react";
import { Star } from "lucide-react";
import axios from "axios";

const silentApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
  avatar?: string;
}

const FALLBACK: Testimonial[] = [
  {
    id: "1",
    name: "Aditya Kumar",
    role: "Frontend Developer",
    text: "The AI feedback was incredibly detailed. Found 3 security issues I completely missed. Got my first job using the certificate!",
    stars: 5,
  },
  {
    id: "2",
    name: "Priya Sharma",
    role: "Backend Engineer",
    text: "The proctored exam proved my skills to employers way more convincingly than just listing technologies on my resume.",
    stars: 5,
  },
  {
    id: "3",
    name: "Rohan Mehta",
    role: "Full Stack Dev",
    text: "Submitted my portfolio project and got a 82/100 score with super detailed feedback. Worth every rupee of the premium plan.",
    stars: 5,
  },
  {
    id: "4",
    name: "Sneha Iyer",
    role: "React Developer",
    text: "DevCert helped me stand out in a crowded market. The certificate with a verification URL is something no other platform offers.",
    stars: 5,
  },
  {
    id: "5",
    name: "Vikram Singh",
    role: "Node.js Developer",
    text: "The AI caught architectural issues I didn't even consider. My code quality has genuinely improved after reading the feedback.",
    stars: 5,
  },
];

const AUTO_PLAY_MS = 5200;
const avatarColors = ["#5EEAD4", "#8B7CF6", "#22C55E", "#FBBF54", "#EC4899"];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function TypedText({ text, active }: { text: string; active: boolean }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    if (!active) return
    setShown("")
    let i = 0
    let cancelled = false
    function tick() {
      if (cancelled) return
      if (i > text.length) return
      setShown(text.slice(0, i))
      i++
      setTimeout(tick, 16)
    }
    tick()
    return () => { cancelled = true }
  }, [text, active])

  return (
    <div className="text-[13.5px] leading-[1.65] min-h-[90px]" style={{ color: 'var(--color-text)' }}>
      {shown}
      {active && shown.length < text.length && (
        <span className="inline-block w-1.5 h-[13px] ml-0.5 align-middle" style={{ background: 'var(--color-primary)', animation: 'blinkRCursor .9s step-end infinite' }} />
      )}
    </div>
  )
}

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [top, setTop] = useState(0); // index of front card
  const [paused, setPaused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dragY = useRef(0);
  const dragging = useRef(false);

  useEffect(() => {
    silentApi
      .get("/testimonials")
      .then((res) => {
        const data: Testimonial[] = res.data?.data;
        setTestimonials(data?.length ? data : FALLBACK);
      })
      .catch(() => setTestimonials(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const count = testimonials.length;

  const advance = useCallback(() => {
    setTop((t) => (count ? (t + 1) % count : 0));
  }, [count]);

  useEffect(() => {
    if (paused || count === 0) return;
    const id = setInterval(advance, AUTO_PLAY_MS);
    return () => clearInterval(id);
  }, [paused, count, advance]);

  if (loading || count === 0) {
    return (
      <div className="relative w-[380px] h-[330px] mx-auto mt-[50px] animate-pulse rounded-[18px]" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
    );
  }

  const onMouseDown = (e: React.MouseEvent) => { dragging.current = true; dragY.current = e.clientY }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return
    if (Math.abs(e.clientY - dragY.current) > 60) { dragging.current = false; advance() }
  }
  const onMouseUp = () => { dragging.current = false }
  const onTouchStart = (e: React.TouchEvent) => { dragY.current = e.touches[0].clientY }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (Math.abs(dragY.current - e.changedTouches[0].clientY) > 40) advance()
  }

  return (
    <div className="text-center">
      <div
        ref={wrapRef}
        className="relative w-[380px] h-[330px] mx-auto mt-[50px] cursor-grab active:cursor-grabbing select-none"
        style={{ perspective: 1200 }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); dragging.current = false }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {testimonials.map((t, i) => {
          const off = ((i - top) % count + count) % count;
          if (off > 3) return null;
          const layerStyle = [
            { y: 0, scale: 1, opacity: 1, z: count },
            { y: 24, scale: 0.94, opacity: 0.7, z: count - 1 },
            { y: 44, scale: 0.88, opacity: 0.4, z: count - 2 },
            { y: 58, scale: 0.82, opacity: 0, z: 0 },
          ][off];
          return (
            <div
              key={t.id}
              className="absolute left-0 right-0 p-7 rounded-[18px] text-left"
              style={{
                background: `linear-gradient(155deg, var(--color-surface), var(--color-surface2))`,
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-panel)',
                transform: `translateY(${layerStyle.y}px) scale(${layerStyle.scale}) rotateX(3deg) rotateY(-7deg)`,
                opacity: layerStyle.opacity,
                zIndex: layerStyle.z,
                transition: 'transform .6s cubic-bezier(.34,1.3,.64,1), opacity .5s ease',
                pointerEvents: off === 0 ? 'auto' : 'none',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-[var(--color-inverse)] flex-shrink-0"
                  style={{ background: avatarColors[i % avatarColors.length], fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {initials(t.name)}
                </div>
                <div>
                  <div className="text-[15px] font-semibold" style={{ color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</div>
                  <div className="font-mono text-[10.5px]" style={{ color: 'var(--color-muted)' }}>{t.role}</div>
                </div>
              </div>
              <div className="flex gap-[3px] mb-3.5" style={{ color: 'var(--color-warning)' }}>
                {Array.from({ length: t.stars }).map((_, j) => (
                  <Star key={j} size={14} fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <TypedText text={t.text} active={off === 0} />
            </div>
          );
        })}
      </div>
      <style>{`@keyframes blinkRCursor { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
