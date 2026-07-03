import { Link } from "react-router-dom";
import { ChevronRight, Trash2 } from "lucide-react";import { Project } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDate, getScoreColor } from "@/lib/utils";
import api from "@/services/api";
import toast from "react-hot-toast";

const statusVariant: Record<
  string,
  "success" | "warning" | "muted" | "danger"
> = {
  completed: "success",
  evaluating: "warning",
  pending: "muted",
  failed: "danger",
};

 
interface Props {
  projects: Project[];
  onDelete?: (id: string) => void;
}
export function ProjectTable({ projects, onDelete }: Props) {
  // 4. Add handler inside component
  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project?")) return;
    try {
      await api.delete(`/projects/${id}`);
      toast.success("Project deleted");
      onDelete?.(id);
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            {["Project", "Domain", "Score", "Status", "Date", "Actions"].map((h) => (
              <th
                key={h}
                className="pb-3 text-left text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider px-2 first:pl-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {projects.map((p) => (
            <tr key={p.id} className="hover:bg-[var(--color-surface2)] transition-colors">
              <td className="py-3 px-2 first:pl-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate max-w-[180px]">
                  {p.title}
                </p>
                {p.githubUrl && (
                  <p className="text-xs text-[var(--color-muted)] truncate max-w-[180px]">
                    {p.githubUrl.replace("https://github.com/", "")}
                  </p>
                )}
              </td>
              <td className="py-3 px-2">
                <span className="text-xs text-[var(--color-muted)] capitalize">
                  {p.domain}
                </span>
              </td>
              <td className="py-3 px-2">
                {p.score != null ? (
                  <span
                    className="text-sm font-semibold"
                    style={{ color: getScoreColor(p.score) }}
                  >
                    {p.score}/100
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-muted)]">—</span>
                )}
              </td>
              <td className="py-3 px-2">
                <Badge variant={statusVariant[p.status] || "muted"}>
                  {p.status}
                </Badge>
              </td>
              <td className="py-3 px-2">
                <span className="text-xs text-[var(--color-muted)]">
                  {formatDate(p.createdAt)}
                </span>
              </td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-1">
                  <Link
                    to={`/projects/${p.id}`}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-text)] inline-flex transition-colors"
                  >
                    <ChevronRight size={15} />
                  </Link>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg hover:bg-[var(--color-surface2)] text-[var(--color-muted)] hover:text-[var(--color-danger)] transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
           
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
