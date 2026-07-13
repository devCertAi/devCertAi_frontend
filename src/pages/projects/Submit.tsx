import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { GitBranch, Globe, Upload, CheckCircle, Loader, Gauge, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AdBanner } from "@/components/ads/AdBanner";
import { InterstitialAdModal } from "@/components/ads/InterstitialAdModal";
import { RewardedAdButton } from "@/components/ads/RewardedAdModal";
import { usePremium } from "@/components/premium/PremiumGate";
import { DOMAINS } from "@/lib/constants";
import { projectSubmitSchema, ProjectSubmitInput } from "@/lib/validators";
import api from "@/services/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type SubmitMethod = "github" | "liveurl" | "zip";
type SubmitStep = 1 | 2 | 3;

interface SizeEstimate {
  tier: "small" | "medium" | "large";
  label: string;
  description: string;
  creditsCost: number;
  estimatedTokens: number;
  canAfford: boolean;
  unlimited: boolean;
}

const TIER_BADGE_VARIANT: Record<SizeEstimate["tier"], "success" | "warning" | "danger"> = {
  small: "success",
  medium: "warning",
  large: "danger",
};

export default function Submit() {
  const [step, setStep] = useState<SubmitStep>(1);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [method, setMethod] = useState<SubmitMethod>("github");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [githubValid, setGithubValid] = useState<boolean | null>(null);
  // Add these states at top of component
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
const projectIdRef = useRef("");
const { isPremium } = usePremium();
const [showAdGate, setShowAdGate] = useState(false);
const [pendingSubmitData, setPendingSubmitData] = useState<ProjectSubmitInput | null>(null);

 
const [sizeEstimate, setSizeEstimate] = useState<SizeEstimate | null>(null);
const [estimating, setEstimating] = useState(false);
const estimateRequestId = useRef(0);

const fetchSizeEstimate = async (source: { githubUrl?: string; liveUrl?: string; zipFile?: File }) => {
  const requestId = ++estimateRequestId.current;
  setEstimating(true);
  try {
    const formData = new FormData();
    if (source.githubUrl) formData.append("githubUrl", source.githubUrl);
    else if (source.liveUrl) formData.append("liveUrl", source.liveUrl);
    else if (source.zipFile) formData.append("zipFile", source.zipFile);
    else return;

    const { data } = await api.post("/projects/estimate-size", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    if (requestId === estimateRequestId.current) setSizeEstimate(data.data);
  } catch {
    if (requestId === estimateRequestId.current) setSizeEstimate(null);
  } finally {
    if (requestId === estimateRequestId.current) setEstimating(false);
  }
};

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ProjectSubmitInput>({
    resolver: zodResolver(projectSubmitSchema),
    // ✅ remove defaultValues entirely, or just:
    defaultValues: { title: "", description: "", githubUrl: "", liveUrl: "" },
  });

  const githubUrl = watch("githubUrl");

  // Zip files are already on the client, so estimate as soon as one is
  // picked/dropped — no need to wait for blur.
  useEffect(() => {
    if (method === "zip" && zipFile) fetchSizeEstimate({ zipFile });
    if (method === "zip" && !zipFile) setSizeEstimate(null);
  }, [zipFile, method]);

  // Switching methods invalidates whatever estimate we had.
  const switchMethod = (m: SubmitMethod) => {
    setMethod(m);
    setSizeEstimate(null);
  };

  // Guards out-of-order responses: if the user pastes a new link before an
  // in-flight validation for the OLD link resolves, the old link's response
  // (whichever one happens to arrive last) must not overwrite the state.
  const githubValidateRequestId = useRef(0);

  const runGithubValidation = async (url: string) => {
    const requestId = ++githubValidateRequestId.current;
    try {
      // FIX: this was POSTing { githubUrl } to a route that's only
      // registered as GET and reads `req.query.url` — every call 404'd,
      // so githubValid was always forced to false and the URL always
      // showed as "not found or not public" even for a perfectly valid repo.
      const { data } = await api.get("/projects/validate-github", {
        params: { url },
      });
      if (requestId !== githubValidateRequestId.current) return; // superseded
      const validation = data.data ?? data;
      const isValid = !!validation.valid && validation.isPublic !== false;
      setGithubValid(isValid);
      if (isValid) fetchSizeEstimate({ githubUrl: url });
      else setSizeEstimate(null);
    } catch {
      if (requestId !== githubValidateRequestId.current) return;
      setGithubValid(false);
      setSizeEstimate(null);
    }
  };
 
  useEffect(() => {
    if (method !== "github") return;
    const url = githubUrl?.trim();
    setGithubValid(null);
    setSizeEstimate(null);
    githubValidateRequestId.current++; // invalidate any in-flight check for the previous value
    if (!url) return;
    const timer = setTimeout(() => runGithubValidation(url), 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [githubUrl, method]);
 
  const validateGithub = () => {
    const url = githubUrl?.trim();
    if (url) runGithubValidation(url);
  };

  const onSubmit = async (data: ProjectSubmitInput) => {
    if (!selectedDomain) {
      toast.error("Please select a domain");
      return;
    }
    if (method === "github" && !data.githubUrl)
      return toast.error("Please enter a GitHub URL");
    if (method === "liveurl" && !data.liveUrl)
      return toast.error("Please enter a live URL");
    if (method === "zip" && !zipFile)
      return toast.error("Please upload a ZIP file");
 
    if (isPremium) {
      return doSubmit(data);
    }
    setPendingSubmitData(data);
    setShowAdGate(true);
  };

  const doSubmit = async (data: ProjectSubmitInput) => {
    console.log("onSubmit fired", data, selectedDomain, method);
    setLoading(true);
    try {
      const domain =
        DOMAINS.find((d) => d.id === selectedDomain)?.name ?? selectedDomain;

      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description || "");
      formData.append("domain", domain);
      formData.append("method", method);

      if (method === "github") formData.append("githubUrl", data.githubUrl!);
      if (method === "liveurl") formData.append("liveUrl", data.liveUrl!);
      if (method === "zip") formData.append("zipFile", zipFile!);

      const { data: res } = await api.post("/projects/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("API response:", res);
      projectIdRef.current = res.data.projectId;
setProjectId(res.data.projectId);
setSubmitted(true);
setStep(3);
    } catch (err: any) {
      console.error("Submit error:", err.response?.data);
      console.error(
        "Validation errors:",
        JSON.stringify(err.response?.data?.errors, null, 2),
      );
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
        <div className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-16 h-16 bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] border border-[color-mix(in_srgb,var(--color-success)_20%,transparent)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} className="text-[var(--color-success)]" />
            </div>
            <h1 className="text-2xl font-bold text-[var(--color-text)] mb-3">
              Evaluation Started!
            </h1>
            <p className="text-[var(--color-muted)] mb-8">
              AI is analyzing your code. Results are usually ready in 2–3
              minutes. We'll notify you when done.
            </p>
            <div className="flex gap-3 justify-center mb-8">
              <Button // WITH:
onClick={() => navigate(`/projects/${projectIdRef.current}`)}>
                View Project
              </Button>
              <Button variant="outline" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
            <div className="flex flex-col items-center gap-3">
              <AdBanner slot="postSubmit" size="square" />
              <RewardedAdButton bucket="project" />
            </div>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-56">
      <InterstitialAdModal
        open={showAdGate}
        onClose={() => setShowAdGate(false)}
        onContinue={() => {
          setShowAdGate(false);
          if (pendingSubmitData) doSubmit(pendingSubmitData);
        }}
        title="Starting your evaluation…"
      />
      <div className="max-w-3xl mx-auto px-6 pt-8 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)] mb-1">
            Submit a Project
          </h1>
          <p className="text-[var(--color-muted)] text-sm">Get AI evaluation in minutes</p>
          {/* Steps */}
          <div className="flex items-center gap-3 mt-5">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                    step >= s
                      ? "bg-[var(--color-primary)] text-[var(--color-inverse)]"
                      : "bg-[var(--color-surface2)] text-[var(--color-muted)]",
                  )}
                >
                  {s}
                </div>
                <span
                  className={cn(
                    "text-xs",
                    step >= s ? "text-[var(--color-text)]" : "text-[var(--color-muted)]",
                  )}
                >
                  {s === 1 ? "Select Domain" : "Project Details"}
                </span>
                {s < 2 && (
                  <div
                    className={cn(
                      "w-8 h-px",
                      step > s ? "bg-[var(--color-primary)]" : "bg-[var(--color-surface2)]",
                    )}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-sm font-medium text-[var(--color-text)] mb-4">
              Choose your domain
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {DOMAINS.map((d) => (
                <motion.button
                  key={d.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedDomain(d.id)}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    selectedDomain === d.id
                      ? "border-[color-mix(in_srgb,var(--color-primary)_60%,transparent)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                      : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border)]",
                  )}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-2" style={{ background: 'color-mix(in srgb, var(--color-primary) 12%, transparent)', color: 'var(--color-primary)' }}>
                    <d.icon size={18} strokeWidth={1.8} />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text)]">{d.name}</p>
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    {d.description}
                  </p>
                </motion.button>
              ))}
            </div>
            <Button
              className="mt-6"
              disabled={!selectedDomain}
              onClick={() => setStep(2)}
            >
              Continue →
            </Button>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Card className="p-5">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
                Project Details
              </h3>
              <div className="space-y-4">
                <Input
                  label="Project Title"
                  placeholder="e.g. React E-Commerce Dashboard"
                  error={errors.title?.message}
                  {...register("title")}
                />
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text)] mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    {...register("description")}
                    placeholder="Brief description of what this project does..."
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[var(--color-primary)] resize-none h-24 transition-colors"
                  />
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
                Project Source
              </h3>
              {/* Method tabs */}
              <div className="flex gap-1 p-1 bg-[var(--color-bg)] rounded-xl mb-4">
                {[
                  {
                    id: "github",
                    label: "GitHub URL",
                    icon: <GitBranch size={14} />,
                  },
                  {
                    id: "liveurl",
                    label: "Live URL",
                    icon: <Globe size={14} />,
                  },
                  {
                    id: "zip",
                    label: "Upload ZIP",
                    icon: <Upload size={14} />,
                  },
                ].map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => switchMethod(id as SubmitMethod)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                      method === id
                        ? "bg-[var(--color-surface)] text-[var(--color-text)]"
                        : "text-[var(--color-muted)] hover:text-[var(--color-text)]",
                    )}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {method === "github" && (
                <div>
                  <Input
                    label="GitHub Repository URL"
                    placeholder="https://github.com/username/repo"
                    leftIcon={<GitBranch size={15} />}
                    rightIcon={
                      githubValid === true ? (
                        <CheckCircle size={15} className="text-[var(--color-success)]" />
                      ) : null
                    }
                    error={errors.githubUrl?.message}
                    {...register("githubUrl")}
                    onBlur={validateGithub}
                  />
                  {githubValid === false && (
                    <p className="mt-1.5 text-xs text-[var(--color-danger)]">
                      Repository not found or not public
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-[var(--color-muted)]">
                    Repository must be public with ≥5 commits, under 200MB
                  </p>
                </div>
              )}
              {method === "liveurl" && (
                <Input
                  label="Live Site URL"
                  placeholder="https://myproject.vercel.app"
                  leftIcon={<Globe size={15} />}
                  error={errors.liveUrl?.message}
                  {...register("liveUrl")}
                  onBlur={(e) => {
                    const val = e.target.value?.trim();
                    if (val) fetchSizeEstimate({ liveUrl: val });
                    else setSizeEstimate(null);
                  }}
                />
              )}
              {method === "zip" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setZipFile(file);
                    }}
                  />
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files[0];
                      if (file?.name.endsWith(".zip")) setZipFile(file);
                      else toast.error("Please upload a .zip file");
                    }}
                    className={cn(
                      "border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer",
                      isDragging
                        ? "border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_5%,transparent)]"
                        : zipFile
                          ? "border-[color-mix(in_srgb,var(--color-success)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-success)_5%,transparent)]"
                          : "border-[var(--color-border)] hover:border-[color-mix(in_srgb,var(--color-primary)_40%,transparent)]",
                    )}
                  >
                    {zipFile ? (
                      <>
                        <CheckCircle
                          size={24}
                          className="text-[var(--color-success)] mx-auto mb-2"
                        />
                        <p className="text-sm text-[var(--color-success)] font-medium">
                          {zipFile.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted)] mt-1">
                          {(zipFile.size / 1024 / 1024).toFixed(2)} MB ·{" "}
                          <span
                            className="text-[var(--color-danger)] hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZipFile(null);
                            }}
                          >
                            Remove
                          </span>
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload
                          size={24}
                          className="text-[var(--color-muted)] mx-auto mb-2"
                        />
                        <p className="text-sm text-[var(--color-text)] mb-1">
                          Drop your ZIP file here
                        </p>
                        <p className="text-xs text-[var(--color-muted)]">
                          or click to browse · Max 50MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Card>

            {/* Size / credit-cost estimate — shown before submit, per the
                "show estimate before submit" requirement. Never blocks
                typing/uploading; only appears once we have something to
                estimate from. */}
            {(estimating || sizeEstimate) && (
              <Card className="p-4">
                {estimating ? (
                  <div className="flex items-center gap-2.5 text-sm text-[var(--color-muted)]">
                    <Spinner className="w-4 h-4" />
                    Estimating project size & credit cost…
                  </div>
                ) : sizeEstimate ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Gauge size={15} className="text-[var(--color-muted)]" />
                      <span className="text-sm text-[var(--color-text)] font-medium">
                        Detected size:
                      </span>
                      <Badge variant={TIER_BADGE_VARIANT[sizeEstimate.tier]}>
                        {sizeEstimate.label}
                      </Badge>
                      <span className="text-sm text-[var(--color-muted)]">
                        {sizeEstimate.unlimited
                          ? "Free with Premium"
                          : `${sizeEstimate.creditsCost} project credit${sizeEstimate.creditsCost > 1 ? "s" : ""}`}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-muted)]">
                      {sizeEstimate.description} · ~{sizeEstimate.estimatedTokens.toLocaleString()} AI tokens estimated
                    </p>
                    {!sizeEstimate.unlimited && !sizeEstimate.canAfford && (
                      <p className="flex items-center gap-1.5 text-xs text-[var(--color-danger)]">
                        <AlertTriangle size={13} />
                        Not enough project credits for this size. Watch an ad, wait for your monthly reset, or{" "}
                        <button
                          type="button"
                          className="underline"
                          onClick={() => navigate("/pricing")}
                        >
                          upgrade
                        </button>
                        .
                      </p>
                    )}
                  </div>
                ) : null}
              </Card>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="ghost" onClick={() => setStep(1)}>
                ← Back
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
                disabled={!!sizeEstimate && !sizeEstimate.unlimited && !sizeEstimate.canAfford}
              >
                {loading
                  ? "Analyzing Code..."
                  : sizeEstimate && !sizeEstimate.unlimited
                    ? `Submit for Evaluation (${sizeEstimate.creditsCost} credit${sizeEstimate.creditsCost > 1 ? "s" : ""})`
                    : "Submit for Evaluation"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </PageWrapper>
  );
}
