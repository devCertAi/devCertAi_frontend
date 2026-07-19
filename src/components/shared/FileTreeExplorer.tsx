import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, FolderOpen, File, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

// ── tree building ────────────────────────────────────────────────────────────
type FileIssue = { count: number; severity: "critical" | "high" | "medium" | "low" };

interface TreeNode {
  name: string;
  path: string;
  isFile: boolean;
  children: Map<string, TreeNode>;
}

function buildTree(paths: string[]): TreeNode {
  const root: TreeNode = { name: "", path: "", isFile: false, children: new Map() };
  for (const raw of paths) {
    const parts = raw.split("/").filter(Boolean);
    let node = root;
    let acc = "";
    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;
      if (!node.children.has(part)) {
        node.children.set(part, { name: part, path: acc, isFile, children: new Map() });
      }
      node = node.children.get(part)!;
    });
  }
  return root;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "var(--color-danger)",
  high: "var(--color-danger)",
  medium: "var(--color-warning)",
  low: "#3B82F6",
};

const EXT_COLOR: Record<string, string> = {
  ts: "#3B82F6", tsx: "#3B82F6", js: "#F7DF1E", jsx: "#61DAFB",
  py: "#3776AB", json: "var(--color-muted)", md: "var(--color-muted)",
  css: "#8B5CF6", html: "#E44D26", yml: "var(--color-muted)", yaml: "var(--color-muted)",
};

function extColor(name: string): string {
  const ext = name.split(".").pop() || "";
  return EXT_COLOR[ext] || "var(--color-muted)";
}

// ── node renderer ────────────────────────────────────────────────────────────
function NodeRow({
  node, depth, issuesByFile, defaultOpen,
}: {
  node: TreeNode; depth: number; issuesByFile: Record<string, FileIssue>; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const entries = useMemo(
    () => [...node.children.values()].sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1; // folders first
      return a.name.localeCompare(b.name);
    }),
    [node]
  );

  if (node.isFile) {
    const issue = issuesByFile[node.path];
    return (
      <div
        className="flex items-center gap-2 py-1 rounded-md hover:bg-[var(--color-surface2)] transition-colors group"
        style={{ paddingLeft: depth * 16 + 22 }}
      >
        <File size={12} style={{ color: extColor(node.name) }} className="flex-shrink-0" />
        <span className="text-xs font-mono text-[var(--color-text)] truncate">{node.name}</span>
        {issue && (
          <span
            className="flex items-center gap-1 ml-auto mr-2 text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0"
            style={{
              color: SEVERITY_COLOR[issue.severity],
              backgroundColor: `color-mix(in srgb, ${SEVERITY_COLOR[issue.severity]} 12%, transparent)`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: SEVERITY_COLOR[issue.severity] }} />
            {issue.count}
          </span>
        )}
      </div>
    );
  }

  const folderIssueCount = countFolderIssues(node, issuesByFile);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 py-1 rounded-md hover:bg-[var(--color-surface2)] transition-colors w-full text-left"
        style={{ paddingLeft: depth * 16 }}
      >
        <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }} className="flex-shrink-0">
          <ChevronRight size={12} className="text-[var(--color-muted)]" />
        </motion.span>
        {open
          ? <FolderOpen size={13} className="text-[var(--color-primary)] flex-shrink-0" />
          : <Folder size={13} className="text-[var(--color-muted)] flex-shrink-0" />}
        <span className="text-xs font-medium text-[var(--color-text)] truncate">{node.name}</span>
        {folderIssueCount > 0 && (
          <span className="ml-auto mr-2 text-[10px] text-[var(--color-muted)] flex-shrink-0">{folderIssueCount} flagged</span>
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="overflow-hidden"
          >
            {entries.map((child) => (
              <NodeRow key={child.path} node={child} depth={depth + 1} issuesByFile={issuesByFile} defaultOpen={depth < 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function countFolderIssues(node: TreeNode, issuesByFile: Record<string, FileIssue>): number {
  let total = 0;
  for (const child of node.children.values()) {
    if (child.isFile) total += issuesByFile[child.path]?.count || 0;
    else total += countFolderIssues(child, issuesByFile);
  }
  return total;
}

// ── public component ─────────────────────────────────────────────────────────
export function FileTreeExplorer({
  fileTree, issuesByFile, techStack,
}: {
  fileTree: string[];
  issuesByFile: Record<string, FileIssue>;
  techStack?: string[];
}) {
  const tree = useMemo(() => buildTree(fileTree || []), [fileTree]);
  const rootEntries = useMemo(
    () => [...tree.children.values()].sort((a, b) => {
      if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
      return a.name.localeCompare(b.name);
    }),
    [tree]
  );

  if (!fileTree || fileTree.length === 0) {
    return null;
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-semibold text-[var(--color-text)]">Code Structure</h2>
        {techStack && techStack.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {techStack.slice(0, 8).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-surface2)] text-[var(--color-text)] border border-[var(--color-border)]">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
      <p className="text-[10px] text-[var(--color-muted)] mb-3 uppercase tracking-wide font-mono">
        {fileTree.length} files scanned · colored dots mark files with flagged findings
      </p>
      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1">
        {rootEntries.map((node) => (
          <NodeRow key={node.path} node={node} depth={0} issuesByFile={issuesByFile} defaultOpen={true} />
        ))}
      </div>
    </Card>
  );
}
