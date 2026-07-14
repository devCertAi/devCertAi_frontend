import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  User,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useNotificationStore } from "@/store/notificationStore";
import { Button } from "@/components/ui/Button";
import { ThemeSwitch } from "@/components/ui/ThemeSwitch";
import { NotificationPanel } from "@/components/notifications/NotificationPanel";
import { CreditWidget } from "@/components/credits/CreditWidget";

interface NavbarProps {
  hasSidebar?: boolean;
  sidebarOpen?: boolean;
  onMenuClick?: () => void;
}

export function Navbar({ hasSidebar, sidebarOpen, onMenuClick }: NavbarProps) {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isRecruiter = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";

  const navLinks = isRecruiter
    ? [
        { href: "/recruiter/dashboard", label: "Dashboard" },
        { href: "/recruiter/postings", label: "Postings" },
        { href: "/recruiter/company/verify", label: "Verification" },
      ]
    : isAdmin
      ? [
          { href: "/admin", label: "Dashboard" },
          { href: "/admin/users", label: "Users" },
          { href: "/admin/questions", label: "Questions" },
          { href: "/admin/companies", label: "Companies" },
        ]
      : [
          { href: "/projects", label: "Projects" },
          { href: "/exam", label: "Exams" },
          { href: "/certificates", label: "Certificates" },
          { href: "/pricing", label: "Pricing" },
        ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-40 backdrop-blur-md"
      style={{
        background: "var(--color-glass)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div className="max-w-9xl mx-auto pl-2 pr-4 sm:pl-3 sm:pr-6 lg:pl-4 lg:pr-8">
        <div className="flex items-center justify-between h-16 sm:h-[4.5rem]">
          {/* ========== LEFT: sidebar toggle (mobile only) + logo ========== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasSidebar && (
              <button
                onClick={onMenuClick}
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={!!sidebarOpen}
                className="lg:hidden p-2 -ml-2 sm:ml-0 rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                style={{ color: "var(--color-muted)" }}
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
              </div>
              <span
                className="font-bold text-xl sm:text-2xl tracking-tight"
                style={{ color: "var(--color-text)" }}
              >
                Proeva
              </span>
            </Link>
          </div>

          {/* Desktop nav links – only when NO sidebar */}
          {!hasSidebar && (
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    color: location.pathname.startsWith(link.href)
                      ? "var(--color-text)"
                      : "var(--color-muted)",
                    background: location.pathname.startsWith(link.href)
                      ? "var(--color-surface2)"
                      : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          )}

          {/* ========== RIGHT: icons, user menu, mobile inline toggle ========== */}
          <div className="flex items-center gap-1 sm:gap-2">
            <ThemeSwitch />

            {isAuthenticated ? (
              <>
                {!isRecruiter && !isAdmin && (
                  <CreditWidget compact className="flex" />
                )}

                {!isRecruiter && !isAdmin && (
                  <div className="relative">
                    <button
                      onClick={() => setShowNotifs(!showNotifs)}
                      className="relative p-2 rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                      style={{ color: "var(--color-muted)" }}
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span
                          className="absolute top-1 right-1 w-4 h-4 rounded-full text-[10px] text-[var(--color-inverse)] flex items-center justify-center font-medium"
                          style={{ background: "var(--color-primary)" }}
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>
                    <AnimatePresence>
                      {showNotifs && (
                        <NotificationPanel
                          onClose={() => setShowNotifs(false)}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* User menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-colors hover:bg-[var(--color-surface2)]"
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{
                        background:
                          "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                        border:
                          "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)",
                      }}
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span
                          className="text-xs font-semibold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {user?.name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span
                      className="hidden sm:block text-sm font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {user?.name?.split(" ")[0]}
                    </span>
                    <ChevronDown
                      size={14}
                      style={{ color: "var(--color-muted)" }}
                    />
                  </button>

                  <AnimatePresence>
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl shadow-2xl overflow-hidden"
                        style={{
                          background: "var(--color-surface)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {/* ... (user menu content unchanged) ... */}
                        <div
                          className="p-3"
                          style={{
                            borderBottom: "1px solid var(--color-border)",
                          }}
                        >
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--color-text)" }}
                          >
                            {user?.name}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: "var(--color-muted)" }}
                          >
                            {user?.email}
                          </p>
                          {user?.isPremium && (
                            <span
                              className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                                color: "var(--color-primary)",
                                border:
                                  "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
                              }}
                            >
                              Premium
                            </span>
                          )}
                          {(isRecruiter || isAdmin) && (
                            <span
                              className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                              style={{
                                background:
                                  "color-mix(in srgb, var(--color-secondary) 10%, transparent)",
                                color: "var(--color-secondary)",
                                border:
                                  "1px solid color-mix(in srgb, var(--color-secondary) 20%, transparent)",
                              }}
                            >
                              {isAdmin ? "Admin" : "Recruiter"}
                            </span>
                          )}
                        </div>

                        <div className="p-1">
                          <Link
                            to={
                              isRecruiter
                                ? "/recruiter/dashboard"
                                : isAdmin
                                  ? "/admin"
                                  : "/dashboard"
                            }
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                            style={{ color: "var(--color-muted)" }}
                          >
                            <User size={15} /> Dashboard
                          </Link>

                          {!isAdmin && (
                            <Link
                              to={
                                isRecruiter
                                  ? `/recruiter/profile`
                                  : `/profile/${user?.username}`
                              }
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                              style={{ color: "var(--color-muted)" }}
                            >
                              <User size={15} /> Profile
                            </Link>
                          )}

                          <Link
                            to={isRecruiter ? "/recruiter/settings" : "/settings"}
                            onClick={() => setShowUserMenu(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                            style={{ color: "var(--color-muted)" }}
                          >
                            <Settings size={15} /> Settings
                          </Link>

                          {isAdmin && (
                            <Link
                              to="/admin"
                              onClick={() => setShowUserMenu(false)}
                              className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                              style={{ color: "var(--color-primary)" }}
                            >
                              Admin Panel
                            </Link>
                          )}

                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors"
                            style={{ color: "var(--color-danger)" }}
                          >
                            <LogOut size={15} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/auth/login")}
                >
                  Login
                </Button>
                <Button size="sm" onClick={() => navigate("/auth/register")}>
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Sign up</span>
                </Button>
              </div>
            )}

            {/* Inline mobile menu toggle – only when NO sidebar exists */}
            {!hasSidebar && (
              <button
                className="md:hidden p-2 rounded-lg transition-colors hover:bg-[var(--color-surface2)]"
                style={{ color: "var(--color-muted)" }}
                onClick={() => setMobileOpen((v) => !v)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Inline mobile menu dropdown */}
      <AnimatePresence>
        {!hasSidebar && mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden"
            style={{
              borderTop: "1px solid var(--color-border)",
              background: "var(--color-bg)",
            }}
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{ color: "var(--color-muted)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}