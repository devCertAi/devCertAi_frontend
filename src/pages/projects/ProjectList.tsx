import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Trash2 } from "lucide-react";  // ✅ add Trash2
import { Project } from "@/types";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { AdInFeed } from "@/components/ads/AdInFeed";
import { AdBanner } from "@/components/ads/AdBanner";
import { formatDate, getScoreColor } from "@/lib/utils";
import api from "@/services/api";
import toast from "react-hot-toast";
import React from "react";
import { useSocket } from "@/hooks/useSocket";
import { useAuthStore } from "@/store/authStore";

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user } = useAuthStore();

  const fetchProjects = useCallback(() => {
    api.get('/projects')
      .then(({ data }) => setProjects(data.data.projects || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // FIX: update the card in-place when evaluation finishes so the status badge
  // and score appear immediately without a full reload.
  useSocket(user?.id, (data) => {
    setProjects(prev => prev.map(p =>
      p.id === data.projectId
        ? { ...p, status: data.status as Project['status'], score: data.score, level: data.level as Project['level'] }
        : p
    ));
  });

  // ✅ delete handler
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project?')) return
    try {
      await api.delete(`/projects/${id}`)
      setProjects(prev => prev.filter(p => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete')
    }
  }

  const filtered = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.domain.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <PageWrapper className="bg-[var(--color-bg)] pl-0 lg:pl-39">
      <div className="min-w-5xl px-9 pt-8 pb-16">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">My Projects</h1>
            <p className="text-[var(--color-muted)] text-sm mt-0.5">
              {projects.length} projects submitted
            </p>
          </div>
          <Link to="/submit">
            <Button size="sm"><Plus size={15} /> New Project</Button>
          </Link>
        </div>

       <div className="relative mb-6">
  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] pointer-events-none" />
  <input
    placeholder="Search projects..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--color-text)] placeholder-[var(--color-muted)] focus:outline-none focus:border-[color-mix(in_srgb,var(--color-primary)_50%,transparent)]"
  />
</div>

        <div className="flex justify-center mb-6"><AdBanner slot="topBanner" size="banner" className="w-full max-w-3xl" /></div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 bg-[var(--color-surface)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[var(--color-muted)] mb-4">
              {search ? "No projects match your search" : "You haven't submitted any projects yet"}
            </p>
            {!search && <Link to="/submit"><Button>Submit First Project</Button></Link>}
            <div className="flex justify-center mt-8"><AdInFeed /></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filtered.map((p, i) => (
              <React.Fragment key={p.id}>
                <Link to={`/projects/${p.id}`}>
                  <Card hover className="p-5 h-full relative group">  {/* ✅ relative group */}
                    {/* ✅ delete button — shows on hover */}
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-surface2)] transition-all z-10"
                    >
                      <Trash2 size={14} />
                    </button>

                   <div className="flex items-start justify-between mb-3 pr-8">

                      <Badge variant={p.status === "completed" ? "success" : p.status === "evaluating" ? "warning" : "muted"}>
                        {p.status}
                      </Badge>
                      {p.score != null && (
                        <span className="text-lg font-bold" style={{ color: getScoreColor(p.score) }}>
                          {p.score}/100
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-[var(--color-text)] mb-1">{p.title}</h3>
                    <p className="text-xs text-[var(--color-muted)] capitalize mb-3">
                      {p.domain} · {formatDate(p.createdAt)}
                    </p>
                    {p.level && <span className="text-xs text-[var(--color-muted)]">{p.level}</span>}
                  </Card>
                </Link>
                {(i + 1) % 4 === 0 && (
                  <div className="col-span-full flex justify-center"><AdInFeed /></div>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}