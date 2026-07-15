import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Download, RefreshCw, ExternalLink, GitBranch,
  Shield, Zap, Code2, BookOpen, Layers, Star, AlertTriangle, Bug, Lock,
} from "lucide-react";
import { Project } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, getLevelColor, getScoreColor } from "@/lib/utils";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useProjectUpdates } from "@/hooks/useSocket";
import { useCredits } from "@/hooks/useCredits";
import { useAuthStore } from "@/store/authStore";
import { PremiumGate } from "@/components/premium/PremiumGate";
import { AdSidebar } from "@/components/ads/AdSidebar";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
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

// ── helpers ───────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r = 16;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <circle cx="18" cy="18" r={r} fill="none" stroke="var(--color-surface2)" strokeWidth="3" />
        <circle cx="18" cy="18" r={r} fill="none"
          stroke={getScoreColor(score)} strokeWidth="3"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-[var(--color-text)]">{score}</span>
        <span className="text-[9px] text-[var(--color-muted)]">/100</span>
      </div>
    </div>
  );
}

function BarRow({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <div className="w-5 text-[var(--color-muted)]">{icon}</div>
      <span className="text-sm text-[var(--color-text)] w-32 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-[var(--color-surface2)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-semibold w-10 text-right" style={{ color }}>{score}</span>
    </div>
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

// ── main component ────────────────────────────────────────────────────────────
export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const [reEvaluating, setReEvaluating] = useState(false);
  // Shared across both "Download Certificate" buttons (Actions card + Certificate
  // tab) since they always operate on the same project's single certificate —
  // no need to key by id here, unlike a list view with multiple certificates.
  const [downloadingCert, setDownloadingCert] = useState(false);
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

const bugs: any[] = bugReport.bugs || [];
const categoryScores: Record<string, number> = report.categoryScores || {};
const fastDims: Record<string, any> = fastScores.scores || {};
const archDims: Record<string, any> = architectureReport.dimensions || {};

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

  const radarData = CATEGORIES.map(c => ({
  subject: c.label.replace(" ", "\n"),
  value: categoryScores[c.key] ?? 0,
  fullMark: 100,
}));

const tabs: { id: Tab; label: string }[] = [
  { id: "overview",    label: "Overview" },
  { id: "bugs",        label: `Bugs & fixes${bugs.length ? ` (${bugs.length})` : ""}` },
  { id: "deep",        label: "Deep analysis" },
  { id: "certificate", label: "Certificate" },
];



  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 ">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-9 pt-8 pb-16">
        <Link to="/projects" className="inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] mb-6 transition-colors">
          <ArrowLeft size={14} /> Back to projects
        </Link>

        {/* ── Header card ── */}
        <Card className="p-6 mb-5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[var(--color-muted)] uppercase tracking-widest">
                  PROEVA EVALUATION REPORT
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">{project.title}</h1>
              <p className="text-xs text-[var(--color-muted)] mt-0.5 capitalize">
                {report.domain || project.domain} · Evaluated {formatDate(project.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {(report.level || project.level) && (
                <span className="px-3 py-1 rounded-full text-sm font-medium border"
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
          </div>

          {/* stats row */}
          {completed && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 p-4 bg-[var(--color-bg)] rounded-xl">
              {[
                { label: "Overall Score", value: overallScore },
                { label: "Bugs Found",    value: bugs.length },
                { label: "Production",    value: report.productionReadiness ?? "—" },
                { label: "Est. Experience", value: report.estimatedExperience ?? "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-2xl font-bold text-[var(--color-text)] capitalize">{value}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* summary */}
          {completed && (
            <div className="flex items-start gap-4">
              <ScoreRing score={overallScore} />
              <div className="flex-1">
                <p className="text-sm text-[var(--color-muted)] leading-relaxed">{report.summary}</p>
                {report.headline && (
                  <p className="text-xs text-[var(--color-primary)] mt-2 font-medium">{report.headline}</p>
                )}
              </div>
            </div>
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

          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline mt-3">
              <GitBranch size={12} /> {project.githubUrl.replace("https://github.com/", "")}
            </a>
          )}
        </Card>

        {/* While evaluating, show skeleton placeholders instead of leaving
            the rest of the page empty (which just showed the near-black
            page background with a single small card, and reads like a
            broken "black screen"). */}
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

        {/* ── Tabs ── */}
        {completed && (
          <>
            {/* w-fit + 4 tabs is wider than a phone screen and had nothing
                stopping it from pushing the whole page into horizontal
                scroll — max-w-full + overflow-x-auto contains that scroll
                to just the tab strip instead. */}
            <div className="flex gap-1 p-1 bg-[var(--color-surface)] rounded-xl mb-5 max-w-full overflow-x-auto border border-[var(--color-border)]">
             {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 shrink-0 ${
                    tab === t.id
                      ? "bg-[var(--color-primary)] text-[var(--color-inverse)]"
                      : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}>
                  {t.id === "deep" && !isPremium && <Lock size={12} />}
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── OVERVIEW TAB ── */}
            {tab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* left col */}
                <div className="lg:col-span-2 space-y-5">
                  {/* Category scores */}
                  <Card className="p-6">
                    <h2 className="font-semibold text-[var(--color-text)] mb-5 flex items-center gap-2">
                      Category Scores
                    </h2>
                    <div className="space-y-4">
                      {CATEGORIES.map(c => {
                        const score = categoryScores[c.key] ?? 0;
                        const feedback = fastDims[c.key]?.rationale || archDims[c.key]?.finding;
                        return (
                          <div key={c.key}>
                            <BarRow label={c.label} score={score} icon={c.icon} />
                            {feedback && (
                              <p className="text-xs text-[var(--color-muted)] mt-1 ml-8">{feedback}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </Card>

                  {/* Strengths & Improvements */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-5">
                      <h3 className="text-sm font-medium text-[var(--color-success)] mb-3 flex items-center gap-1.5">
                        <Star size={14} /> Strengths
                      </h3>
                      {strengths.length === 0
                        ? <p className="text-xs text-[var(--color-muted)]">None detected</p>
                        : <ul className="space-y-2">
                            {strengths.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-1 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                      }
                    </Card>
                    <Card className="p-5">
                      <h3 className="text-sm font-medium text-[var(--color-warning)] mb-3 flex items-center gap-1.5">
                        <AlertTriangle size={14} /> Improvements Needed
                      </h3>
                      {improvementsList.length === 0
                        ? <p className="text-xs text-[var(--color-muted)]">None detected</p>
                        : <ul className="space-y-2">
                            {improvementsList.map((s: string, i: number) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-muted)]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] mt-1 flex-shrink-0" />
                                {s}
                              </li>
                            ))}
                          </ul>
                      }
                    </Card>
                  </div>

                  {/* Plagiarism */}
                  <Card className="p-5">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Plagiarism Risk</h3>
                    <PlagiarismBar
                      risk={report.plagiarismRisk ?? plagiarismReport.riskLevel ?? "low"}
                      similarityPercent={plagiarismReport.similarityPercent}
                    />
                    {plagiarismReport.verdict && (
                      <p className="text-xs text-[var(--color-muted)] mt-3">{plagiarismReport.verdict}</p>
                    )}
                  </Card>
                </div>

                {/* right col — charts */}
                <div className="space-y-5">
                  {/* Score distribution donut */}
                  <Card className="p-5">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Score Distribution</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={donutData} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          dataKey="value" paddingAngle={2}>
                          {donutData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: 8 }}
                          labelStyle={{ color: "var(--color-text)" }}
                          itemStyle={{ color: "var(--color-muted)" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-1 mt-1">
                      {donutData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name} {d.value}%
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Radar chart */}
                  <Card className="p-5">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Skill Radar</h3>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="var(--color-surface2)" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--color-muted)", fontSize: 10 }} />
                        <Radar name="Score" dataKey="value" stroke="var(--color-primary)" fill="var(--color-primary)" fillOpacity={0.25} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </Card>

                  {/* Quick info */}
                  <Card className="p-5">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Quick Info</h3>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Plagiarism risk</span>
                        <Badge variant={
                          (report.plagiarismRisk ?? plagiarismReport.riskLevel) === "low" ? "success"
                          : (report.plagiarismRisk ?? plagiarismReport.riskLevel) === "medium" ? "warning"
                          : "danger"
                        }>
                          {report.plagiarismRisk ?? plagiarismReport.riskLevel}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Experience est.</span>
                        <span className="text-[var(--color-text)] text-xs">{report.estimatedExperience}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-muted)]">Production readiness</span>
                        <span className="text-[var(--color-text)] text-xs capitalize">{report.productionReadiness}</span>
                      </div>
                      {report.projectedScore && (
                        <div className="flex justify-between">
                          <span className="text-[var(--color-muted)]">After fixes</span>
                          <span className="text-[var(--color-success)] font-medium">{report.projectedScore}/100</span>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Actions */}
                  <Card className="p-5">
                    <h3 className="text-sm font-medium text-[var(--color-text)] mb-3">Actions</h3>
                    <div className="space-y-2">
                      {project.certificate && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          size="sm"
                          loading={downloadingCert}
                          disabled={downloadingCert}
                          onClick={handleDownloadCertificate}
                        >
                          <Download size={14} /> Download Certificate
                        </Button>
                      )}
                      <Button variant="ghost" className="w-full" size="sm" onClick={handleReEvaluate} loading={reEvaluating} disabled={reEvaluating}>
                        <RefreshCw size={14} /> Re-evaluate
                      </Button>
                      <Button variant="ghost" className="w-full" size="sm"
                        onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/profile/${project.user?.username}`); toast.success("Profile link copied!"); }}>
                        <ExternalLink size={14} /> Copy Profile Link
                      </Button>
                    </div>
                  </Card>

                  {!isPremium && (
                    <Card className="p-4 flex items-center justify-center">
                      <AdSidebar />
                    </Card>
                  )}
                </div>
              </div>
            )}

            {/* ── BUGS TAB ── */}
            {tab === "bugs" && (
              <div className="space-y-4">
                {bugs.length === 0 ? (
                  <Card className="p-10 text-center">
                    <Bug size={32} className="text-[var(--color-success)] mx-auto mb-3" />
                    <p className="text-[var(--color-text)] font-medium">No bugs detected</p>
                    <p className="text-[var(--color-muted)] text-sm mt-1">Clean code — no critical issues found</p>
                  </Card>
                ) : (
                  <>
                    <p className="text-sm text-[var(--color-muted)]">{bugs.length} issues found in your codebase</p>
                    {bugs.map((bug: any) => (
                      <Card key={bug.id} className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg flex-shrink-0"
                            style={{ backgroundColor: `color-mix(in srgb, ${SEVERITY_COLOR[bug.severity] || "var(--color-muted)"} 10%, transparent)` }}>
                            <Bug size={14} style={{ color: SEVERITY_COLOR[bug.severity] || "var(--color-muted)" }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-medium text-[var(--color-text)]">{bug.title}</p>
                              <Badge variant={
                                bug.severity === "critical" || bug.severity === "high" ? "danger"
                                : bug.severity === "medium" ? "warning" : "muted"
                              }>
                                {bug.severity}
                              </Badge>
                              {bug.category && <Badge variant="muted">{bug.category}</Badge>}
                            </div>
                            <p className="text-xs text-[var(--color-muted)]">
                              {bug.file}{bug.line ? `:${bug.line}` : ""}{bug.functionName ? ` · ${bug.functionName}` : ""}
                            </p>
                            {bug.explanation && (
                              <p className="text-xs text-[var(--color-muted)] mt-2">{bug.explanation}</p>
                            )}
                            {bug.badCode && (
                              <pre className="text-xs bg-[var(--color-bg)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] rounded-lg p-3 mt-2 overflow-x-auto text-[var(--color-danger)]">
                                {bug.badCode}
                              </pre>
                            )}
                            {bug.fixCode && (
                              <pre className="text-xs bg-[var(--color-bg)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] rounded-lg p-3 mt-2 overflow-x-auto text-[var(--color-success)]">
                                {bug.fixCode}
                              </pre>
                            )}
                            {bug.fixExplanation && (
                              <p className="text-xs text-[var(--color-muted)] mt-2">{bug.fixExplanation}</p>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* ── DEEP ANALYSIS TAB ── */}
            {tab === "deep" && (
              <PremiumGate feature="deep-project-analysis" showBlurPreview>
              <div className="space-y-5">
                {/* Next steps */}
                {report.nextSteps?.length > 0 && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-[var(--color-text)] mb-4">Next Steps to Level Up</h2>
                    <div className="space-y-3">
                      {report.nextSteps.map((step: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-[var(--color-bg)] rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] text-[var(--color-primary)] flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-[var(--color-text)]">{step.action}</p>
                            <div className="flex gap-3 mt-1.5">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${step.impact === "high" ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]" : step.impact === "medium" ? "bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)]" : "bg-[var(--color-surface2)] text-[var(--color-muted)]"}`}>
                                {step.impact} impact
                              </span>
                              <span className="text-xs text-[var(--color-muted)]">effort: {step.effort}</span>
                              {step.pointsGained > 0 && (
                                <span className="text-xs text-[var(--color-primary)]">+{step.pointsGained} pts</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Suggested code changes */}
                {report.suggestedChanges?.length > 0 && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-[var(--color-text)] mb-4">Suggested Code Changes</h2>
                    <div className="space-y-4">
                      {report.suggestedChanges.map((sc: any, i: number) => (
                        <div key={i} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                          <p className="text-sm text-[var(--color-text)] mb-1">
                            {sc.file}{sc.line ? `:${sc.line}` : ""} — {sc.issue}
                          </p>
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
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Improvements (full advisor list) */}
                {improvementsReport.improvements?.length > 0 && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-[var(--color-text)] mb-4">Improvement Recommendations</h2>
                    <div className="space-y-4">
                      {improvementsReport.improvements.map((imp: any) => (
                        <div key={imp.id} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium text-[var(--color-text)]">{imp.title}</p>
                            <Badge variant="muted">{imp.category}</Badge>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${imp.impact === "high" ? "bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)]" : imp.impact === "medium" ? "bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] text-[var(--color-warning)]" : "bg-[var(--color-surface2)] text-[var(--color-muted)]"}`}>
                              {imp.impact} impact
                            </span>
                            <span className="text-xs text-[var(--color-muted)]">effort: {imp.effort}</span>
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{imp.file}</p>
                          {imp.description && <p className="text-xs text-[var(--color-muted)] mt-1">{imp.description}</p>}
                          {imp.whyItMatters && <p className="text-xs text-[var(--color-primary)] mt-1">{imp.whyItMatters}</p>}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Recruiter summary */}
                {recruiterSummary.length > 0 && (
                  <Card className="p-6">
                    <h2 className="font-semibold text-[var(--color-text)] mb-4">Recruiter Summary</h2>
                    <ul className="space-y-2">
                      {recruiterSummary.map((point: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] mt-2 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* All category details */}
                <Card className="p-6">
                  <h2 className="font-semibold text-[var(--color-text)] mb-4">Full Category Breakdown</h2>
                  <div className="space-y-5">
                    {CATEGORIES.map(c => {
                      const score = categoryScores[c.key] ?? 0;
                      const color = getScoreColor(score);
                      const dim = archDims[c.key];
                      const fast = fastDims[c.key];
                      return (
                        <div key={c.key} className="border-b border-[var(--color-border)] pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-[var(--color-text)]">
                              <span style={{ color }}>{c.icon}</span>
                              <span className="text-sm font-medium">{c.label}</span>
                            </div>
                            <span className="text-lg font-bold" style={{ color }}>{score}</span>
                          </div>
                          <div className="h-1.5 bg-[var(--color-surface2)] rounded-full mb-2">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${score}%` }}
                              transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: color }} />
                          </div>
                          {(dim?.finding || fast?.rationale) && (
                            <p className="text-xs text-[var(--color-muted)]">{dim?.finding || fast?.rationale}</p>
                          )}
                          {dim?.recommendation && (
                            <p className="text-xs text-[var(--color-primary)] mt-1 flex items-start gap-1.5">
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
              <Card className="p-8 text-center">
                {project.certificate ? (
                  <>
                    <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Download size={32} className="text-[var(--color-primary)]" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text)] mb-2">Certificate Ready</h2>
                    <p className="text-[var(--color-muted)] text-sm mb-2">Verification ID: <span className="text-[var(--color-primary)] font-mono">{project.certificate.verificationId}</span></p>
                    {report.headline && (
                      <p className="text-sm text-[var(--color-text)] bg-[var(--color-surface)] rounded-xl px-4 py-3 mb-6 max-w-lg mx-auto">{report.headline}</p>
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