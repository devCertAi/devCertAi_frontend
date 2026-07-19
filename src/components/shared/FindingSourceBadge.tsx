import { CheckCircle2, Sparkles } from "lucide-react";

interface FindingSourceBadgeProps {
  /** "verified" (came from a real static-analysis tool) or "ai-insight" (came from the AI's own code reading). */
  source?: string;
  /** Tool name to show in the tooltip when source === "verified" (e.g. "ESLint"). */
  tool?: string;
}

/**
 * Small trust badge rendered next to every finding card (bugs, suggested
 * changes, improvements, etc.) so the report visually distinguishes
 * deterministic tool output from AI-generated analysis.
 */
export function FindingSourceBadge({ source, tool }: FindingSourceBadgeProps) {
  if (!source) return null;

  if (source === "verified") {
    return (
      <span
        title={tool ? `Detected by ${tool}` : "Detected by static analysis tool"}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[color-mix(in_srgb,var(--color-success)_10%,transparent)] text-[var(--color-success)] border-[color-mix(in_srgb,var(--color-success)_20%,transparent)]"
      >
        <CheckCircle2 size={11} /> Verified
      </span>
    );
  }

  return (
    <span
      title="Identified through code analysis"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-[color-mix(in_srgb,#8B5CF6_12%,transparent)] text-[#8B5CF6] border-[color-mix(in_srgb,#8B5CF6_25%,transparent)]"
    >
      <Sparkles size={11} /> AI Insight
    </span>
  );
}
