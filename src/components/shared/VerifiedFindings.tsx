import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, PackageSearch, Copy, GitBranch, Repeat, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ToolResults } from "@/types";

type SubTab = "security" | "dependencies" | "duplication" | "complexity" | "health";

const SEVERITY_VARIANT: Record<string, "danger" | "warning" | "muted"> = {
  critical: "danger",
  high: "danger",
  medium: "warning",
  low: "muted",
};

function EmptyState({ label, clean = true }: { label: string; clean?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {clean
        ? <CheckCircle2 size={22} className="text-[var(--color-success)] opacity-70" />
        : <AlertCircle size={22} className="text-[var(--color-muted)] opacity-70" />}
      <p className="text-xs text-[var(--color-muted)] max-w-xs">{label}</p>
    </div>
  );
}

/**
 * Renders raw-but-formatted static-analysis output — separate from the AI
 * narrative — so every score bar has clickable, filterable proof behind it
 * instead of just a number backed by an unverifiable AI claim.
 */
export function VerifiedFindings({ toolResults }: { toolResults?: ToolResults }) {
  const [subTab, setSubTab] = useState<SubTab>("security");

  const tr = toolResults || {};
  const secFindings = tr.security?.findings || [];
  const secrets = tr.secrets?.found || [];
  const vulns = tr.dependencies?.vulnerabilities || [];
  const dupPercent = tr.duplication?.duplicationPercent;
  const clones = tr.duplication?.clones || [];
  const avgCcn = tr.complexity?.avgCyclomaticComplexity;
  const highComplexity = tr.complexity?.highComplexityFunctions || [];
  const circularChains = tr.circularDependencies?.found || [];
  const unusedDeps = tr.dependencyHealth?.unused || [];
  const missingDeps = tr.dependencyHealth?.missing || [];

  const meta = tr.meta;
  const toolsRun = meta?.toolsRun || [];
  const toolsFailed = meta?.toolsFailed || [];
  const scanCompletelyFailed = !!meta && toolsRun.length === 0 && toolsFailed.length > 0;
  const scanPartiallyFailed = !!meta && toolsRun.length > 0 && toolsFailed.length > 0;

  const subTabs: { id: SubTab; label: string; count: number }[] = [
    { id: "security", label: "Security", count: secFindings.length + secrets.length },
    { id: "dependencies", label: "Dependencies", count: vulns.length },
    { id: "duplication", label: "Duplication", count: clones.length },
    { id: "complexity", label: "Complexity", count: highComplexity.length },
    { id: "health", label: "Dependency Health", count: circularChains.length + unusedDeps.length + missingDeps.length },
  ];

  return (
    <Card glass hover className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-[var(--color-text)]">Verified Findings</h2>
        <span className="text-[10px] text-[var(--color-muted)] font-mono uppercase tracking-wide">
          Raw static-analysis output — not AI generated
        </span>
      </div>

      {scanCompletelyFailed && (
        <div className="flex items-start gap-2.5 mb-4 px-3.5 py-3 rounded-lg border border-[color-mix(in_srgb,var(--color-warning)_25%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)]">
          <AlertCircle size={15} className="text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[var(--color-muted)]">
            <span className="text-[var(--color-warning)] font-medium">No static-analysis tools completed for this scan</span> —
            the sections below reflect that, not a clean codebase. This usually means the scanning environment
            (Docker or the individual CLI tools) wasn't reachable when this evaluation ran.
          </p>
        </div>
      )}
      {scanPartiallyFailed && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-4 px-3.5 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          <p className="text-xs text-[var(--color-muted)] mb-2.5">
            <span className="text-[var(--color-warning)] font-medium">
              {toolsFailed.length} of {toolsRun.length + toolsFailed.length} tools didn't complete
            </span>{" "}
            — the sections below only reflect the tools that ran. This usually means the scanning
            environment (Docker or the individual CLI) wasn't reachable for those tools during this scan.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {toolsRun.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]"
              >
                <CheckCircle2 size={10} /> {tool}
              </span>
            ))}
            {toolsFailed.map((tool) => (
              <span
                key={tool}
                title="Didn't complete for this scan"
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[color-mix(in_srgb,var(--color-muted)_10%,transparent)] text-[var(--color-muted)] border-[var(--color-border)] line-through decoration-[var(--color-muted)]/60"
              >
                <XCircle size={10} /> {tool}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-1 p-1 bg-[var(--color-bg)] rounded-lg mb-4 max-w-full overflow-x-auto border border-[var(--color-border)] w-fit">
        {subTabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all shrink-0 ${
              subTab === t.id
                ? "bg-[var(--color-primary)] text-[var(--color-inverse)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-text)]"
            }`}
          >
            {t.label}{t.count > 0 ? ` (${t.count})` : ""}
          </button>
        ))}
      </div>

      {subTab === "security" && (
        secFindings.length === 0 && secrets.length === 0 ? (
          <EmptyState label="No security findings or exposed secrets detected." clean={!scanCompletelyFailed} />
        ) : (
          <div className="space-y-4">
            {secrets.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <Shield size={13} /> Secrets detected ({tr.secrets?.tool || "Gitleaks"})
                </p>
                <div className="space-y-1.5">
                  {secrets.map((s, i) => (
                    <div key={i} className="flex items-center justify-between text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2">
                      <span className="font-mono text-[var(--color-text)]">{s.file}:{s.line}</span>
                      <Badge variant="danger">{s.type}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {secFindings.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <Shield size={13} /> Security findings ({tr.security?.tools?.join(" + ") || tr.security?.tool || "semgrep"})
                </p>
                <div className="space-y-1.5">
                  {secFindings.map((f, i) => (
                    <div key={i} className="text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[var(--color-text)]">{f.file}:{f.line}</span>
                        <div className="flex items-center gap-1.5">
                          {f.tool && <Badge variant="muted">{f.tool}</Badge>}
                          <Badge variant={SEVERITY_VARIANT[f.severity] || "muted"}>{f.severity}</Badge>
                        </div>
                      </div>
                      <p className="text-[var(--color-muted)]">{f.ruleId}{f.message ? ` — ${f.message}` : ""}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {subTab === "dependencies" && (
        vulns.length === 0 ? (
          <EmptyState label="No known vulnerable dependencies found." clean={!scanCompletelyFailed} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-[var(--color-muted)] border-b border-[var(--color-border)]">
                  <th className="py-2 pr-3 font-medium"><PackageSearch size={12} className="inline mr-1" />Package</th>
                  <th className="py-2 pr-3 font-medium">Version</th>
                  <th className="py-2 pr-3 font-medium">Severity</th>
                  <th className="py-2 pr-3 font-medium">CVE</th>
                </tr>
              </thead>
              <tbody>
                {vulns.map((v, i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 pr-3 font-mono text-[var(--color-text)]">{v.package}</td>
                    <td className="py-2 pr-3 text-[var(--color-muted)]">{v.version}</td>
                    <td className="py-2 pr-3"><Badge variant={SEVERITY_VARIANT[v.severity] || "muted"}>{v.severity}</Badge></td>
                    <td className="py-2 pr-3">
                      {v.cve ? (
                        <a
                          href={`https://nvd.nist.gov/vuln/detail/${v.cve}`}
                          target="_blank" rel="noopener noreferrer"
                          className="text-[var(--color-primary)] hover:underline"
                        >
                          {v.cve}
                        </a>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {subTab === "duplication" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Copy size={14} className="text-[var(--color-muted)]" />
            <span className="text-sm text-[var(--color-text)]">
              {typeof dupPercent === "number" ? `${dupPercent}% duplicated code` : "Duplication data unavailable"}
            </span>
          </div>
          {clones.length === 0 ? (
            <EmptyState label="No significant duplicate code blocks found." clean={!scanCompletelyFailed} />
          ) : (
            <div className="space-y-1.5">
              {clones.map((c, i) => (
                <div key={i} className="text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="font-mono text-[var(--color-text)]">{c.files.join(" ↔ ")}</span>
                  <span className="text-[var(--color-muted)]">{c.lines} lines</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === "complexity" && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch size={14} className="text-[var(--color-muted)]" />
            <span className="text-sm text-[var(--color-text)]">
              {typeof avgCcn === "number" ? `Avg cyclomatic complexity: ${avgCcn}` : "Complexity data unavailable"}
            </span>
          </div>
          {highComplexity.length === 0 ? (
            <EmptyState label="No high-complexity functions flagged." clean={!scanCompletelyFailed} />
          ) : (
            <div className="space-y-1.5">
              {highComplexity.map((f, i) => (
                <div key={i} className="text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2 flex items-center justify-between">
                  <span className="font-mono text-[var(--color-text)]">{f.file} · {f.function}</span>
                  <Badge variant={f.ccn >= 25 ? "danger" : "warning"}>CCN {f.ccn}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {subTab === "health" && (
        circularChains.length === 0 && unusedDeps.length === 0 && missingDeps.length === 0 ? (
          <EmptyState label="No circular imports, unused, or missing dependencies detected." clean={!scanCompletelyFailed} />
        ) : (
          <div className="space-y-4">
            {missingDeps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <PackageSearch size={13} /> Missing dependencies (depcheck) — used in code, not in package.json
                </p>
                <div className="space-y-1.5">
                  {missingDeps.map((m, i) => (
                    <div key={i} className="text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2 flex items-center justify-between">
                      <span className="font-mono text-[var(--color-text)]">{m.package}</span>
                      <Badge variant="danger">used in {m.usedIn.length} file(s)</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {circularChains.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <Repeat size={13} /> Circular imports (madge)
                </p>
                <div className="space-y-1.5">
                  {circularChains.map((c, i) => (
                    <div key={i} className="text-xs bg-[var(--color-bg)] rounded-lg px-3 py-2">
                      <span className="font-mono text-[var(--color-text)]">{c.chain.join(" → ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {unusedDeps.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text)] mb-2 flex items-center gap-1.5">
                  <PackageSearch size={13} /> Unused dependencies (depcheck)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {unusedDeps.map((d, i) => (
                    <Badge key={i} variant="muted">{d}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </Card>
  );
}