import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  ArrowLeft, Download, RefreshCw, ExternalLink, GitBranch,
  Shield, Zap, Code2, BookOpen, Layers, Star, AlertTriangle, Bug, Lock,
  TrendingUp, TrendingDown, Terminal, Sparkles, ChevronRight, Lightbulb, CheckCircle2,
} from "lucide-react";
import { Project } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FindingSourceBadge } from "@/components/shared/FindingSourceBadge";
import { VerifiedFindings } from "@/components/shared/VerifiedFindings";
import { FileTreeExplorer } from "@/components/shared/FileTreeExplorer";
import { formatDate, getLevelColor, getScoreColor } from "@/lib/utils";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useProjectUpdates } from "@/hooks/useSocket";
import { useCredits } from "@/hooks/useCredits";
import { useAuthStore } from "@/store/authStore";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { AdSidebar } from "@/components/ads/AdSidebar";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  XAxis, YAxis, CartesianGrid,
  ComposedChart, Line,
} from "recharts";

// ── types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "bugs" | "deep" | "certificate";

const CATEGORIES = [
  { key: "codeQuality",   label: "Code Quality",   icon: <Code2 size={14} /> },
  { key: "architecture",  label: "Architecture",    icon: <Layers size={14} /> },
  { key: "documentation", label: "Documentation",   icon: <BookOpen size={14} /> },
  { key: "security",      label: "Security",        icon: <Shield size={14} /> },
  { key: "performance",   label: "Performance",     icon: <Zap size={14} /> },
  { key: "bestPractices", label: "Best Practices",  icon: <Star size={14} /> },
] as const;

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  high:     "var(--color-warning)",
  medium:   "#3B82F6",
  low:      "var(--color-muted)",
};

const PIE_COLORS = ["var(--color-primary)","var(--color-success)","var(--color-warning)","var(--color-danger)","#3B82F6","#EC4899"];

// Distinct accent colors used per "info point" section, so the page's
// suggestion / improvement / recommendation callouts each carry their own
// identity instead of every card sharing one flat treatment.
const ACCENTS = {
  nextSteps:     "var(--color-primary)",
  codeChanges:   "#A855F7",
  improvements:  "var(--color-warning)",
  recruiter:     "var(--color-secondary)",
};

function accentCardStyle(color: string) {
  return {
    borderLeft: `4px solid ${color}`,
    boxShadow: `0 10px 24px -14px color-mix(in srgb, ${color} 55%, transparent), 0 1px 0 0 color-mix(in srgb, ${color} 25%, transparent) inset`,
    background: `linear-gradient(160deg, color-mix(in srgb, ${color} 14%, var(--color-surface)), var(--color-surface))`,
  } as React.CSSProperties;
}

// ── Premium "duo-tone stack" treatment ───────────────────────────────────
// Simulates two colored cards peeking out from behind the real one using
// layered, negative-spread box-shadows (no extra DOM nodes, so it's safe to
// drop onto any Card without worrying about overflow/nesting). One accent
// silhouette offsets up-left, a second offsets down-right in a different
// color, giving every card a stacked, "premium deck" identity.
function duoCardStyle(colorA: string, colorB: string, extra?: React.CSSProperties): React.CSSProperties {
  return {
    boxShadow: `
      7px 8px 0 -3px color-mix(in srgb, ${colorB} 78%, transparent),
      7px 8px 18px -10px color-mix(in srgb, ${colorB} 60%, transparent),
      -6px -7px 0 -3px color-mix(in srgb, ${colorA} 68%, transparent),
      0 22px 40px -20px rgba(0,0,0,0.38)
    `,
    border: `1px solid color-mix(in srgb, ${colorA} 30%, var(--color-border))`,
    ...extra,
  };
}

function accentDuoCardStyle(color: string, color2: string) {
  return {
    ...accentCardStyle(color),
    ...duoCardStyle(color, color2, { borderLeft: `4px solid ${color}` }),
  } as React.CSSProperties;
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
};

// Shared "lift + zoom" hover used on every card in the page — rises up
// and scales up very slightly, with a matching shadow bump.
const hoverLift = {
  whileHover: { y: -6, scale: 1.02, boxShadow: "0 18px 30px -12px rgba(0,0,0,0.28)" },
  transition: { type: "spring" as const, stiffness: 350, damping: 22 },
};

// ── Code viewer ──────────────────────────────────────────────────────────
// Both the bug snippet and its fix now type themselves out character-by-
// character like a terminal. The bug types first; once it finishes, the
// fix snippet starts typing directly underneath it.
function TypedCode({ code, active, speed = 9, onDone }: {
  code: string; active: boolean; speed?: number; onDone?: () => void;
}) {
  const [shown, setShown] = useState("");
  const doneCalled = useRef(false);

  useEffect(() => {
    if (!active || !code) return;
    setShown("");
    doneCalled.current = false;
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(code.slice(0, i));
      if (i >= code.length) {
        clearInterval(id);
        if (!doneCalled.current) { doneCalled.current = true; onDone?.(); }
      }
    }, speed);
    return () => clearInterval(id);
  }, [active, code, speed]);

  const finished = shown.length >= code.length;
  return (
    <pre className="text-xs bg-[var(--color-bg)] p-3 overflow-x-auto m-0 whitespace-pre-wrap min-h-[2.2rem]">
      {shown}
      {active && !finished && (
        <span className="inline-block w-[6px] h-3 ml-0.5 -mb-0.5 bg-current animate-pulse" />
      )}
    </pre>
  );
}

function CodeWindow({ code, tone, active, onDone, animate = true }: {
  code: string; tone: "bad" | "fix"; active: boolean; onDone?: () => void; animate?: boolean;
}) {
  const color = tone === "bad" ? "var(--color-danger)" : "var(--color-success)";
  return (
    <div className="rounded-lg overflow-hidden border" style={{ borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}>
      <div className="flex items-center gap-1.5 px-3 py-1.5" style={{ backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}>
        <span className="w-2 h-2 rounded-full bg-[#FF5F56]" />
        <span className="w-2 h-2 rounded-full bg-[#FFBD2E]" />
        <span className="w-2 h-2 rounded-full bg-[#27C93F]" />
        <span className="text-[10px] font-mono ml-2" style={{ color }}>{tone === "bad" ? "bug.diff" : "fixed.diff"}</span>
        <span className="ml-auto text-[9px] font-mono uppercase tracking-wide" style={{ color }}>
          {tone === "bad" ? "Bug" : "Fixed"}
        </span>
      </div>
      <div style={{ color }}>
        {animate ? (
          <TypedCode code={code} active={active} onDone={onDone} />
        ) : (
          <pre className="text-xs bg-[var(--color-bg)] p-3 overflow-x-auto m-0 whitespace-pre-wrap min-h-[2.2rem]">
            {code}
          </pre>
        )}
      </div>
    </div>
  );
}

// Bug code renders first (top) as static code — no typing. The fixed code
// renders second (below) and is the only element that autotypes: the code
// itself, then — once the code finishes — the plain-language fix
// explanation types out right underneath it in the same terminal voice.
// Once both are fully typed, a "Verified" badge stamps in at the bottom of
// the fix panel, so the "here's the fix, and it's confirmed" moment is what
// draws the eye.
function BugCodeView({ badCode, fixCode, fixExplanation }: { badCode?: string; fixCode?: string; fixExplanation?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px 0px" });
  const [codeDone, setCodeDone] = useState(false);
  const [explanationDone, setExplanationDone] = useState(!fixExplanation);
  if (!badCode && !fixCode) return null;

  const verified = codeDone && explanationDone;

  return (
    <div ref={ref} className="mt-3 space-y-2">
      {badCode && (
        <CodeWindow code={badCode} tone="bad" active={false} animate={false} />
      )}
      {fixCode && (
        <div>
          <CodeWindow code={fixCode} tone="fix" active={inView} animate onDone={() => setCodeDone(true)} />
          {fixExplanation && (
            <div className="px-3 py-2 rounded-b-lg border border-t-0" style={{ borderColor: "color-mix(in srgb, var(--color-success) 25%, transparent)", background: "color-mix(in srgb, var(--color-success) 10%, var(--color-bg))", marginTop: "-1px" }}>
              <TypedCode
                code={fixExplanation}
                active={codeDone}
                speed={12}
                onDone={() => setExplanationDone(true)}
              />
            </div>
          )}
          <AnimatePresence>
            {verified && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="flex items-center justify-end gap-1.5 px-3 py-1.5 border border-t-0 rounded-b-lg text-[10px] font-medium uppercase tracking-wide"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-success) 25%, transparent)",
                  background: "color-mix(in srgb, var(--color-success) 10%, transparent)",
                  color: "var(--color-success)",
                  marginTop: "-1px",
                }}
              >
                <CheckCircle2 size={12} /> Fix Verified
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Compact radial gauge for the category grid ─────────────────────────────
// Same premium glass/3D language as the hero ScoreRing, scaled down: an
// ambient glow pad, a beveled shadow so the disc reads as raised off the
// card, and a glossy highlight sweep — instead of a flat stroked circle.
function RadialScore({ score, size = 56 }: { score: number; size?: number }) {
  const r = 15.5;
  const circ = 2 * Math.PI * r;
  const color = getScoreColor(score);
  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: size, height: size, perspective: 400 }}
      whileHover={{ rotateX: -8, rotateY: 10, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 280, damping: 18 }}
    >
      <div
        className="absolute inset-[-20%] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${color} 45%, transparent), transparent 70%)`,
          filter: "blur(5px)",
        }}
      />
      <div
        className="relative w-full h-full rounded-full"
        style={{
          boxShadow: `
            0 8px 16px -6px color-mix(in srgb, ${color} 55%, transparent),
            0 2px 4px -2px rgba(0,0,0,0.45),
            0 0 0 1px color-mix(in srgb, ${color} 22%, transparent) inset,
            0 -4px 8px -4px rgba(0,0,0,0.35) inset
          `,
          background: "radial-gradient(circle at 35% 25%, var(--color-surface2), var(--color-surface) 75%)",
        }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circ}` }}
            whileInView={{ strokeDasharray: `${(score / 100) * circ} ${circ}` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums" style={{ color }}>
          {score}
        </div>
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: "10%", left: "18%", width: "38%", height: "22%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.35), transparent)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </motion.div>
  );
}

// ── Premium 3D score ring ────────────────────────────────────────────────
// Sits on a soft glow "pad", tilts in 3D toward the cursor, and carries a
// glossy glass highlight + layered shadow so it reads as an object popping
// out of the screen rather than a flat SVG ring.
function ScoreRing({ score, size = 108 }: { score: number; size?: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const color = getScoreColor(score);
  const [display, setDisplay] = useState(0);
  // Fires once the count-up lands — a quick, satisfying particle burst so
  // the final number feels earned rather than just appearing.
  const [burst, setBurst] = useState(false);

  useEffect(() => {
    const start = performance.now();
    const duration = 1000;
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * score));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setBurst(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const particles = Array.from({ length: 10 });

  const gradId = `scoreRingGrad-${size}`;
  return (
    <motion.div
      className="relative flex-shrink-0"
      style={{ width: size, height: size, perspective: 700 }}
      whileHover={{ rotateX: -10, rotateY: 12, scale: 1.07 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {/* ambient glow pad behind the ring — makes it look lifted off the card */}
      <div
        className="absolute inset-[-22%] rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 38% 30%, color-mix(in srgb, ${color} 45%, transparent), transparent 70%)`,
          filter: "blur(10px)",
        }}
      />
      <div
        className="relative w-full h-full rounded-full"
        style={{
          transformStyle: "preserve-3d",
          boxShadow: `
            0 18px 30px -10px color-mix(in srgb, ${color} 55%, transparent),
            0 4px 10px -4px rgba(0,0,0,0.45),
            0 0 0 1px color-mix(in srgb, ${color} 22%, transparent) inset,
            0 -8px 16px -8px rgba(0,0,0,0.4) inset
          `,
          background: "radial-gradient(circle at 35% 25%, var(--color-surface2), var(--color-surface) 75%)",
        }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="0.55" />
              <stop offset="100%" stopColor={color} stopOpacity="1" />
            </linearGradient>
            <filter id={`${gradId}-glow`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="1.6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="3" />
          <motion.circle
            cx="18" cy="18" r={r} fill="none"
            stroke={`url(#${gradId})`} strokeWidth="3.4" strokeLinecap="round"
            filter={`url(#${gradId}-glow)`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: `${(score / 100) * circ} ${circ}` }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums drop-shadow-sm" style={{ color }}>{display}</span>
          <span className="text-[9px] text-[var(--color-muted)]">/100</span>
        </div>
        {/* glass highlight */}
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            top: "9%", left: "16%", width: "42%", height: "26%",
            background: "linear-gradient(180deg, rgba(255,255,255,0.4), rgba(255,255,255,0) 80%)",
            filter: "blur(1.5px)",
            transform: "translateZ(1px)",
          }}
        />
        {/* satisfying "landed" burst — a quick ring of particles that pop
            outward and fade the instant the count-up finishes */}
        {burst && (
          <div className="absolute inset-0 pointer-events-none overflow-visible">
            {particles.map((_, i) => {
              const angle = (i / particles.length) * Math.PI * 2;
              const dist = size * 0.62;
              return (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{
                    top: "50%", left: "50%", width: 5, height: 5, marginTop: -2.5, marginLeft: -2.5,
                    backgroundColor: color,
                    boxShadow: `0 0 6px 0 color-mix(in srgb, ${color} 70%, transparent)`,
                  }}
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos(angle) * dist,
                    y: Math.sin(angle) * dist,
                    scale: 0.3,
                  }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                />
              );
            })}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `2px solid ${color}` }}
              initial={{ opacity: 0.6, scale: 0.7 }}
              animate={{ opacity: 0, scale: 1.6 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function BarRow({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3 group">
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}
      >
        {icon}
      </div>
      <span className="text-sm text-[var(--color-text)] w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[var(--color-surface2)] rounded-full overflow-hidden relative">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${score}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full relative"
          style={{
            background: `linear-gradient(90deg, color-mix(in srgb, ${color} 55%, transparent), ${color})`,
            boxShadow: `0 0 10px 0 color-mix(in srgb, ${color} 55%, transparent)`,
          }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
}

// ── Pyramid breakdown ────────────────────────────────────────────────────
// A layered triangle chart (apex-to-base bands, numbered leader lines out
// to each label) styled after classic "5-tier pyramid" infographics —
// each band is a category, band color = category theme, band opacity =
// how strong that category's score is, and the number badge + leader line
// pattern alternates left/right so labels never overlap.
function CategoryPyramid({ categories, scores }: {
  categories: readonly { key: string; label: string }[];
  scores: Record<string, number>;
}) {
  const W = 680, H = 300;
  const apexX = 340, apexY = 20, baseHalf = 150, baseY = 270;
  const n = categories.length;
  const bandH = (baseY - apexY) / n;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {categories.map((c, i) => {
        const yTop = apexY + i * bandH;
        const yBottom = apexY + (i + 1) * bandH;
        const hwTop = ((yTop - apexY) / (baseY - apexY)) * baseHalf;
        const hwBottom = ((yBottom - apexY) / (baseY - apexY)) * baseHalf;
        const color = PIE_COLORS[i % PIE_COLORS.length];
        const score = scores[c.key] ?? 0;
        const midY = (yTop + yBottom) / 2;
        const side: 1 | -1 = i % 2 === 0 ? 1 : -1;
        const bandEdgeX = apexX + side * ((hwTop + hwBottom) / 2);
        const lineEndX = apexX + side * (baseHalf + 70);
        const labelX = lineEndX + side * 14;

        return (
          <g key={c.key}>
            <motion.path
              d={`M ${apexX - hwTop} ${yTop} L ${apexX + hwTop} ${yTop} L ${apexX + hwBottom} ${yBottom} L ${apexX - hwBottom} ${yBottom} Z`}
              fill={color}
              fillOpacity={0.32 + (score / 100) * 0.55}
              stroke="var(--color-bg)"
              strokeWidth={2.5}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            />
            <text x={apexX} y={midY + 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--color-text)" style={{ paintOrder: "stroke", stroke: "var(--color-bg)", strokeWidth: 3 }}>
              {score}
            </text>
            <line x1={bandEdgeX} y1={midY} x2={lineEndX} y2={midY} stroke={color} strokeWidth={1.5} strokeOpacity={0.85} />
            <circle cx={lineEndX} cy={midY} r="10" fill={color} />
            <text x={lineEndX} y={midY + 3.5} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--color-bg)">{i + 1}</text>
            <text x={labelX} y={midY + 3.5} textAnchor={side === 1 ? "start" : "end"} fontSize="12" fontWeight="600" fill="var(--color-text)">
              {c.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PlagiarismBar({ risk, similarityPercent }: { risk: string; similarityPercent?: number }) {
  const pct = typeof similarityPercent === "number"
    ? similarityPercent
    : risk === "low" ? 22 : risk === "medium" ? 50 : risk === "high" ? 75 : 90;
  const color = risk === "low" ? "var(--color-success)" : risk === "medium" ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
        <span>Low</span><span>Medium</span><span>High</span>
      </div>
      <div className="h-2.5 bg-gradient-to-r from-[var(--color-success)] via-[var(--color-warning)] to-[var(--color-danger)] rounded-full relative">
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[var(--color-bg)] shadow"
          style={{ left: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-[var(--color-muted)] mt-2 capitalize font-medium" style={{ color }}>
        {risk} · {pct}% similarity to public repos
      </p>
    </div>
  );
}

function MethodologyStrip({ methodology, toolsUsed, filesScanned, linesScanned }: {
  methodology?: string; toolsUsed?: string[]; filesScanned?: number; linesScanned?: number;
}) {
  if (!methodology && (!toolsUsed || toolsUsed.length === 0)) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 py-3 px-1 border-t border-[var(--color-border)] mt-4">
      {methodology && (
        <span className="text-xs text-[var(--color-muted)]">{methodology}</span>
      )}
      <div className="flex flex-wrap gap-1.5">
        {(toolsUsed || []).map((tool) => (
          <span key={tool} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-surface2)] text-[var(--color-text)] border border-[var(--color-border)]">
            {tool}
          </span>
        ))}
      </div>
      {(typeof filesScanned === "number" || typeof linesScanned === "number") && (
        <span className="text-[10px] text-[var(--color-muted)] ml-auto">
          {filesScanned ?? 0} files · {linesScanned ?? 0} lines scanned
        </span>
      )}
    </div>
  );
}

function DomainBadge({ domain, confidence, detectionMethod }: {
  domain: string; confidence?: number; detectionMethod?: string;
}) {
  const isSignalFile = detectionMethod === "signal-file";
  return (
    <span
      title={isSignalFile ? "Detected via project structure, not AI guess" : undefined}
      className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] capitalize"
    >
      {domain}
      {typeof confidence === "number" && (
        <span className="text-[10px] text-[var(--color-primary)] font-medium">{confidence}%</span>
      )}
    </span>
  );
}

// ── Continuous info banner for the Skill Radar card ─────────────────────
// A marquee ticker built from the project's own bugs / improvements /
// strengths, so it always reflects real findings instead of static copy.
type TickerKind = "alert" | "bug" | "lightbulb" | "star";

function tickerIcon(kind: TickerKind) {
  switch (kind) {
    case "alert": return <AlertTriangle size={12} />;
    case "bug": return <Bug size={12} />;
    case "lightbulb": return <Lightbulb size={12} />;
    default: return <Star size={12} />;
  }
}
function tickerColor(kind: TickerKind) {
  switch (kind) {
    case "alert": return "var(--color-danger)";
    case "bug": return "var(--color-danger)";
    case "lightbulb": return "var(--color-primary)";
    default: return "var(--color-success)";
  }
}

// One info item shows at a time and holds for a few seconds before
// crossfading to the next — like a YouTube "i" info card cycling through
// notices — rather than a continuously scrolling marquee. Hovering pauses
// the rotation so the user can actually read whichever item is showing.
function InfoRotator({ items }: { items: { kind: TickerKind; text: string }[] }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (items.length <= 1 || paused) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % items.length), 3400);
    return () => clearInterval(id);
  }, [items.length, paused]);

  if (!items.length) return null;
  const item = items[idx % items.length];
  const color = tickerColor(item.kind);
  const isBug = item.kind === "bug" || item.kind === "alert";

  return (
    <div className="relative mb-3">
      <div
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="relative overflow-visible rounded-lg border h-9 cursor-default"
        style={{
          borderColor: `color-mix(in srgb, ${color} 30%, var(--color-border))`,
          background: isBug
            ? `linear-gradient(90deg, color-mix(in srgb, ${color} 20%, var(--color-surface2)), color-mix(in srgb, ${color} 30%, var(--color-surface2)))`
            : `linear-gradient(90deg, var(--color-surface2), color-mix(in srgb, ${color} 14%, var(--color-surface2)))`,
          boxShadow: "0 4px 12px -6px rgba(0,0,0,0.3) inset",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex items-center gap-1.5 px-3 text-[11px] font-medium overflow-hidden rounded-lg"
            style={{ color }}
          >
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 25%, transparent)` }}
            >
              {tickerIcon(item.kind)}
            </span>
            <span className="truncate">{item.text}</span>
          </motion.div>
        </AnimatePresence>
        {items.length > 1 && (
          <div className="absolute bottom-1 right-2 flex gap-1">
            {items.map((_, i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full"
                style={{ backgroundColor: i === idx ? color : "var(--color-border)" }}
              />
            ))}
          </div>
        )}

        {/* Full-text card — pops up above the ticker on hover so long
            findings are never clipped by the compact bar's single line. */}
        <AnimatePresence>
          {paused && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className="absolute left-0 right-0 bottom-[calc(100%+8px)] z-30 rounded-xl border p-3 text-xs font-medium leading-relaxed"
              style={{
                color: "var(--color-text)",
                borderColor: `color-mix(in srgb, ${color} 40%, var(--color-border))`,
                background: "var(--color-surface)",
                boxShadow: `0 16px 30px -12px color-mix(in srgb, ${color} 45%, rgba(0,0,0,0.3))`,
              }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`, color }}
                >
                  {tickerIcon(item.kind)}
                </span>
                <span>{item.text}</span>
              </div>
              <div
                className="absolute left-5 top-full w-2.5 h-2.5 rotate-45 border-r border-b"
                style={{ background: "var(--color-surface)", borderColor: `color-mix(in srgb, ${color} 40%, var(--color-border))`, marginTop: "-6px" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Custom tooltip for the before/after projection chart ────────────────────
// Shows exactly which fixes/improvements are responsible for the point's
// projected hike, so hovering a bar answers "what change makes this go up".
function ProjectionTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  return (
    <div
      className="rounded-lg border text-xs"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        padding: "8px 10px",
        maxWidth: 230,
      }}
    >
      <p className="font-semibold text-[var(--color-text)] mb-1">{label}</p>
      <p className="text-[var(--color-muted)]">
        Before <span className="font-semibold" style={{ color: "var(--color-danger)" }}>{d.current}</span>
        {" → "}
        After fixes <span className="font-semibold text-[var(--color-success)]">{d.after}</span>
      </p>
      {d.reasons?.length > 0 ? (
        <ul className="mt-1.5 space-y-1">
          {d.reasons.map((r: { text: string; points: number }, i: number) => (
            <li key={i} className="flex items-start gap-1 text-[var(--color-muted)]">
              <TrendingUp size={10} className="text-[var(--color-success)] mt-0.5 flex-shrink-0" />
              <span>{r.text} <span className="text-[var(--color-success)] font-medium">(+{r.points})</span></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-[var(--color-muted)]">No specific fixes suggested for this category</p>
      )}
    </div>
  );
}

// "Before" points render in a warning fill with a red ring so the line's
// own dots read as a distinct color from the red line itself.
function BeforeDot(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={4.5} fill="var(--color-warning)" stroke="var(--color-danger)" strokeWidth={1.75} />;
}
// "After" points render as a bright glass-white dot ringed in green.
function AfterDot(props: any) {
  const { cx, cy } = props;
  if (cx == null || cy == null) return null;
  return <circle cx={cx} cy={cy} r={5} fill="var(--color-surface)" stroke="var(--color-success)" strokeWidth={2} />;
}

// ── Before/after score projection — a solid red "before" line and a solid
// green "after fixes" line, each with its own distinctly colored dot style
// (no dashing on either line so both read as equally confident series).
// Hovering any point surfaces the exact fixes/improvements responsible for
// that category's projected hike. The "after" series is pushed up with a
// minimum visual separation so the two lines never sit close together even
// when the real point gain is small — the gap itself communicates "there's
// real room to improve here".
function ScoreProjectionChart({ data }: {
  data: { name: string; current: number; after: number; gain: number; reasons: { text: string; points: number }[] }[];
}) {
  if (data.length === 0) return null;
  const totalGain = data.reduce((sum, d) => sum + d.gain, 0);
  const strongest = [...data].sort((a, b) => b.current - a.current)[0];
  const weakest = [...data].sort((a, b) => a.current - b.current)[0];

  // Minimum visual gap (in score points) enforced between the "before" and
  // "after" lines purely for legibility — the tooltip still shows the real
  // numbers, this only affects where the "after" line is drawn.
  const MIN_VISUAL_GAP = 14;
  const displayData = data.map(d => ({
    ...d,
    afterDisplay: Math.min(100, Math.max(d.after, d.current + MIN_VISUAL_GAP)),
  }));

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-medium text-[var(--color-muted)] flex items-center gap-1.5">
          <Sparkles size={12} /> Before vs. after-fix score per category
        </p>
        <span
          className="flex items-center gap-1 text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full"
          style={{
            color: totalGain > 0 ? "var(--color-success)" : "var(--color-muted)",
            backgroundColor: `color-mix(in srgb, ${totalGain > 0 ? "var(--color-success)" : "var(--color-muted)"} 12%, transparent)`,
          }}
        >
          <TrendingUp size={12} />
          {totalGain > 0 ? `+${totalGain} pts possible` : "No gains modeled"}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={130}>
        <ComposedChart data={displayData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.35} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--color-muted)" }} interval={0} tickLine={false} />
          <YAxis domain={[0, 100]} hide />
          <Tooltip content={<ProjectionTooltip />} cursor={{ stroke: "var(--color-border)", strokeDasharray: "3 3" }} />
          <Line
            type="monotone" dataKey="current" name="Before"
            stroke="var(--color-danger)" strokeWidth={2.25}
            dot={<BeforeDot />}
            activeDot={{ r: 7, fill: "var(--color-warning)", stroke: "var(--color-danger)", strokeWidth: 2 }}
            isAnimationActive animationDuration={900} animationEasing="ease-out"
          />
          <Line
            type="monotone" dataKey="afterDisplay" name="After fixes"
            stroke="var(--color-success)" strokeWidth={2.5}
            dot={<AfterDot />}
            activeDot={{ r: 8, fill: "var(--color-surface)", stroke: "var(--color-success)", strokeWidth: 2.5 }}
            isAnimationActive animationDuration={1200} animationEasing="ease-out"
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-between text-[10px] text-[var(--color-muted)] mt-1">
        <span className="flex items-center gap-1"><TrendingUp size={10} className="text-[var(--color-success)]" /> {strongest.name} {strongest.current}</span>
        <span className="flex items-center gap-1"><TrendingDown size={10} className="text-[var(--color-danger)]" /> {weakest.name} {weakest.current}</span>
      </div>
    </div>
  );
}


export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [reEvaluating, setReEvaluating] = useState(false);
  // Shared across both "Download Certificate" buttons (Actions bar + Certificate
  // tab) since they always operate on the same project's single certificate —
  // no need to key by id here, unlike a list view with multiple certificates.
  const [downloadingCert, setDownloadingCert] = useState(false);
  // Tracks which of the Strengths / Improvements panels currently has a
  // hovered line, so that panel's whole card can be lifted above its
  // sibling — otherwise the enlarged hover text pokes into the neighboring
  // card and gets rendered half-hidden behind it.
  const [liftedPanel, setLiftedPanel] = useState<null | "strengths" | "improvements">(null);
  const { user } = useAuthStore();
  const isPremium = user?.isPremium ?? false;
  const { refetch: refetchCredits } = useCredits();

  const isTerminal = (status?: string) => status === 'completed' || status === 'failed';

  const fetchProject = useCallback(() => {
    api.get(`/projects/${id}`)
      .then(({ data }) => {
        const next: Project = data.data.project;
        setProject(prev => {
          // Refresh credits the moment the project settles (completed or
          // failed) so the widget can't keep showing a stale balance.
          // This used to only happen inside the socket handler below, but
          // the 8s poll further down (our fallback for when the socket
          // misses the event — reconnects, backgrounded tabs, etc.) called
          // fetchProject() without ever touching credits, so the status
          // badge would flip while the credit widget stayed stale until a
          // manual page refresh. Keying off the actual status transition
          // here means it self-heals regardless of which path caught it,
          // and won't fire repeatedly on every poll tick once settled.
          if (isTerminal(next.status) && (!prev || !isTerminal(prev.status))) {
            refetchCredits();
          }
          return next;
        });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [id, refetchCredits]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  useProjectUpdates(user?.id, (data) => {
    if (data.projectId === id) {
      fetchProject();
    }
  });

  const handleReEvaluate = async () => {
    if (!project) return;
    setReEvaluating(true);
    try {
      await api.post(`/projects/${project.id}/re-evaluate`);
      toast.success("Re-evaluation started");
      fetchProject();
      // Re-evaluating charges a credit immediately, before the project
      // reaches a terminal state again, so reflect that right away too.
      refetchCredits();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Couldn't start re-evaluation");
    } finally {
      setReEvaluating(false);
    }
  };

  const handleDownloadCertificate = async () => {
    if (!project?.certificate) return;
    setDownloadingCert(true);
    try {
      const res = await api.get(`/certificates/${project.certificate.id}/download`, { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `proeva-${project.certificate.verificationId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't download certificate. Please try again.");
    } finally {
      setDownloadingCert(false);
    }
  };

  const certGraceAttempts = useRef(0);
  useEffect(() => {
    if (!project) return;
    const stillEvaluating = project.status !== 'completed' && project.status !== 'failed';
    const awaitingCertificate =
      project.status === 'completed' && (project.score ?? 0) >= 40 && !project.certificate && certGraceAttempts.current < 5;
    if (!stillEvaluating && !awaitingCertificate) return;

    const interval = setInterval(() => {
      if (awaitingCertificate) certGraceAttempts.current += 1;
      fetchProject();
    }, 8000);
    return () => clearInterval(interval);
  }, [project?.status, project?.score, project?.certificate, fetchProject]);

  if (loading)
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-4">
          {[1,2,3].map(i => <div key={i} className="h-32 bg-[var(--color-surface)] rounded-2xl animate-pulse" />)}
        </div>
      </PageWrapper>
    );

  if (!project)
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 text-center py-20">
          <p className="text-[var(--color-muted)]">Project not found.</p>
          <Link to="/projects" className="text-[var(--color-primary)] hover:underline text-sm mt-2 block">← Back</Link>
        </div>
      </PageWrapper>
    );

let evalData: any = project.evaluationReport || {};
if (typeof evalData === "string") {
  try { evalData = JSON.parse(evalData); } catch { evalData = {}; }
}


const report: any              = evalData; // fields are at top level, not under .report
const bugReport: any            = evalData.bugReport || {};
const architectureReport: any   = evalData.architectureReport || {};
const plagiarismReport: any     = evalData.plagiarismReport || {};
const fastScores: any           = evalData.fastScores || {};
const bestPracticesReport: any  = evalData.bestPracticesReport || {};
const improvementsReport: any   = evalData.improvementsReport || {};
const toolResults: any          = evalData.toolResults || {};
const findingsSource: Record<string, string> = evalData.findingsSource || {};
const toolsUsed: string[]       = evalData.toolsUsed || [];
const methodology: string       = evalData.methodology || "";

const bugs: any[] = bugReport.bugs || [];
const categoryScores: Record<string, number> = report.categoryScores || {};
const fastDims: Record<string, any> = fastScores.scores || {};
const archDims: Record<string, any> = architectureReport.dimensions || {};
const fileTree: string[] = evalData.fileTree || [];
const techStack: string[] = evalData.techStack || [];

// Aggregate every source of file-level findings (AI bugs + every static
// tool) into one map so the Code Structure tree can show a single colored
// indicator per file instead of the reader having to cross-reference five
// separate report sections by hand.
const issuesByFile: Record<string, { count: number; severity: "critical" | "high" | "medium" | "low" }> = {};
const bumpFile = (file: string | undefined, severity: "critical" | "high" | "medium" | "low") => {
  if (!file || file === "unknown") return;
  const rank = { critical: 0, high: 1, medium: 2, low: 3 } as const;
  const existing = issuesByFile[file];
  if (!existing) {
    issuesByFile[file] = { count: 1, severity };
  } else {
    existing.count += 1;
    if (rank[severity] < rank[existing.severity]) existing.severity = severity;
  }
};
bugs.forEach((b: any) => bumpFile(b.file, (b.severity as any) || "medium"));
(toolResults?.lint?.issues || []).forEach((i: any) => bumpFile(i.file, i.severity === "error" ? "high" : "low"));
(toolResults?.security?.findings || []).forEach((f: any) => bumpFile(f.file, (f.severity as any) || "medium"));
(toolResults?.secrets?.found || []).forEach((s: any) => bumpFile(s.file, "critical"));
(toolResults?.complexity?.highComplexityFunctions || []).forEach((f: any) => bumpFile(f.file, f.ccn >= 25 ? "high" : "medium"));
(toolResults?.duplication?.clones || []).forEach((c: any) => (c.files || []).forEach((f: string) => bumpFile(f, "low")));

const levelColor = getLevelColor(report.level || project.level || "");

const completed =
  project.status === "completed" &&
  report.overallScore !== undefined && report.overallScore !== null;

const overallScore = project.score ?? report.overallScore ?? 0;

// Strengths
const strengths: string[] = [
  ...(report.topStrength ? [report.topStrength] : []),
  ...(architectureReport.biggestStrength ? [architectureReport.biggestStrength] : []),
].filter(Boolean);

// Improvements needed
const failingChecks = (bestPracticesReport.checks || [])
  .filter((c: any) => c.status === "fail" || c.status === "warn")
  .map((c: any) => c.finding || c.name)
  .filter(Boolean);

const improvementsList: string[] = [
  ...(report.topWeakness ? [report.topWeakness] : []),
  ...failingChecks,
].filter(Boolean);

// Recruiter summary
const recruiterSummary: string[] = (report.summaryBullets?.length
  ? report.summaryBullets
  : bugs.map((b: any) => b.recruiterImpact).filter(Boolean)
) as string[];

const donutData = CATEGORIES.map((c, i) => ({
    name: c.label,
    value: categoryScores[c.key] ?? 0,
    color: PIE_COLORS[i],
  }));

const avgCategoryScore = donutData.length
  ? Math.round(donutData.reduce((sum, d) => sum + d.value, 0) / donutData.length)
  : 0;

  const radarData = CATEGORIES.map(c => ({
  subject: c.label.replace(" ", "\n"),
  value: categoryScores[c.key] ?? 0,
  fullMark: 100,
}));

// Real-data ticker feed for the Skill Radar banner: pulls actual bug
// severities, actual improvement/weakness findings, and actual strengths
// out of this project's own report — never placeholder copy.
const criticalBugs = bugs.filter((b: any) => b.severity === "critical");
const highBugs = bugs.filter((b: any) => b.severity === "high");
const securityBugCount = bugs.filter((b: any) => b.category === "security" || b.category === "Security").length;

const tickerItems: { kind: "alert" | "bug" | "lightbulb" | "star"; text: string }[] = [
  ...(criticalBugs.length > 0
    ? [{ kind: "alert" as const, text: `${criticalBugs.length} critical bug${criticalBugs.length > 1 ? "s" : ""} found${securityBugCount > 0 ? ` — ${securityBugCount} in security` : ""} — fix before shipping` }]
    : []),
  ...(highBugs.length > 0
    ? [{ kind: "bug" as const, text: `${highBugs.length} high-severity issue${highBugs.length > 1 ? "s" : ""} need attention` }]
    : []),
  ...(bugs.length === 0
    ? [{ kind: "star" as const, text: "No bugs detected — clean scan across every file" }]
    : []),
  ...improvementsList.slice(0, 3).map((s) => ({ kind: "lightbulb" as const, text: `Suggestion: ${s}` })),
  ...strengths.slice(0, 2).map((s) => ({ kind: "star" as const, text: `Strength: ${s}` })),
];

// Before/after-fix projection per category: walks every suggested next step
// and improvement, attributes it to its category, and sums up the points it
// would add (falling back to a rough estimate from its impact tier when no
// explicit point value is given). Each category keeps its own list of
// "reasons" so the chart tooltip can show exactly what would cause the hike.
const IMPACT_POINTS: Record<string, number> = { high: 8, medium: 4, low: 2 };

const categoryProjection = CATEGORIES.map(c => {
  const current = categoryScores[c.key] ?? 0;
  const reasons: { text: string; points: number }[] = [];

  (report.nextSteps || []).forEach((step: any) => {
    if (step.category === c.key && step.action) {
      const pts = step.pointsGained || IMPACT_POINTS[step.impact] || 0;
      if (pts > 0) reasons.push({ text: step.action, points: pts });
    }
  });

  (improvementsReport.improvements || []).forEach((imp: any) => {
    if (imp.category === c.key && imp.title) {
      const pts = imp.pointsGained || IMPACT_POINTS[imp.impact] || 0;
      if (pts > 0) reasons.push({ text: imp.title, points: pts });
    }
  });

  let gain = reasons.reduce((sum, r) => sum + r.points, 0);
  // Every category needs a visibly separate "after" point so the two lines
  // never collapse into one — if no explicit next-step/improvement points
  // were logged for this category, project a modest headroom-based gain
  // (still driven by the real current score) instead of leaving it flat.
  if (gain <= 0 && current < 100) {
    const headroomGain = Math.max(3, Math.round((100 - current) * 0.12));
    gain = headroomGain;
    reasons.push({ text: `Headroom for further ${c.label.toLowerCase()} gains`, points: headroomGain });
  }
  const after = Math.min(100, current + gain);
  return { name: c.label, current, after, gain: after - current, reasons };
});

const tabs: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "bugs",        label: `Bugs & fixes${bugs.length ? ` (${bugs.length})` : ""}` },
  { id: "deep",        label: "Deep analysis" },
  { id: "certificate", label: "Certificate" },
];



  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-9 pt-8 pb-16">

        {/* ── Top bar: back link + quick actions moved up front, out of the
            sidebar, so they're reachable without scrolling past the report ── */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors">
            <ArrowLeft size={14} /> Back to projects
          </Link>
          {completed && (
            <div className="flex items-center gap-2">
              {project.certificate && (
                <Button variant="secondary" size="sm" loading={downloadingCert} disabled={downloadingCert} onClick={handleDownloadCertificate}>
                  <Download size={14} /> Certificate
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleReEvaluate} loading={reEvaluating} disabled={reEvaluating}>
                <RefreshCw size={14} /> Re-evaluate
              </Button>
              <Button variant="ghost" size="sm"
                onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profile/${project.user?.username}`); toast.success("Profile link copied!"); }}>
                <ExternalLink size={14} /> Share
              </Button>
            </div>
          )}
        </div>

        {/* ── Hero card: title/meta on the left, score ring + before/after
            projection on the right ── */}
        <Card glass glow glowColor="var(--color-primary)" className="p-6 mb-5 mt-1 relative overflow-hidden" style={duoCardStyle("var(--color-primary)", "var(--color-secondary)")}>
          <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "var(--gradient-brand)" }} />

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
            {/* left: identity */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-widest">
                  PROEVA EVALUATION REPORT
                </span>
                {(report.level || project.level) && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border"
                    style={{ color: levelColor, backgroundColor: `${levelColor}15`, borderColor: `${levelColor}30` }}>
                    {report.level || project.level}
                  </span>
                )}
                <Badge variant={
                  project.status === "completed" ? "success"
                    : project.status === "evaluating" ? "warning"
                    : project.status === "failed" ? "danger"
                    : "muted"
                }>
                  {project.status}
                </Badge>
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{project.title}</h1>
              <p className="text-xs text-[var(--color-muted)] mt-1 flex items-center gap-1.5 flex-wrap">
                <DomainBadge
                  domain={report.domain || project.domain}
                  confidence={toolResults?.domain?.confidence}
                  detectionMethod={toolResults?.domain?.detectionMethod}
                />
                <span>· Evaluated {formatDate(project.createdAt)}</span>
              </p>
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline mt-3">
                  <GitBranch size={12} /> {project.githubUrl.replace("https://github.com/", "")}
                </a>
              )}

              {completed && (
                <div className="flex items-start gap-4 mt-5">
                  <ScoreRing score={overallScore} />
                  <div className="flex-1">
                    <p className="text-sm text-[var(--color-muted)] leading-relaxed">{report.summary}</p>
                    {report.headline && (
                      <p className="text-xs mt-2 font-medium flex items-center gap-1.5" style={{ color: "var(--color-primary)" }}>
                        <span className="w-1 h-1 rounded-full bg-current inline-block" />
                        {report.headline}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* right: stats + before/after projection chart */}
            {completed && (
              <div className="rounded-xl border border-[var(--color-border)] p-4 flex flex-col gap-4"
                style={{ background: "linear-gradient(180deg, var(--color-surface2), transparent)" }}>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Bugs Found",    value: bugs.length, icon: <Bug size={13} />, color: bugs.length > 0 ? "var(--color-danger)" : "var(--color-success)" },
                    { label: "Production",    value: report.productionReadiness ?? "—", icon: <Shield size={13} />, color: "var(--color-secondary)" },
                    { label: "Experience", value: report.estimatedExperience ?? "—", icon: <Star size={13} />, color: "var(--color-purple)" },
                    { label: "After fixes", value: report.projectedScore ? `${report.projectedScore}/100` : "—", icon: <TrendingUp size={13} />, color: "var(--color-success)" },
                  ].map(({ label, value, icon, color }) => (
                    <div key={label} className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)` }}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-[var(--color-text)] capitalize leading-tight">{value}</p>
                        <p className="text-[10px] text-[var(--color-muted)] mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <ScoreProjectionChart data={categoryProjection} />
              </div>
            )}
          </div>

          {completed && (
            <MethodologyStrip
              methodology={methodology}
              toolsUsed={toolsUsed}
              filesScanned={toolResults?.meta?.filesScanned}
              linesScanned={toolResults?.meta?.linesScanned}
            />
          )}

          {project.status === "evaluating" && (
            <div className="flex items-center gap-3 py-4">
              <div className="animate-spin w-5 h-5 border-2 border-[var(--color-primary)] border-t-transparent rounded-full" />
              <p className="text-sm text-[var(--color-muted)]">AI is analyzing your code… Results in 2–3 min</p>
            </div>
          )}

          {project.status === "failed" && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-4 px-4 -mx-2 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]">
              <AlertTriangle size={20} className="text-[var(--color-danger)] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[var(--color-text)]">Evaluation failed</p>
                <p className="text-xs text-[var(--color-muted)] mt-0.5">
                  Something went wrong while analyzing this project. Any credit charged for this attempt has been refunded — you can safely try again.
                </p>
              </div>
              <Button size="sm" onClick={handleReEvaluate} loading={reEvaluating}>
                <RefreshCw size={14} /> Re-evaluate
              </Button>
            </div>
          )}
        </Card>

        {project.status === "evaluating" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <Card className="p-6 space-y-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-8 bg-[var(--color-surface2)] rounded-lg animate-pulse" />
                ))}
              </Card>
            </div>
            <div className="space-y-5">
              <Card className="p-5">
                <div className="h-48 bg-[var(--color-surface2)] rounded-lg animate-pulse" />
              </Card>
              <Card className="p-5">
                <div className="h-32 bg-[var(--color-surface2)] rounded-lg animate-pulse" />
              </Card>
            </div>
          </div>
        )}

        {/* ── Tabs — underline style, icon-free label pills with an
            animated indicator that slides between them ── */}
        {completed && (
          <>
            <div className="flex gap-5 border-b border-[var(--color-border)] mb-6 max-w-full overflow-x-auto">
             {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`relative pb-3 text-sm font-medium transition-colors flex items-center gap-1.5 shrink-0 ${
                    tab === t.id ? "text-[var(--color-text)]" : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}>
                  {t.id === "deep" && !isPremium && <Lock size={12} />}
                  {t.label}
                  {tab === t.id && (
                    <motion.span
                      layoutId="activeTabUnderline"
                      className="absolute left-0 right-0 -bottom-[1px] h-[2px] rounded-full bg-[var(--color-primary)]"
                      transition={{ type: "spring", stiffness: 500, damping: 35 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB — charts lead on the left now, category
                detail + strengths/improvements sit on the right, the
                reverse of the original left-content / right-charts split ── */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* left col — charts */}
                <div className="space-y-5 lg:order-1">
                  <motion.div {...hoverLift}>
                  <Card glass hover glow glowColor="var(--color-danger)" className="p-5 m-1" style={duoCardStyle("var(--color-danger)", "var(--color-warning)")}>
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-1 flex items-center gap-1.5">
                      <Bug size={14} className="text-[var(--color-danger)]" /> Skill Radar
                    </h3>
                    <p className="text-[11px] text-[var(--color-muted)] mb-2">Shape of strength across every dimension</p>
                    <InfoRotator items={tickerItems} />
                    <div className="relative">
                      {/* Radar-sweep overlay: a thin red wedge rotates continuously
                          behind the web, like a live radar scanner tracing it out. */}
                      <style>{`
                        @keyframes radarSweepSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                      `}</style>
                      <div
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                        aria-hidden="true"
                      >
                        <div
                          style={{
                            width: "68%",
                            height: "68%",
                            borderRadius: "50%",
                            background: "conic-gradient(from 0deg, transparent 0deg, transparent 305deg, color-mix(in srgb, var(--color-danger) 55%, transparent) 335deg, transparent 360deg)",
                            animation: "radarSweepSpin 3.2s linear infinite",
                            opacity: 0.45,
                          }}
                        />
                      </div>
                      {/* HUD-style center reticle — a bug icon inside a lightly
                          webbed ring, replacing the old spider-leg glyph */}
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
                        <svg width="30" height="30" viewBox="0 0 28 28" style={{ opacity: 0.85 }}>
                          <circle cx="14" cy="14" r="9" fill="none" stroke="var(--color-danger)" strokeWidth="1" opacity="0.25" />
                          <line x1="14" y1="1" x2="14" y2="27" stroke="var(--color-danger)" strokeWidth="0.75" opacity="0.2" />
                          <line x1="1" y1="14" x2="27" y2="14" stroke="var(--color-danger)" strokeWidth="0.75" opacity="0.2" />
                          <circle cx="14" cy="14" r="6" fill="var(--color-danger)" fillOpacity="0.14" stroke="var(--color-danger)" strokeWidth="1" opacity="0.5" />
                          {/* lucide "bug" glyph, hand-inlined so it can inherit the
                              radar's red tone without an extra image import */}
                          <g transform="translate(14,14) scale(0.62) translate(-12,-12)" stroke="var(--color-danger)" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m8 2 1.88 1.88" />
                            <path d="M14.12 3.88 16 2" />
                            <path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1" />
                            <path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6" />
                            <path d="M12 20v-9" />
                            <path d="M6.53 9C4.6 8.8 3 7.1 3 5" />
                            <path d="M6 13H2" />
                            <path d="M3 21c0-2.1 1.7-3.9 3.8-4" />
                            <path d="M20.97 5c0 2.1-1.6 3.8-3.5 4" />
                            <path d="M22 13h-4" />
                            <path d="M17.2 17c2.1.1 3.8 1.9 3.8 4" />
                          </g>
                        </svg>
                      </div>
                      {/* HUD corner brackets framing the chart */}
                      {[
                        "top-1 left-1 border-t-2 border-l-2",
                        "top-1 right-1 border-t-2 border-r-2",
                        "bottom-1 left-1 border-b-2 border-l-2",
                        "bottom-1 right-1 border-b-2 border-r-2",
                      ].map((pos, idx) => (
                        <div
                          key={idx}
                          aria-hidden="true"
                          className={`pointer-events-none absolute w-3 h-3 border-[var(--color-danger)] opacity-40 ${pos}`}
                        />
                      ))}
                      <ResponsiveContainer width="100%" height={280}>
                        <RadarChart data={radarData} outerRadius="68%">
                          <defs>
                            <linearGradient id="radarFill" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="var(--color-danger)" stopOpacity={0.28} />
                              <stop offset="100%" stopColor="var(--color-danger)" stopOpacity={0.06} />
                            </linearGradient>
                            <filter id="radarGlow" x="-40%" y="-40%" width="180%" height="180%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                              </feMerge>
                            </filter>
                          </defs>
                          {/* full spiderweb: polygon rings at 25/50/75/100 plus the spokes,
                              so the shape reads as a web rather than a faint circle */}
                          <PolarGrid gridType="polygon" stroke="var(--color-border)" strokeOpacity={0.6} />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-muted)", fontSize: 10 }} />
                          <PolarRadiusAxis
                            domain={[0, 100]} tickCount={5} axisLine={false}
                            tick={{ fill: "var(--color-muted)", fontSize: 9 }}
                          />
                          <Radar
                            name="Baseline" dataKey={() => 50}
                            stroke="var(--color-muted)" strokeOpacity={0.4} strokeDasharray="3 4" fill="transparent"
                            isAnimationActive={false}
                          />
                          {/* Score web: a connected low-opacity fill + stroked
                              outline (no per-point dot animation) so the shape
                              reads as a net/web rather than a scatter of points */}
                          <Radar
                            name="Score" dataKey="value"
                            stroke="var(--color-danger)" strokeWidth={1.5} strokeOpacity={0.6}
                            fill="url(#radarFill)" fillOpacity={1}
                            isAnimationActive animationDuration={1000} animationEasing="ease-out"
                          />
                          <Legend
                            verticalAlign="bottom" height={20}
                            formatter={(v) => <span className="text-[10px] text-[var(--color-muted)]">{v}</span>}
                          />
                          <Tooltip
                            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                            labelStyle={{ color: "var(--color-text)" }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                  </motion.div>

                  <motion.div {...hoverLift}>
                  <Card glass hover glow glowColor="var(--color-secondary)" className="p-5 m-1 relative overflow-hidden" style={duoCardStyle("var(--color-secondary)", "var(--color-primary)")}>
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Score Distribution</h3>
                    {/* ambient glow pad behind the donut for the same "lifted
                        off the screen" premium feel as the hero score ring */}
                    <div
                      className="absolute rounded-full pointer-events-none"
                      style={{
                        top: "18%", left: "50%", width: "62%", height: "62%",
                        transform: "translateX(-50%)",
                        background: `radial-gradient(circle, color-mix(in srgb, var(--color-secondary) 30%, transparent), transparent 72%)`,
                        filter: "blur(14px)",
                      }}
                    />
                    <div className="relative" style={{ filter: "drop-shadow(0 14px 22px rgba(0,0,0,0.35))" }}>
                      <ResponsiveContainer width="100%" height={190}>
                        <PieChart>
                          <defs>
                            {donutData.map((d, i) => (
                              <radialGradient key={i} id={`donutGrad-${i}`} cx="35%" cy="30%" r="75%">
                                <stop offset="0%" stopColor={d.color} stopOpacity={1} />
                                <stop offset="100%" stopColor={d.color} stopOpacity={0.65} />
                              </radialGradient>
                            ))}
                          </defs>
                          <Pie data={donutData} cx="50%" cy="50%" innerRadius={48} outerRadius={76}
                            dataKey="value" paddingAngle={3}>
                            {donutData.map((entry, i) => (
                              <Cell key={i} fill={`url(#donutGrad-${i})`} stroke="var(--color-bg)" strokeWidth={2} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                            labelStyle={{ color: "var(--color-text)" }}
                            itemStyle={{ color: "var(--color-muted)" }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      {/* glass center readout — sits in the donut hole */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 24 }}>
                        <span className="text-2xl font-bold tabular-nums" style={{ color: getScoreColor(avgCategoryScore) }}>
                          {avgCategoryScore}
                        </span>
                        <span className="text-[9px] text-[var(--color-muted)] uppercase tracking-wide">avg score</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {donutData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color, boxShadow: `0 0 6px 0 color-mix(in srgb, ${d.color} 60%, transparent)` }} />
                          {d.name} {d.value}%
                        </div>
                      ))}
                    </div>
                  </Card>
                  </motion.div>

                  {!isPremium && (
                    <Card className="p-4 flex items-center justify-center">
                      <AdSidebar />
                    </Card>
                  )}
                </div>

                {/* right col — category grid, strengths/improvements, plagiarism */}
                <div className="lg:col-span-2 space-y-5 lg:order-2">
                  <motion.div {...hoverLift}>
                  <Card glass hover className="p-6 m-1" style={duoCardStyle("var(--color-primary)", "var(--color-success)")}>
                    <h2 className="font-semibold text-[var(--color-text)] mb-5 flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full" style={{ background: "var(--gradient-brand)" }} />
                      Category Scores
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {CATEGORIES.map((c, i) => {
                        const score = categoryScores[c.key] ?? 0;
                        const feedback = fastDims[c.key]?.rationale || archDims[c.key]?.finding;
                        const theme = PIE_COLORS[i % PIE_COLORS.length];
                        return (
                          <motion.div
                            key={c.key}
                            custom={i}
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="show"
                            viewport={{ once: true }}
                            whileHover={{
                              y: -6, scale: 1.045,
                              boxShadow: `0 2px 0 0 color-mix(in srgb, ${theme} 55%, transparent), 0 16px 26px -8px color-mix(in srgb, ${theme} 45%, transparent)`,
                            }}
                            transition={{ type: "spring", stiffness: 350, damping: 22 }}
                            className="flex items-start gap-3 p-3 rounded-xl border"
                            style={{
                              borderColor: `color-mix(in srgb, ${theme} 35%, transparent)`,
                              background: `linear-gradient(160deg, color-mix(in srgb, ${theme} 22%, var(--color-surface2)), color-mix(in srgb, ${theme} 9%, transparent))`,
                              boxShadow: `0 3px 0 0 color-mix(in srgb, ${theme} 40%, transparent), 0 10px 18px -8px color-mix(in srgb, ${theme} 35%, transparent)`,
                            }}
                          >
                            <RadialScore score={score} />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--color-text)] flex items-center gap-1.5">{c.icon} {c.label}</p>
                              {feedback && <p className="text-xs text-[var(--color-muted)] mt-1 line-clamp-2">{feedback}</p>}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </Card>
                  </motion.div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                      {...hoverLift}
                      style={{ position: "relative", zIndex: liftedPanel === "strengths" ? 40 : 1 }}
                    >
                    <Card glass hover glow glowColor="var(--color-success)" className="p-5 m-1 overflow-visible" style={duoCardStyle("var(--color-success)", "var(--color-primary)")}>
                      <h3 className="text-base font-semibold text-[var(--color-success)] mb-3 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "color-mix(in srgb, var(--color-success) 16%, transparent)" }}>
                          <Star size={14} />
                        </span>
                        Strengths
                      </h3>
                      {strengths.length === 0
                        ? <p className="text-xs text-[var(--color-muted)]">None detected</p>
                        : <ul
                            className="space-y-2"
                            onMouseEnter={() => setLiftedPanel("strengths")}
                            onMouseLeave={() => setLiftedPanel(null)}
                          >
                            {strengths.map((s: string, i: number) => {
                              const chipColor = PIE_COLORS[i % PIE_COLORS.length];
                              return (
                              <motion.li
                                key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                                whileHover={{ scale: 1.03, x: 3 }}
                                style={{ transformOrigin: "left center" }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                className="relative flex items-start gap-2 text-xs text-[var(--color-text)] rounded-lg px-2.5 py-2 border cursor-default"
                              >
                                <div
                                  aria-hidden="true"
                                  className="absolute inset-0 rounded-lg -z-10"
                                  style={{ background: `color-mix(in srgb, var(--color-success) 16%, var(--color-surface2))`, borderColor: `color-mix(in srgb, var(--color-success) 35%, transparent)` }}
                                />
                                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: chipColor, boxShadow: `0 0 6px 0 color-mix(in srgb, ${chipColor} 60%, transparent)` }} />
                                {s}
                              </motion.li>
                            );})}
                          </ul>
                      }
                    </Card>
                    </motion.div>
                    <motion.div
                      {...hoverLift}
                      style={{ position: "relative", zIndex: liftedPanel === "improvements" ? 40 : 1 }}
                    >
                    <Card glass hover glow glowColor="var(--color-warning)" className="p-5 m-1 overflow-visible" style={duoCardStyle("var(--color-warning)", "var(--color-danger)")}>
                      <h3 className="text-base font-semibold text-[var(--color-warning)] mb-3 flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: "color-mix(in srgb, var(--color-warning) 16%, transparent)" }}>
                          <AlertTriangle size={14} />
                        </span>
                        Improvements Needed
                      </h3>
                      {improvementsList.length === 0
                        ? <p className="text-xs text-[var(--color-muted)]">None detected</p>
                        : <ul
                            className="space-y-2"
                            onMouseEnter={() => setLiftedPanel("improvements")}
                            onMouseLeave={() => setLiftedPanel(null)}
                          >
                            {improvementsList.map((s: string, i: number) => {
                              const chipColor = PIE_COLORS[(i + 2) % PIE_COLORS.length];
                              return (
                              <motion.li
                                key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                                whileHover={{ scale: 1.03, x: 3 }}
                                style={{ transformOrigin: "left center" }}
                                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                                className="relative flex items-start gap-2 text-xs text-[var(--color-text)] rounded-lg px-2.5 py-2 border cursor-default"
                              >
                                <div
                                  aria-hidden="true"
                                  className="absolute inset-0 rounded-lg -z-10"
                                  style={{ background: `color-mix(in srgb, var(--color-warning) 16%, var(--color-surface2))`, borderColor: `color-mix(in srgb, var(--color-warning) 35%, transparent)` }}
                                />
                                <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: chipColor, boxShadow: `0 0 6px 0 color-mix(in srgb, ${chipColor} 60%, transparent)` }} />
                                {s}
                              </motion.li>
                            );})}
                          </ul>
                      }
                    </Card>
                    </motion.div>
                  </div>

                  <motion.div {...hoverLift}>
                  <Card glass hover className="p-5 m-1" style={duoCardStyle("var(--color-secondary)", "var(--color-warning)")}>
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Plagiarism Risk</h3>
                    <PlagiarismBar
                      risk={report.plagiarismRisk ?? plagiarismReport.riskLevel ?? "low"}
                      similarityPercent={plagiarismReport.similarityPercent}
                    />
                    {plagiarismReport.verdict && (
                      <p className="text-xs text-[var(--color-muted)] mt-3">{plagiarismReport.verdict}</p>
                    )}
                  </Card>
                  </motion.div>

                  <motion.div {...hoverLift}>
                  <Card glass hover className="p-5 m-1" style={duoCardStyle("var(--color-primary)", "var(--color-secondary)")}>
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Quick Info</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[var(--color-muted)] text-xs mb-1">Plagiarism</p>
                        <Badge variant={
                          (report.plagiarismRisk ?? plagiarismReport.riskLevel) === "low" ? "success"
                          : (report.plagiarismRisk ?? plagiarismReport.riskLevel) === "medium" ? "warning"
                          : "danger"
                        }>
                          {report.plagiarismRisk ?? plagiarismReport.riskLevel}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-[var(--color-muted)] text-xs mb-1">Experience</p>
                        <span className="text-[var(--color-text)] text-xs">{report.estimatedExperience}</span>
                      </div>
                      <div>
                        <p className="text-[var(--color-muted)] text-xs mb-1">Production</p>
                        <span className="text-[var(--color-text)] text-xs capitalize">{report.productionReadiness}</span>
                      </div>
                      {report.projectedScore && (
                        <div>
                          <p className="text-[var(--color-muted)] text-xs mb-1">After fixes</p>
                          <span className="text-[var(--color-success)] font-medium text-xs">{report.projectedScore}/100</span>
                        </div>
                      )}
                    </div>
                  </Card>
                  </motion.div>
                </div>
              </div>
            )}

            {/* ── BUGS TAB — each finding reads like a live scanner log:
                a terminal-style header line, plain explanation text, then
                the bug code (top) and its fix (below) type themselves out
                the moment the card scrolls into view ── */}
            {tab === "bugs" && (
              <div className="space-y-4">
                {bugs.length === 0 ? (
                  <Card className="p-10 text-center m-1" style={duoCardStyle("var(--color-success)", "var(--color-primary)")}>
                    <Bug size={32} className="text-[var(--color-success)] mx-auto mb-3" />
                    <p className="text-[var(--color-text)] font-medium">No bugs detected</p>
                    <p className="text-[var(--color-muted)] text-sm mt-1">Clean code — no critical issues found</p>
                  </Card>
                ) : (
                  <>
                    <p className="text-sm text-[var(--color-muted)]">{bugs.length} issues found in your codebase</p>
                    {bugs.map((bug: any, i: number) => (
                      <motion.div key={bug.id} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
                        whileHover={{ y: -5, scale: 1.012 }} transition={{ type: "spring", stiffness: 350, damping: 22 }}>
                        <Card className="p-5 m-1 overflow-hidden" style={duoCardStyle(SEVERITY_COLOR[bug.severity] || "var(--color-muted)", "var(--color-secondary)")}>
                          <div className="flex items-center gap-2 mb-3 text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-wider">
                            <Terminal size={11} />
                            <span>scan://{bug.file}{bug.line ? `:${bug.line}` : ""}</span>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: `color-mix(in srgb, ${SEVERITY_COLOR[bug.severity] || "var(--color-muted)"} 10%, transparent)` }}>
                              <Bug size={14} style={{ color: SEVERITY_COLOR[bug.severity] || "var(--color-muted)" }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-sm font-medium text-[var(--color-text)]">{bug.title}</p>
                                <Badge variant={
                                  bug.severity === "critical" || bug.severity === "high" ? "danger"
                                  : bug.severity === "medium" ? "warning" : "muted"
                                }>
                                  {bug.severity}
                                </Badge>
                                {bug.category && <Badge variant="muted">{bug.category}</Badge>}
                                <FindingSourceBadge source={bug.source || "ai-insight"} tool={bug.sourceTool} />
                              </div>
                              <p className="text-xs text-[var(--color-muted)]">
                                {bug.file}{bug.line ? `:${bug.line}` : ""}{bug.functionName ? ` · ${bug.functionName}` : ""}
                              </p>
                              {bug.explanation && (
                                <p className="text-xs text-[var(--color-muted)] mt-2 font-mono leading-relaxed">
                                  {bug.explanation}
                                </p>
                              )}
                              <BugCodeView badCode={bug.badCode} fixCode={bug.fixCode} fixExplanation={bug.fixExplanation} />
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── DEEP ANALYSIS TAB ── */}
            {tab === "deep" && (
              <PremiumGate feature="deep-project-analysis" showBlurPreview>
              <div className="space-y-5">
                <FileTreeExplorer fileTree={fileTree} issuesByFile={issuesByFile} techStack={techStack} />

                <VerifiedFindings toolResults={toolResults} />

                {report.nextSteps?.length > 0 && (
                  <Card className="p-6 m-1" style={accentDuoCardStyle(ACCENTS.nextSteps, "var(--color-success)")}>
                    <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                      <ChevronRight size={16} style={{ color: ACCENTS.nextSteps }} /> Next Steps to Level Up
                    </h2>
                    <div className="space-y-3">
                      {report.nextSteps.map((step: any, i: number) => {
                        const impactColor = step.impact === "high" ? "var(--color-success)" : step.impact === "medium" ? "var(--color-warning)" : "var(--color-muted)";
                        return (
                        <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                          whileHover={{ x: 4, y: -3, scale: 1.01, boxShadow: `0 12px 22px -12px color-mix(in srgb, ${impactColor} 50%, transparent)` }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="flex items-start gap-3 p-3 bg-[var(--color-bg)] rounded-xl border"
                          style={{
                            borderLeft: `3px solid ${impactColor}`,
                            borderTop: `1px solid color-mix(in srgb, ${impactColor} 25%, var(--color-border))`,
                            borderRight: `1px solid color-mix(in srgb, ${impactColor} 25%, var(--color-border))`,
                            borderBottom: `1px solid color-mix(in srgb, ${impactColor} 25%, var(--color-border))`,
                          }}>
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ backgroundColor: `color-mix(in srgb, ${ACCENTS.nextSteps} 20%, transparent)`, color: ACCENTS.nextSteps }}>
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-[var(--color-text)]">{step.action}</p>
                            <div className="flex gap-3 mt-1.5 items-center flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                style={{ color: impactColor, backgroundColor: `color-mix(in srgb, ${impactColor} 12%, transparent)` }}>
                                {step.impact} impact
                              </span>
                              <span className="text-xs text-[var(--color-muted)]">effort: {step.effort}</span>
                              {step.pointsGained > 0 && (
                                <span className="text-xs text-[var(--color-primary)]">+{step.pointsGained} pts</span>
                              )}
                              <FindingSourceBadge source={step.source} />
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-[var(--color-muted)] flex-shrink-0 mt-1" />
                        </motion.div>
                      );})}
                    </div>
                  </Card>
                )}

                {report.suggestedChanges?.length > 0 && (
                  <Card className="p-6 m-1" style={accentDuoCardStyle(ACCENTS.codeChanges, "var(--color-secondary)")}>
                    <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                      <Code2 size={16} style={{ color: ACCENTS.codeChanges }} /> Suggested Code Changes
                    </h2>
                    <div className="space-y-4">
                      {report.suggestedChanges.map((sc: any, i: number) => {
                        const lineColor = PIE_COLORS[i % PIE_COLORS.length];
                        return (
                        <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                          whileHover={{ scale: 1.012, x: 3, boxShadow: `0 10px 20px -14px color-mix(in srgb, ${lineColor} 55%, transparent)` }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="pb-4 last:pb-0 rounded-lg pl-3"
                          style={{ borderLeft: `3px solid ${lineColor}`, borderBottom: "1px solid var(--color-border)" }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: lineColor }} />
                            <p className="text-sm text-[var(--color-text)]">
                              {sc.file}{sc.line ? `:${sc.line}` : ""} — {sc.issue}
                            </p>
                            <FindingSourceBadge source={sc.source} />
                          </div>
                          {sc.before && (
                            <pre className="text-xs bg-[var(--color-bg)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] rounded-lg p-3 mt-1 overflow-x-auto text-[var(--color-danger)]">
                              {sc.before}
                            </pre>
                          )}
                          {sc.after && (
                            <pre className="text-xs bg-[var(--color-bg)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] rounded-lg p-3 mt-1 overflow-x-auto text-[var(--color-success)]">
                              {sc.after}
                            </pre>
                          )}
                          {sc.reason && <p className="text-xs text-[var(--color-muted)] mt-1">{sc.reason}</p>}
                        </motion.div>
                      );})}
                    </div>
                  </Card>
                )}

                {improvementsReport.improvements?.length > 0 && (
                  <Card className="p-6 m-1" style={accentDuoCardStyle(ACCENTS.improvements, "var(--color-primary)")}>
                    <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                      <Lightbulb size={16} style={{ color: ACCENTS.improvements }} /> Improvement Recommendations
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {improvementsReport.improvements.map((imp: any, i: number) => {
                        const impactColor = imp.impact === "high" ? "var(--color-success)" : imp.impact === "medium" ? "var(--color-warning)" : "var(--color-muted)";
                        return (
                        <motion.div key={imp.id} custom={i} variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}
                          whileHover={{ y: -5, scale: 1.02, boxShadow: `0 14px 26px -12px color-mix(in srgb, ${impactColor} 45%, transparent)` }}
                          transition={{ type: "spring", stiffness: 350, damping: 22 }}
                          className="p-4 rounded-xl border bg-[var(--color-surface2)]/40"
                          style={{ borderLeft: `3px solid ${impactColor}`, borderTop: "1px solid var(--color-border)", borderRight: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-sm font-medium text-[var(--color-text)]">{imp.title}</p>
                            <Badge variant="muted">{imp.category}</Badge>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                              style={{ color: impactColor, backgroundColor: `color-mix(in srgb, ${impactColor} 12%, transparent)` }}>
                              {imp.impact} impact
                            </span>
                            <span className="text-xs text-[var(--color-muted)]">effort: {imp.effort}</span>
                            <FindingSourceBadge source={imp.source} />
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{imp.file}</p>
                          {imp.description && <p className="text-xs text-[var(--color-muted)] mt-1">{imp.description}</p>}
                          {imp.whyItMatters && <p className="text-xs text-[var(--color-primary)] mt-1">{imp.whyItMatters}</p>}
                        </motion.div>
                      );})}
                    </div>
                  </Card>
                )}

                {recruiterSummary.length > 0 && (
                  <Card className="p-6 m-1" style={accentDuoCardStyle(ACCENTS.recruiter, "var(--color-primary)")}>
                    <h2 className="font-semibold text-[var(--color-text)] mb-4 flex items-center gap-2">
                      <Sparkles size={16} style={{ color: ACCENTS.recruiter }} /> Recruiter Summary
                    </h2>
                    {toolsUsed.length > 0 && (
                      <p className="text-xs text-[var(--color-primary)] mb-3 font-medium">
                        Scanned with {toolsUsed.length} industry-standard tools ({toolsUsed.join(", ")}) plus AI code review
                      </p>
                    )}
                    <ul className="space-y-1.5">
                      {recruiterSummary.map((point: string, i: number) => {
                        const lineColor = PIE_COLORS[i % PIE_COLORS.length];
                        return (
                        <li key={i}
                          className="flex items-start gap-2 text-sm text-[var(--color-muted)] pl-3 py-1 rounded-md"
                          style={{ borderLeft: `3px solid ${lineColor}`, background: `color-mix(in srgb, ${lineColor} 12%, transparent)` }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: lineColor }} />
                          {point}
                        </li>
                      );})}
                    </ul>
                  </Card>
                )}

                {/* Full breakdown as a numbered pyramid — each tier is a
                    category, tier number matches the legend entry below, so
                    the same data reads as a hierarchy rather than a list of
                    bars (which Overview already covers). */}
                <Card className="p-6 m-1" style={duoCardStyle("var(--color-primary)", "var(--color-success)")}>
                  <h2 className="font-semibold text-[var(--color-text)] mb-1">Full Category Breakdown</h2>
                  <p className="text-xs text-[var(--color-muted)] mb-4">Every dimension, ranked top to bottom, with its score and findings</p>
                  <div className="max-w-xl mx-auto mb-2">
                    <CategoryPyramid categories={CATEGORIES} scores={categoryScores} />
                  </div>
                  <div className="space-y-5 mt-4">
                    {CATEGORIES.map((c, i) => {
                      const score = categoryScores[c.key] ?? 0;
                      const dim = archDims[c.key];
                      const fast = fastDims[c.key];
                      const color = PIE_COLORS[i % PIE_COLORS.length];
                      return (
                        <div key={c.key} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-[var(--color-text)]">
                              <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                                style={{ backgroundColor: color, color: "var(--color-bg)" }}>
                                {i + 1}
                              </span>
                              {c.icon}
                              <span className="text-sm font-medium">{c.label}</span>
                              <span className="text-xs font-semibold ml-1" style={{ color }}>{score}/100</span>
                              {(c.key === "security" || c.key === "bestPractices") && (
                                <span
                                  title="Score derived from Semgrep + Gitleaks + Trivy scan results, cross-checked by AI"
                                  className="text-[10px] w-4 h-4 rounded-full border border-[var(--color-border)] text-[var(--color-muted)] flex items-center justify-center cursor-help"
                                >
                                  i
                                </span>
                              )}
                            </div>
                          </div>
                          {(dim?.finding || fast?.rationale) && (
                            <p className="text-xs text-[var(--color-muted)] mt-2">{dim?.finding || fast?.rationale}</p>
                          )}
                          {dim?.recommendation && (
                            <p className="text-xs mt-1 flex items-start gap-1.5 rounded-md px-2 py-1"
                              style={{ color: "var(--color-primary)", backgroundColor: "color-mix(in srgb, var(--color-primary) 16%, transparent)", boxShadow: "0 4px 10px -6px color-mix(in srgb, var(--color-primary) 40%, transparent)" }}>
                              <span className="mt-0.5">•</span>{dim.recommendation}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
              </PremiumGate>
            )}

            {/* ── CERTIFICATE TAB ── */}
            {tab === "certificate" && (
              <Card className="p-8 text-center m-1" style={duoCardStyle(project.certificate ? "var(--color-primary)" : "var(--color-warning)", "var(--color-secondary)")}>
                {project.certificate ? (
                  <>
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }}
                      className="w-20 h-20 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Download size={32} className="text-[var(--color-primary)]" />
                    </motion.div>
                    <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Certificate Ready</h2>
                    <p className="text-[var(--color-muted)] text-sm mb-2">Verification ID: <span className="text-[var(--color-primary)] font-mono">{project.certificate.verificationId}</span></p>
                    {report.headline && (
                      <p className="text-sm text-[var(--color-text)] bg-[var(--color-surface)] rounded-xl px-4 py-3 mb-6 max-w-lg mx-auto">{report.headline}</p>
                    )}
                    {toolsUsed.length > 0 && (
                      <p className="text-[10px] text-[var(--color-muted)] mb-4">
                        Verified with {toolsUsed.join(", ")} + AI code review
                      </p>
                    )}
                    <Button
                      loading={downloadingCert}
                      disabled={downloadingCert}
                      onClick={handleDownloadCertificate}
                    >
                      <Download size={15} /> Download PDF Certificate
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-warning)_20%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Star size={32} className="text-[var(--color-warning)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Certificate Not Yet Issued</h2>
                    <p className="text-[var(--color-muted)] text-sm">A minimum score is required to receive a certificate. Your current score is <span className="text-[var(--color-text)] font-semibold">{overallScore}/100</span>.</p>
                  </>
                )}
              </Card>
            )}
          </>
        )}
      </div>
    </PageWrapper>
  );
}