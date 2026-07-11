import { useEffect, useMemo, useState } from "react";
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
  {
    id: "6",
    name: "Ananya Reddy",
    role: "Data Scientist",
    text: "The evaluation caught a data leakage issue in my model pipeline that I'd genuinely missed. Worth the submission credit alone.",
    stars: 5,
  },
  {
    id: "7",
    name: "Karan Malhotra",
    role: "DevOps Engineer",
    text: "This one actually looked at my Terraform setup and flagged a real misconfiguration, not just a generic quiz.",
    stars: 4,
  },
  {
    id: "8",
    name: "Neha Kapoor",
    role: "UI/UX Engineer",
    text: "The feedback on component accessibility was more thorough than I expected from an AI reviewer.",
    stars: 5,
  },
];

const avatarColors = ["#5EEAD4", "#8B7CF6", "#22C55E", "#FBBF54", "#EC4899"];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

/** Deterministic pseudo-random in [0,1), seeded by index so speeds stay stable across renders */
function seeded(i: number) {
  const x = Math.sin(i * 999.123) * 10000;
  return x - Math.floor(x);
}

function TestimonialCard({ t, colorIndex }: { t: Testimonial; colorIndex: number }) {
  return (
    <div
      className="w-[270px] p-5 rounded-[16px] text-left shrink-0"
      style={{
        background: `linear-gradient(155deg, var(--color-surface), var(--color-surface2))`,
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-panel)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-[9px] flex items-center justify-center font-bold text-[var(--color-inverse)] flex-shrink-0 text-[12px]"
          style={{ background: avatarColors[colorIndex % avatarColors.length], fontFamily: "'Space Grotesk', sans-serif" }}
        >
          {initials(t.name)}
        </div>
        <div>
          <div className="text-[13.5px] font-semibold" style={{ color: 'var(--color-text)', fontFamily: "'Space Grotesk', sans-serif" }}>{t.name}</div>
          <div className="font-mono text-[10px]" style={{ color: 'var(--color-muted)' }}>{t.role}</div>
        </div>
      </div>
      <div className="flex gap-[3px] mb-2.5" style={{ color: 'var(--color-warning)' }}>
        {Array.from({ length: t.stars }).map((_, j) => (
          <Star key={j} size={12} fill="currentColor" strokeWidth={0} />
        ))}
      </div>
      <p className="text-[12.5px] leading-[1.6]" style={{ color: 'var(--color-text)' }}>{t.text}</p>
    </div>
  );
}

function MarqueeColumn({
  items,
  colIndex,
}: {
  items: Testimonial[];
  colIndex: number;
}) {
  const goingUp = colIndex % 2 === 0; // alternate ladders: up, down, up, down
  const duration = useMemo(() => 26 + seeded(colIndex + 10) * 12, [colIndex]); // 26s-38s, varied per column

  // duplicate the column's items so the track can loop seamlessly at -50% / 0%
  const looped = [...items, ...items];

  return (
    <div className="marquee-col relative w-[270px] h-[600px] overflow-hidden">
      <div
        className={goingUp ? "marquee-track-up" : "marquee-track-down"}
        style={{ ["--duration" as any]: `${duration}s` }}
      >
        <div className="flex flex-col gap-4 pb-4">
          {looped.map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} t={t} colorIndex={colIndex + i} />
          ))}
        </div>
      </div>
      {/* fade edges so cards don't hard-clip at top/bottom */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(to bottom, var(--color-bg) 0%, transparent 10%, transparent 90%, var(--color-bg) 100%)`,
        }}
      />
    </div>
  );
}

export function TestimonialsCarousel() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading || count === 0) {
    return (
      <div className="flex gap-4 justify-center mt-[50px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="w-[270px] h-[600px] animate-pulse rounded-[16px]" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
        ))}
      </div>
    );
  }

  // distribute testimonials round-robin across 4 ladders
  const columns: Testimonial[][] = [[], [], [], []];
  testimonials.forEach((t, i) => columns[i % 4].push(t));
  // guarantee every column has at least one card even with few testimonials
  columns.forEach((col, i) => { if (col.length === 0) col.push(testimonials[i % count]); });

  return (
    <div className="text-center">
      <div className="flex gap-4 justify-center mt-[50px]">
        {columns.map((col, ci) => (
          <MarqueeColumn key={ci} items={col} colIndex={ci} />
        ))}
      </div>
      <style>{`
        .marquee-track-up {
          animation: marqueeUp var(--duration) linear infinite;
        }
        .marquee-track-down {
          animation: marqueeDown var(--duration) linear infinite;
        }
        .marquee-col:hover .marquee-track-up,
        .marquee-col:hover .marquee-track-down {
          animation-play-state: paused;
        }

        @keyframes marqueeUp {
          0%   { transform: translateY(0%); }
          100% { transform: translateY(-50%); }
        }
        @keyframes marqueeDown {
          0%   { transform: translateY(-50%); }
          100% { transform: translateY(0%); }
        }

        @media (max-width: 1100px) {
          .marquee-col:nth-child(4) { display: none; }
        }
        @media (max-width: 820px) {
          .marquee-col:nth-child(3) { display: none; }
        }
        @media (max-width: 560px) {
          .marquee-col:nth-child(2) { display: none; }
        }
      `}</style>
    </div>
  );
}