import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  BookOpen,
  Award,
  User,
  Settings,
  Shield,
  Briefcase,
  BarChart2,
  CheckCircle,
  Users,
  HelpCircle,
  List,
  Building2,
  Activity,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const sidebarLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
    active
      ? "bg-[color-mix(in_srgb,var(--color-primary)_10%,transparent)] text-[var(--color-primary)] border border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)]"
      : "text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)]",
  );

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-4 pb-1">
      <span
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const p = location.pathname;

  // ── Admin sidebar ─────────────────────────────────────────────────────────
  if (user?.role === "admin") {
    return (
      <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col py-4 overflow-y-auto hidden lg:flex">
        <nav className="flex-1 px-3 space-y-0.5">
          <SectionLabel label="Overview" />
          <Link to="/admin" className={sidebarLinkClass(p === "/admin")}>
            <BarChart2 size={17} /> Dashboard
          </Link>

          <SectionLabel label="Users" />
          <Link
            to="/admin/users"
            className={sidebarLinkClass(p.startsWith("/admin/users"))}
          >
            <Users size={17} /> All Users
          </Link>

          <SectionLabel label="Recruiting" />
          <Link
            to="/admin/companies"
            className={sidebarLinkClass(p.startsWith("/admin/companies"))}
          >
            <Building2 size={17} /> Companies
          </Link>

          <SectionLabel label="Platform" />
          <Link
            to="/admin/questions"
            className={sidebarLinkClass(p.startsWith("/admin/questions"))}
          >
            <HelpCircle size={17} /> Questions
          </Link>
          <Link
            to="/admin/queues"
            className={sidebarLinkClass(p.startsWith("/admin/queues"))}
          >
            <Activity size={17} /> Queues
          </Link>
        </nav>

        <div className="px-3 space-y-0.5 border-t border-[var(--color-border)] pt-3 mt-3">
          <div
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium"
            style={{ color: "var(--color-muted)" }}
          >
            <Shield size={17} style={{ color: "var(--color-primary)" }} />
            <div>
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                {user.name}
              </p>
              <p className="text-[10px]">Administrator</p>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // ── Recruiter sidebar ─────────────────────────────────────────────────────
  if (user?.role === "recruiter") {
    return (
      <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col py-4 overflow-y-auto hidden lg:flex">
        <nav className="flex-1 px-3 space-y-0.5">
          <Link
            to="/recruiter/dashboard"
            className={sidebarLinkClass(p === "/recruiter/dashboard")}
          >
            <BarChart2 size={17} /> Dashboard
          </Link>
          <Link
            to="/recruiter/postings"
            className={sidebarLinkClass(
              p.startsWith("/recruiter/postings") ||
                p.startsWith("/recruiter/applications"),
            )}
          >
            <Briefcase size={17} /> Postings
          </Link>
          <Link
            to="/recruiter/company/verify"
            className={sidebarLinkClass(p === "/recruiter/company/verify")}
          >
            <CheckCircle size={17} /> Verification
          </Link>
        </nav>

        <div className="px-3 space-y-0.5 border-t border-[var(--color-border)] pt-3 mt-3">
          <Link
            to="/recruiter/settings"
            className={sidebarLinkClass(p === "/recruiter/settings")}
          >
            <Settings size={17} /> Settings
          </Link>
          <Link
            to={`/recruiter/profile`}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
          >
            <User size={17} /> Profile
          </Link>
        </div>
      </aside>
    );
  }

  // ── Student sidebar
  return (
    <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex flex-col py-4 overflow-y-auto hidden lg:flex">
      <nav className="flex-1 px-3 space-y-0.5">
        <Link to="/dashboard" className={sidebarLinkClass(p === "/dashboard")}>
          <LayoutDashboard size={17} /> Dashboard
        </Link>
        <Link
          to="/projects"
          className={sidebarLinkClass(p.startsWith("/projects"))}
        >
          <FolderOpen size={17} /> Projects
        </Link>
        <Link to="/exam" className={sidebarLinkClass(p.startsWith("/exam"))}>
          <BookOpen size={17} /> Exams
        </Link>
        <Link
          to="/certificates"
          className={sidebarLinkClass(p.startsWith("/certificates"))}
        >
          <Award size={17} /> Certificates
        </Link>
        <Link
          to="/recruiting"
          className={sidebarLinkClass(p === "/recruiting")}
        >
          <Briefcase size={17} /> Hire on DevCert
        </Link>
      </nav>

      <div className="px-3 space-y-0.5 border-t border-[var(--color-border)] pt-3 mt-3">
        <Link to="/settings" className={sidebarLinkClass(p === "/settings")}>
          <Settings size={17} /> Settings
        </Link>
        <Link
          to={`/profile/${user?.username}`}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
        >
          <User size={17} /> Profile
        </Link>
      </div>
    </aside>
  );
}