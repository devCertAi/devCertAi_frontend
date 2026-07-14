import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
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
  Building2,
  Activity,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

interface SidebarProps {
  /** Whether the mobile/tablet drawer is open. Ignored on desktop (lg+), where the rail is always visible. */
  isOpen?: boolean;
  /** Called when the drawer should close (backdrop click, link click, close button, Escape). */
  onClose?: () => void;
}

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

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  const p = location.pathname;

  // ── Build nav content per role ──────────────────────────────────────────
  let navContent: React.ReactNode;
  let footerContent: React.ReactNode;

  if (user?.role === "admin") {
    navContent = (
      <>
        <SectionLabel label="Overview" />
        <Link
          to="/admin"
          onClick={onClose}
          className={sidebarLinkClass(p === "/admin")}
        >
          <BarChart2 size={17} /> Dashboard
        </Link>

        <SectionLabel label="Users" />
        <Link
          to="/admin/users"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/admin/users"))}
        >
          <Users size={17} /> All Users
        </Link>

        <SectionLabel label="Recruiting" />
        <Link
          to="/admin/companies"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/admin/companies"))}
        >
          <Building2 size={17} /> Companies
        </Link>

        <SectionLabel label="Platform" />
        <Link
          to="/admin/questions"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/admin/questions"))}
        >
          <HelpCircle size={17} /> Questions
        </Link>
        <Link
          to="/admin/queues"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/admin/queues"))}
        >
          <Activity size={17} /> Queues
        </Link>
      </>
    );

    footerContent = (
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
    );
  } else if (user?.role === "recruiter") {
    navContent = (
      <>
        <Link
          to="/recruiter/dashboard"
          onClick={onClose}
          className={sidebarLinkClass(p === "/recruiter/dashboard")}
        >
          <BarChart2 size={17} /> Dashboard
        </Link>
        <Link
          to="/recruiter/postings"
          onClick={onClose}
          className={sidebarLinkClass(
            p.startsWith("/recruiter/postings") ||
              p.startsWith("/recruiter/applications"),
          )}
        >
          <Briefcase size={17} /> Postings
        </Link>
        <Link
          to="/recruiter/company/verify"
          onClick={onClose}
          className={sidebarLinkClass(p === "/recruiter/company/verify")}
        >
          <CheckCircle size={17} /> Verification
        </Link>
      </>
    );

    footerContent = (
      <>
        <Link
          to="/recruiter/settings"
          onClick={onClose}
          className={sidebarLinkClass(p === "/recruiter/settings")}
        >
          <Settings size={17} /> Settings
        </Link>
        <Link
          to="/recruiter/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
        >
          <User size={17} /> Profile
        </Link>
      </>
    );
  } else {
    navContent = (
      <>
        <Link
          to="/dashboard"
          onClick={onClose}
          className={sidebarLinkClass(p === "/dashboard")}
        >
          <LayoutDashboard size={17} /> Dashboard
        </Link>
        <Link
          to="/projects"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/projects"))}
        >
          <FolderOpen size={17} /> Projects
        </Link>
        <Link
          to="/exam"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/exam"))}
        >
          <BookOpen size={17} /> Exams
        </Link>
        <Link
          to="/certificates"
          onClick={onClose}
          className={sidebarLinkClass(p.startsWith("/certificates"))}
        >
          <Award size={17} /> Certificates
        </Link>
      </>
    );

    footerContent = (
      <>
        <Link
          to="/settings"
          onClick={onClose}
          className={sidebarLinkClass(p === "/settings")}
        >
          <Settings size={17} /> Settings
        </Link>
        <Link
          to={`/profile/${user?.username}`}
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface2)] transition-colors"
        >
          <User size={17} /> Profile
        </Link>
      </>
    );
  }

  return (
    <>
      {/* Desktop rail — always visible at lg+, static position */}
      <aside className="fixed left-0 top-16 bottom-0 w-56 bg-[var(--color-bg)] border-r border-[var(--color-border)] flex-col py-4 overflow-y-auto hidden lg:flex z-30">
        <nav className="flex-1 px-3 space-y-0.5">{navContent}</nav>
        <div className="px-3 space-y-0.5 border-t border-[var(--color-border)] pt-3 mt-3">
          {footerContent}
        </div>
      </aside>

      {/* Mobile / tablet drawer — slides in below the navbar, dismissible */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              className="fixed left-0 right-0 top-16 bottom-0 z-40 lg:hidden"
              style={{ background: "color-mix(in srgb, black 45%, transparent)" }}
              aria-hidden="true"
            />
            <motion.aside
              key="sidebar-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              className="fixed left-0 top-16 bottom-0 w-72 max-w-[80vw] flex flex-col py-4 overflow-y-auto z-50 lg:hidden shadow-2xl"
              style={{
                background: "var(--color-bg)",
                borderRight: "1px solid var(--color-border)",
              }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <div className="flex items-center justify-between px-3 pb-2">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--color-muted)" }}
                >
                  Menu
                </span>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                  style={{ color: "var(--color-muted)" }}
                  aria-label="Close menu"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="flex-1 px-3 space-y-0.5">{navContent}</nav>
              <div className="px-3 space-y-0.5 border-t border-[var(--color-border)] pt-3 mt-3">
                {footerContent}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
