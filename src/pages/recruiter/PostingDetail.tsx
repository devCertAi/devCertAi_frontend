import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Trophy,
  ChevronRight,
  Bell,
  Wrench,
  Zap,
  Eye,
  Lock,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { Progress } from "@/components/ui/Progress";
import { PageWrapper } from "@/components/layout/PageWrapper";
import api from "@/services/api";
import { Application, JobPosting } from "@/types";
import { formatDate } from "@/lib/utils";

const STAGE_LABELS: Record<string, string> = {
  applied: "Applied",
  screened: "Screened",
  assignment_sent: "Assignment Sent",
  assignment_submitted: "Submitted",
  project_evaluated: "Project Reviewed",
  exam_sent: "Phase 1 Sent",
  exam_completed: "Phase 1 Done",
  exam_phase2_sent: "Phase 2 Sent",
  exam_phase2_completed: "Phase 2 Done",
  ranked: "Ranked",
  selected: "Selected / Hired",
  rejected: "Rejected",
};

// Stages where recruiter must act (manual mode)
const MANUAL_TRIGGER_STAGES = [
  "screened",
  "project_evaluated",
  "exam_completed",
  "exam_phase2_completed",
];
// Stages where a reminder can be sent to the student
const REMINDABLE_STAGES = ["assignment_sent", "exam_sent", "exam_phase2_sent"];

export default function PostingDetail() {
  const { id } = useParams<{ id: string }>();
  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [stageFilter, setStageFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [ranking, setRanking] = useState(false);

  const loadPosting = useCallback(() => {
    api.get(`/recruiter/postings/${id}`).then(({ data }) => {
      setPosting(data.data.posting);
      setStageCounts(data.data.stageCounts);
    });
    api
      .get(`/recruiter/postings/${id}/stats`)
      .then(({ data }) => setStats(data.data));
  }, [id]);

  const loadApplications = useCallback(
    (page = 1) => {
      setLoading(true);
      api
        .get(`/recruiter/postings/${id}/applications`, {
          params: {
            page,
            limit: 25,
            stage: stageFilter || undefined,
            status: statusFilter || undefined,
            sortBy,
            sortDir: "desc",
          },
        })
        .then(({ data }) => {
          setApplications(data.data.applications);
          setPagination(data.data.pagination);
        })
        .finally(() => setLoading(false));
    },
    [id, stageFilter, statusFilter, sortBy],
  );

  useEffect(() => {
    loadPosting();
  }, [loadPosting]);
  useEffect(() => {
    loadApplications(1);
  }, [loadApplications]);

  const triggerRanking = async () => {
    setRanking(true);
    try {
      await api.post(`/recruiter/postings/${id}/rank`);
      toast.success("Ranking triggered — refresh in a moment");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to trigger ranking");
    } finally {
      setRanking(false);
    }
  };

  const copyLink = () => {
    if (!posting) return;
    navigator.clipboard.writeText(
      `${window.location.origin}/apply/${(posting as any).applyLinkSlug}`,
    );
    toast.success("Apply link copied");
  };

  if (!posting) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="flex justify-center py-24">
          <Spinner className="w-8 h-8 text-[var(--color-primary)]" />
        </div>
      </PageWrapper>
    );
  }

  const jp = posting as any;
  const funnelData = (stats?.funnel || []).map((f: any) => ({
    name: STAGE_LABELS[f.stage] || f.stage,
    count: f.count,
  }));
  const pendingManualCount = applications.filter(
    (a) =>
      MANUAL_TRIGGER_STAGES.includes(a.stage) && a.status === "in_progress",
  ).length;

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <Link
          to="/recruiter/postings"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--color-muted)] hover:text-[var(--color-text)] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> All postings
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                {posting.title}
              </h1>
              <Badge
                variant={
                  posting.status === "active"
                    ? "success"
                    : posting.status === "closed"
                      ? "muted"
                      : "warning"
                }
              >
                {posting.status}
              </Badge>
              {jp.manualMode && (
                <Badge variant="warning" className="flex items-center gap-1">
                  <Wrench size={10} /> Manual
                </Badge>
              )}
            </div>
            <p className="text-[var(--color-muted)] text-sm">
              {posting.companyName} · {jp.openings} opening
              {jp.openings > 1 ? "s" : ""}
              {jp.examDomain && ` · Exam: ${jp.examDomain}`}
              {jp.examPhase2 && " (Phase 1 + 2)"}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {posting.status === "active" && (
              <Button variant="outline" onClick={copyLink}>
                <Copy size={14} /> Apply Link
              </Button>
            )}
            <Link to={`/recruiter/postings/${id}/ranked`}>
              <Button variant="outline">
                <Trophy size={14} /> Ranked List
              </Button>
            </Link>
            <Button onClick={triggerRanking} loading={ranking}>
              <RefreshCw size={14} /> Generate Rankings
            </Button>
          </div>
        </div>

        {/* Manual mode: pending actions banner */}
        {jp.manualMode && pendingManualCount > 0 && (
          <div
            className="flex items-start gap-3 p-4 mb-4 rounded-xl border"
            style={{
              background:
                "color-mix(in srgb, var(--color-warning) 8%, transparent)",
              borderColor:
                "color-mix(in srgb, var(--color-warning) 25%, transparent)",
            }}
          >
            <Clock
              size={16}
              style={{
                color: "var(--color-warning)",
                flexShrink: 0,
                marginTop: 2,
              }}
            />
            <div>
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-warning)" }}
              >
                {pendingManualCount} application
                {pendingManualCount > 1 ? "s" : ""} awaiting your action
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-muted)" }}
              >
                Click a candidate row to advance or reject them manually.
              </p>
            </div>
          </div>
        )}

        {/* Pipeline config summary */}
        <Card className="p-4 mb-4 flex flex-wrap gap-4">
          <PipelinePill
            icon={<Zap size={12} />}
            label="Mode"
            value={jp.manualMode ? "Manual Review" : "Automatic"}
          />
          {jp.assignmentEnabled && (
            <PipelinePill
              icon={<FileText size={12} />}
              label="Assignment"
              value="Enabled"
              color="success"
            />
          )}
          {jp.examEnabled && (
            <PipelinePill
              icon={<CheckCircle2 size={12} />}
              label="Exam"
              value={
                jp.examPhase1 && jp.examPhase2
                  ? "Phase 1 + Phase 2"
                  : jp.examPhase1
                    ? "Phase 1 (MCQ)"
                    : "Disabled"
              }
              color="success"
            />
          )}
          {jp.examDomain && (
            <PipelinePill
              icon={<Eye size={12} />}
              label="Domain"
              value={jp.examDomain}
            />
          )}
        </Card>

        {/* Stage pipeline overview */}
        <Card className="p-5 mb-6">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-4">
            Pipeline Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 mb-4">
            {Object.entries(STAGE_LABELS).map(([stage, label]) => {
              const count = stageCounts[stage] || 0;
              const isManualPending =
                jp.manualMode &&
                MANUAL_TRIGGER_STAGES.includes(stage) &&
                count > 0;
              return (
                <button
                  key={stage}
                  onClick={() =>
                    setStageFilter(stageFilter === stage ? "" : stage)
                  }
                  className={`p-2.5 rounded-xl border text-left transition-colors ${stageFilter === stage ? "border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)]" : "border-[var(--color-border)] hover:border-[var(--color-border)]"}`}
                >
                  <div
                    className={`text-base font-bold ${isManualPending ? "text-[var(--color-warning)]" : "text-[var(--color-text)]"}`}
                  >
                    {count}
                  </div>
                  <div className="text-[9px] text-[var(--color-muted)] leading-tight mt-0.5">
                    {label}
                  </div>
                  {isManualPending && (
                    <div className="text-[9px] text-[var(--color-warning)] mt-0.5">
                      ⏳ action needed
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {funnelData.length > 0 && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ left: 16 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--color-grid-line)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    stroke="var(--color-muted)"
                    fontSize={11}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    stroke="var(--color-muted)"
                    fontSize={10}
                    width={110}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "var(--color-surface)",
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--color-primary)"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-sm">
            <div>
              <span className="text-[var(--color-muted)]">Avg rule:</span>{" "}
              <strong>{Math.round(stats?.avgScores?.ruleScore || 0)}</strong>
            </div>
            <div>
              <span className="text-[var(--color-muted)]">Avg AI:</span>{" "}
              <strong>{Math.round(stats?.avgScores?.aiMatchScore || 0)}</strong>
            </div>
            <div>
              <span className="text-[var(--color-muted)]">Avg project:</span>{" "}
              <strong>{Math.round(stats?.avgScores?.projectScore || 0)}</strong>
            </div>
            <div>
              <span className="text-[var(--color-muted)]">Avg exam:</span>{" "}
              <strong>{Math.round(stats?.avgScores?.examScore || 0)}</strong>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="!w-auto"
          >
            <option value="">All stages</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="!w-auto"
          >
            <option value="">All statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="selected">Selected</option>
            <option value="rejected">Rejected</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="!w-auto"
          >
            <option value="createdAt">Sort: Newest</option>
            <option value="finalScore">Sort: Final Score</option>
            <option value="rank">Sort: Rank</option>
            <option value="ruleScore">Sort: Rule Score</option>
          </Select>
          {jp.manualMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setStageFilter(MANUAL_TRIGGER_STAGES[0])}
              className="text-[var(--color-warning)] border-[color-mix(in_srgb,var(--color-warning)_30%,transparent)]"
            >
              <Clock size={13} /> Pending Action ({pendingManualCount})
            </Button>
          )}
          <span className="text-xs text-[var(--color-muted)] ml-auto">
            {pagination.total} candidates
          </span>
        </div>

        {/* Candidates table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-[var(--color-muted)] text-sm">
              No candidates in this view.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)] text-left">
                    <th className="px-4 py-3 font-medium">Candidate</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Rule</th>
                    <th className="px-4 py-3 font-medium">AI</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Exam</th>
                    <th className="px-4 py-3 font-medium">Final</th>
                    {jp.manualMode && (
                      <th className="px-4 py-3 font-medium">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => {
                    const needsAction =
                      jp.manualMode &&
                      MANUAL_TRIGGER_STAGES.includes(app.stage) &&
                      app.status === "in_progress";
                    return (
                      <tr
                        key={app.id}
                        onClick={() => setSelectedAppId(app.id)}
                        className={`border-b border-[var(--color-border)] hover:bg-[var(--color-surface2)] cursor-pointer transition-colors ${needsAction ? "bg-[color-mix(in_srgb,var(--color-warning)_3%,transparent)]" : ""}`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-[var(--color-text)]">
                            {(app as any).user?.name}
                          </div>
                          <div className="text-xs text-[var(--color-muted)]">
                            {(app as any).user?.email}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={needsAction ? "warning" : "muted"}>
                            {/* app.stage stays "screened" even when the AI-match
                                threshold rejected the candidate (stage tracks how
                                far the pipeline got, not the outcome) — but showing
                                "Screened" next to a red "Rejected" badge reads as a
                                contradiction, so relabel for that specific case. */}
                            {app.stage === "screened" && app.status === "rejected"
                              ? "Screening failed"
                              : STAGE_LABELS[app.stage] || app.stage}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              app.status === "selected"
                                ? "success"
                                : app.status === "rejected"
                                  ? "danger"
                                  : "info"
                            }
                          >
                            {app.status === "in_progress"
                              ? "Active"
                              : app.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text)]">
                          {(app as any).ruleScore ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text)]">
                          {(app as any).aiMatchScore ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text)]">
                          {(app as any).projectScore != null
                            ? Math.round((app as any).projectScore)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-[var(--color-text)]">
                          {(app as any).examScore != null
                            ? Math.round((app as any).examScore)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[var(--color-text)]">
                          {(app as any).finalScore != null
                            ? Math.round((app as any).finalScore)
                            : "—"}
                        </td>
                        {jp.manualMode && (
                          <td className="px-4 py-3">
                            {needsAction && (
                              <span className="text-xs text-[var(--color-warning)] font-medium flex items-center gap-1">
                                <ChevronRight size={12} /> Review
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 py-4 border-t border-[var(--color-border)]">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (p) => (
                  <button
                    key={p}
                    onClick={() => loadApplications(p)}
                    className={`w-8 h-8 rounded-lg text-xs transition-colors ${p === pagination.page ? "bg-[var(--color-primary)] text-[var(--color-inverse)]" : "text-[var(--color-muted)] hover:bg-[var(--color-surface2)]"}`}
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          )}
        </Card>
      </div>

      {selectedAppId && (
        <CandidateDrawer
          applicationId={selectedAppId}
          postingId={id!}
          isManualMode={jp.manualMode}
          postingExamPhase2={jp.examPhase2}
          onClose={() => setSelectedAppId(null)}
          onRefresh={() => {
            loadApplications(pagination.page);
            loadPosting();
          }}
        />
      )}
    </PageWrapper>
  );
}

// ─── Pipeline config pill ─────────────────────────────────────────────────────
function PipelinePill({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: "success" | "default";
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span
        className={
          color === "success"
            ? "text-[var(--color-success)]"
            : "text-[var(--color-muted)]"
        }
      >
        {icon}
      </span>
      <span className="text-[var(--color-muted)]">{label}:</span>
      <span
        className={`font-medium ${color === "success" ? "text-[var(--color-success)]" : "text-[var(--color-text)]"}`}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Candidate drawer ─────────────────────────────────────────────────────────
function CandidateDrawer({
  applicationId,
  postingId,
  isManualMode,
  postingExamPhase2,
  onClose,
  onRefresh,
}: {
  applicationId: string;
  postingId: string;
  isManualMode: boolean;
  postingExamPhase2: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [actioning, setActioning] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [advanceNote, setAdvanceNote] = useState("");
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);

  const reload = () => {
    api
      .get(`/recruiter/applications/${applicationId}`)
      .then(({ data }) => setDetail(data.data));
  };

  useEffect(() => {
    Promise.all([
      api.get(`/recruiter/applications/${applicationId}`),
      api
        .get(`/recruiter/applications/${applicationId}/messages`)
        .catch(() => ({ data: { data: { messages: [] } } })),
    ])
      .then(([appRes, msgRes]) => {
        setDetail(appRes.data.data);
        setMessages(msgRes.data.data.messages || []);
      })
      .catch((err: any) => {
        toast.error(err?.response?.data?.message || 'Failed to load application details');
      })
      .finally(() => setLoading(false));
  }, [applicationId]);

  const action = async (key: string, fn: () => Promise<void>) => {
    setActioning(key);
    try {
      await fn();
      reload();
      onRefresh?.();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed: ${key}`);
    } finally {
      setActioning(null);
    }
  };

  const handleHire = () =>
    action("hire", async () => {
      await api.patch(`/recruiter/applications/${applicationId}/hire`);
      toast.success("🎉 Candidate marked as hired!");
    });

  const handleReject = () =>
    action("reject", async () => {
      await api.patch(`/recruiter/applications/${applicationId}/reject`, {
        reason: rejectNote || undefined,
      });
      toast.success("Candidate rejected");
      setShowRejectForm(false);
    });

  const handleAdvance = () =>
    action("advance", async () => {
      await api.post(`/recruiter/applications/${applicationId}/advance`, {
        note: advanceNote || undefined,
      });
      toast.success("Stage advanced!");
      setShowAdvanceForm(false);
    });

  const handleReminder = (stage: string) =>
    action("reminder", async () => {
      await api.post(`/recruiter/applications/${applicationId}/send-reminder`);
      toast.success("Reminder sent to candidate");
    });

  const sendMessage = async () => {
    if (!msgBody.trim()) return;
    setSending(true);
    try {
      await api.post(`/recruiter/applications/${applicationId}/messages`, {
        body: msgBody.trim(),
      });
      toast.success("Message sent");
      setMsgBody("");
      const r = await api.get(`/recruiter/applications/${applicationId}/messages`);
      setMessages(r.data.data.messages || []);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to send");
    } finally {
      setSending(false);
    }
  };

  const app = detail?.application;

  const needsManualAction =
    isManualMode &&
    app &&
    MANUAL_TRIGGER_STAGES.includes(app.stage) &&
    app.status === "in_progress";
  const canSendReminder =
    app &&
    REMINDABLE_STAGES.includes(app.stage) &&
    app.status === "in_progress";

  return (
    <Modal
      open
      onClose={onClose}
      title={app?.user?.name || "Candidate"}
      size="xl"
    >
      {loading || !app ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-6 h-6 text-[var(--color-primary)]" />
        </div>
      ) : (
        <div className="space-y-5 max-h-[72vh] overflow-y-auto pr-1">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[var(--color-text)] font-medium">
                {app.user.email}
              </p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge
                  variant={
                    app.status === "selected"
                      ? "success"
                      : app.status === "rejected"
                        ? "danger"
                        : "info"
                  }
                >
                  {STAGE_LABELS[app.stage] || app.stage} · {app.status}
                </Badge>
                {app.rank != null && (
                  <Badge variant="default">Rank #{app.rank}</Badge>
                )}
                {isManualMode && needsManualAction && (
                  <Badge variant="warning" className="flex items-center gap-1">
                    <Clock size={10} /> Awaiting Action
                  </Badge>
                )}
              </div>
            </div>
            {app.resumeUrl && (
              <a href={app.resumeUrl} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline">
                  <ExternalLink size={14} /> Resume
                </Button>
              </a>
            )}
          </div>

          {/* ── Pipeline stage history — which stages have successfully executed ── */}
          {detail.stageEvents?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                Pipeline History
              </h4>
              <div className="space-y-1.5">
                {detail.stageEvents.map((ev: any, idx: number) => (
                  <div
                    key={ev.id || idx}
                    className="flex items-center gap-2 text-xs"
                  >
                    <CheckCircle2
                      size={13}
                      style={{ color: "var(--color-success)" }}
                      className="shrink-0"
                    />
                    <span className="text-[var(--color-text)] font-medium">
                      {STAGE_LABELS[ev.stage] || ev.stage}
                    </span>
                    <span className="text-[var(--color-muted)]">
                      executed successfully
                    </span>
                    <span className="ml-auto text-[var(--color-muted)] shrink-0">
                      {formatDate(ev.enteredAt)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions panel ── */}
          {app.status !== "selected" && app.status !== "rejected" && app.stage !== "ranked" && (
            <div
              className="p-4 rounded-xl space-y-3"
              style={{
                background: "var(--color-surface2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <p className="text-xs font-semibold text-[var(--color-text)]">
                Pipeline Actions
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Hire */}
                <Button
                  size="sm"
                  loading={actioning === "hire"}
                  onClick={handleHire}
                  style={{ background: "var(--color-success)", color: "white" }}
                >
                  <CheckCircle2 size={14} /> Hire
                </Button>

                {/* Manual advance (only in manual mode, when at a trigger stage) */}
                {isManualMode && needsManualAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAdvanceForm(!showAdvanceForm)}
                    className="border-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] text-[var(--color-primary)]"
                  >
                    <ChevronRight size={14} /> Advance Stage
                  </Button>
                )}

                {/* Send reminder */}
                {canSendReminder && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actioning === "reminder"}
                    onClick={() => handleReminder(app.stage)}
                  >
                    <Bell size={14} /> Send Reminder
                  </Button>
                )}

                {/* Send assignment */}
                {![
                  "assignment_sent",
                  "assignment_submitted",
                  "project_evaluated",
                  "exam_sent",
                  "exam_completed",
                  "exam_phase2_sent",
                  "exam_phase2_completed",
                  "ranked",
                ].includes(app.stage) && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actioning === "assignment"}
                    onClick={() =>
                      action("assignment", async () => {
                        await api.post(
                          `/recruiter/applications/${applicationId}/send-assignment`,
                        );
                        toast.success("Assignment sent");
                      })
                    }
                  >
                    <FileText size={14} /> Send Assignment
                  </Button>
                )}

                {/* Send exam */}
                {["project_evaluated"].includes(app.stage) && (
                  <Button
                    size="sm"
                    variant="outline"
                    loading={actioning === "test"}
                    onClick={() =>
                      action("test", async () => {
                        await api.post(
                          `/recruiter/applications/${applicationId}/send-test`,
                        );
                        toast.success("Exam sent");
                      })
                    }
                  >
                    <Send size={14} /> Send Exam
                  </Button>
                )}

                {/* Reject */}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  style={{ color: "var(--color-danger)" }}
                >
                  <XCircle size={14} /> Reject
                </Button>
              </div>

              {/* Manual advance form */}
              {showAdvanceForm && (
                <div className="mt-2 space-y-2 p-3 rounded-xl border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_4%,transparent)]">
                  <p className="text-xs text-[var(--color-muted)]">
                    Advancing from{" "}
                    <strong>{STAGE_LABELS[app.stage] || app.stage}</strong> to
                    the next stage.
                  </p>
                  <textarea
                    value={advanceNote}
                    onChange={(e) => setAdvanceNote(e.target.value)}
                    placeholder="Optional note (internal, not sent to candidate)"
                    rows={2}
                    className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={actioning === "advance"}
                      onClick={handleAdvance}
                    >
                      Confirm Advance
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAdvanceForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {showRejectForm && (
                <div className="space-y-2 p-3 rounded-xl border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-danger)_4%,transparent)]">
                  <textarea
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Optional rejection reason (shown to candidate as feedback)"
                    rows={2}
                    className="w-full text-xs rounded-lg px-3 py-2 resize-none focus:outline-none"
                    style={{
                      background: "var(--color-bg)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text)",
                    }}
                  />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      loading={actioning === "reject"}
                      onClick={handleReject}
                      style={{
                        background: "var(--color-danger)",
                        color: "white",
                      }}
                    >
                      Confirm Rejection
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRejectForm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {app.status !== "selected" && app.status !== "rejected" && app.stage === "ranked" && (
            <div
              className="p-4 rounded-xl flex items-start gap-2"
              style={{
                background: "var(--color-surface2)",
                border: "1px solid var(--color-border)",
              }}
            >
              <Trophy size={14} className="mt-0.5 shrink-0" style={{ color: "var(--color-primary)" }} />
              <p className="text-xs" style={{ color: "var(--color-muted)" }}>
                This candidate is ranked and awaiting a decision. Selection and rejection
                emails are sent together from the{" "}
                <Link to={`/recruiter/postings/${postingId}/ranked`} className="underline" style={{ color: "var(--color-primary)" }}>
                  Ranked List
                </Link>{" "}
                page — review everyone, check who to select, then click Send Decisions.
              </p>
            </div>
          )}

          {/* Status banners */}
          {app.status === "selected" && (
            <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-success)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] flex items-center gap-2">
              <CheckCircle2
                size={16}
                style={{ color: "var(--color-success)" }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-success)" }}
              >
                Hired ✓
              </span>
            </div>
          )}
          {app.status === "rejected" && (
            <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-danger)_8%,transparent)] border border-[color-mix(in_srgb,var(--color-danger)_20%,transparent)]">
              <div className="flex items-center gap-2">
                <XCircle size={16} style={{ color: "var(--color-danger)" }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-danger)" }}
                >
                  Rejected
                </span>
              </div>
              {app.rejectionReason && (
                <p className="text-xs text-[var(--color-muted)] mt-1">
                  {app.rejectionReason}
                </p>
              )}
            </div>
          )}

          {/* Score breakdown */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
              Score Breakdown
            </h4>
            <div className="space-y-2">
              {[
                ["Rule-based screening", app.ruleScore],
                ["AI resume match", app.aiMatchScore],
                ["Project evaluation", app.projectScore],
                ["Exam (Phase 1 + 2)", app.examScore],
                ["Final score", app.finalScore],
              ].map(([label, score]) => (
                <div key={label as string}>
                  <div className="flex justify-between text-xs text-[var(--color-muted)] mb-1">
                    <span>{label}</span>
                    <span>
                      {score != null ? Math.round(score as number) : "—"}
                    </span>
                  </div>
                  <Progress value={score != null ? (score as number) : 0} />
                </div>
              ))}
            </div>
          </div>

          {/* Missing skills */}
          {app.missingSkills?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-1">
                Missing Skills
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {app.missingSkills.map((s: string) => (
                  <Badge key={s} variant="warning">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Assignment project */}
          {detail.project && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-sm font-semibold text-[var(--color-text)]">
                  Assignment Project
                </h4>
                <span title="Eval criteria private">
                  <Lock size={12} className="text-[var(--color-danger)]" />
                </span>
              </div>
              <Card className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-text)]">
                    {detail.project.title}
                  </span>
                  <Badge
                    variant={
                      detail.project.status === "evaluated"
                        ? "success"
                        : "muted"
                    }
                  >
                    {detail.project.status}
                  </Badge>
                </div>
                {detail.project.score != null && (
                  <p className="text-xs text-[var(--color-muted)] mb-1">
                    Score: {detail.project.score}/100 ({detail.project.level})
                  </p>
                )}
                {detail.project.evaluationReport?.summary && (
                  <p className="text-xs text-[var(--color-muted)]">
                    {detail.project.evaluationReport.summary}
                  </p>
                )}
                {detail.project.githubUrl && (
                  <a
                    href={detail.project.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--color-primary)] inline-flex items-center gap-1 mt-2"
                  >
                    <ExternalLink size={12} /> View Repository
                  </a>
                )}
              </Card>
            </div>
          )}

          {/* Exam Phase 1 */}
          {detail.examAttempt && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                Exam Phase 1
              </h4>
              <Card className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-text)]">
                    Status: {detail.examAttempt.status}
                  </span>
                  {detail.examAttempt.totalScore != null && (
                    <Badge variant="info">
                      {detail.examAttempt.totalScore}/100 ·{" "}
                      {detail.examAttempt.level}
                    </Badge>
                  )}
                </div>
                {detail.examAttempt.evaluationReport?.mcqScore != null && (
                  <p className="text-xs text-[var(--color-muted)]">
                    MCQ: {detail.examAttempt.evaluationReport.mcqScore}/100
                  </p>
                )}
              </Card>
            </div>
          )}

          {/* Exam Phase 2 */}
          {detail.phase2ExamAttempt && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
                Exam Phase 2 (Project-based)
              </h4>
              <Card className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-[var(--color-text)]">
                    Status: {detail.phase2ExamAttempt.status}
                  </span>
                  {detail.phase2ExamAttempt.totalScore != null && (
                    <Badge variant="info">
                      {detail.phase2ExamAttempt.totalScore}/100
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-[var(--color-muted)]">
                  AI-generated questions from the candidate's own submitted
                  project.
                </p>
              </Card>
            </div>
          )}

          {/* Selection narrative */}
          {app.status === "selected" && app.selectionNarrative && (
            <div className="p-3 rounded-xl bg-[color-mix(in_srgb,var(--color-success)_5%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_15%,transparent)]">
              <h4 className="text-sm font-semibold text-[var(--color-success)] mb-1">
                Selection Narrative
              </h4>
              <p className="text-xs text-[var(--color-muted)]">
                {app.selectionNarrative}
              </p>
            </div>
          )}

          <p className="text-[10px] text-[var(--color-muted)]">
            Applied {formatDate(app.createdAt)} · Updated{" "}
            {formatDate(app.updatedAt)}
          </p>

          {/* Messaging */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--color-text)] mb-2">
              Message Candidate
            </h4>
            {messages.length > 0 && (
              <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                {messages.map((m: any) => (
                  <div
                    key={m.id}
                    className="rounded-xl p-3 text-xs"
                    style={{
                      background: "var(--color-surface2)",
                      color: "var(--color-text)",
                    }}
                  >
                    <p>{m.body}</p>
                    <span style={{ color: "var(--color-muted)" }}>
                      {formatDate(m.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendMessage()
                }
                placeholder="Write a message…"
                className="flex-1 rounded-xl px-3 py-2 text-sm"
                style={{
                  background: "var(--color-surface2)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  outline: "none",
                }}
              />
              <Button
                size="sm"
                onClick={sendMessage}
                loading={sending}
                disabled={!msgBody.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
