import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import {
  Award,
  Mail,
  MapPin,
  Phone,
  GitBranch,
  Globe,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  Edit2,
  X,
  Camera,
  Pencil,
  Check,
  Download,
  Link2,
  FolderOpen,
  BookOpen,
  Star,
  Layers,
  ExternalLink,
} from "lucide-react";
import toast from "react-hot-toast";
import { User, Certificate, Skill } from "@/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import CertificateCard from "@/components/certificates/CertificateCard";
import { getLevelColor } from "@/lib/utils";
import api from "@/services/api";
import { SkillsInput } from "@/components/profile/SkillsInput";
import ProfileDetailForm, {
  ProfileDetailData,
} from "@/components/profile/ProfileDetailForm";

// ─── types ─────────────────────────────────────────────────────────────────────

interface Education {
  id: string;
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: number;
  endYear?: number;
  grade?: string;
  description?: string;
}
interface Experience {
  id: string;
  company: string;
  title: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  description?: string;
}
interface ProfileCert {
  id: string;
  name: string;
  issuer?: string;
  issueDate?: string;
  credentialUrl?: string;
}
interface Project {
  id: string;
  title: string;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
  projectUrl?: string;
  description?: string;
}
interface Training {
  id: string;
  program: string;
  organization?: string;
  location?: string;
  isOnline: boolean;
  startDate?: string;
  endDate?: string;
  isOngoing: boolean;
  description?: string;
}
interface Portfolio {
  id: string;
  title: string;
  url: string;
}
interface ProfileDetail {
  headline?: string;
  summary?: string;
  phone?: string;
  location?: string;
  gender?: string;
  dob?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  education: Education[];
  experience: Experience[];
  certifications: ProfileCert[];
  projects: Project[];
  trainings: Training[];
  portfolios: Portfolio[];
  extraCurricular?: string;
  accomplishments?: string;
}

// ─── helpers ───────────────────────────────────────────────────────────────────

const LinkedInIcon = ({ size = 15, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

function fmtYear(start?: number | string, end?: number | string) {
  if (!start) return "";
  return `${start} – ${end || "Present"}`;
}

function fmtMonth(start?: string, end?: string, isCurrent?: boolean) {
  const fmt = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })
      : "";
  if (!start) return "";
  return `${fmt(start)} – ${isCurrent ? "Present" : fmt(end)}`;
}

const empLabel: Record<string, string> = {
  full_time: "Full Time",
  internship: "Internship",
  part_time: "Part Time",
  freelance: "Freelance",
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function EmptyState({ text }: { text: string }) {
  return (
    <p className="text-sm text-[var(--color-muted)] italic py-1">{text}</p>
  );
}

function ItemCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="border border-[var(--color-border)] rounded-xl p-4 bg-[var(--color-surface)]">
      {children}
    </div>
  );
}

// Section header with optional edit button
function SectionHead({
  icon,
  title,
  onEdit,
}: {
  icon?: React.ReactNode;
  title: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {icon && <span className="text-[var(--color-primary)]">{icon}</span>}
      <h2 className="text-xs font-bold text-[var(--color-muted)] tracking-widest uppercase">
        {title}
      </h2>
      <div className="flex-1 h-px bg-[var(--color-border)]" />
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors p-0.5"
        >
          <Edit2 size={13} />
        </button>
      )}
    </div>
  );
}

// "Add X" prompt shown in empty sections for the owner
function AddPrompt({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-sm text-[var(--color-primary)] hover:opacity-70 transition-opacity py-1"
    >
      <Plus size={14} /> {label}
    </button>
  );
}

// ─── Avatar / Name editors ─────────────────────────────────────────────────────

function AvatarEditor({
  user,
  onUpdated,
}: {
  user: User;
  onUpdated: (u: Partial<User>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("avatar", file);
      // Profile.tsx line 232 — change patch → put
      const { data } = await api.put("/users/profile", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onUpdated({ avatar: data.data.user.avatar });
      toast.success("Photo updated");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  return (
    <div className="relative group w-24 h-24 flex-shrink-0">
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-surface)] shadow"
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] border-4 border-[var(--color-surface)] shadow flex items-center justify-center">
          <span className="text-4xl font-bold text-[var(--color-primary)]">
            {user.name[0].toUpperCase()}
          </span>
        </div>
      )}
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
      >
        {uploading ? (
          <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
        ) : (
          <Camera size={20} />
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

function NameEditor({
  name,
  onSaved,
}: {
  name: string;
  onSaved: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!value.trim() || value.trim() === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.patch("/users/profile", {
        name: value.trim(),
      });
      onSaved(data.data.user.name);
      toast.success("Name updated");
      setEditing(false);
    } catch {
      toast.error("Failed");
    } finally {
      setSaving(false);
    }
  };
  if (editing)
    return (
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") setEditing(false);
          }}
          className="text-2xl font-bold text-[var(--color-text)] bg-transparent border-b-2 border-[var(--color-primary)] outline-none w-48"
        />
        <button
          onClick={save}
          disabled={saving}
          className="text-[var(--color-primary)] hover:opacity-70"
        >
          <Check size={16} />
        </button>
        <button
          onClick={() => {
            setValue(name);
            setEditing(false);
          }}
          className="text-[var(--color-muted)] hover:opacity-70"
        >
          <X size={16} />
        </button>
      </div>
    );
  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{name}</h1>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-all"
      >
        <Pencil size={14} />
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user: authUser } = useAuthStore();

  // Redirect /profile/me → /profile/:actualUsername
  useEffect(() => {
    if (username === "me") {
      const realUsername = authUser?.username;
      if (realUsername) {
        const tab = searchParams.get("tab");
        const returnTo = searchParams.get("returnTo");
        let dest = `/profile/${realUsername}`;
        const qs = new URLSearchParams();
        if (tab) qs.set("tab", tab);
        if (returnTo) qs.set("returnTo", returnTo);
        if ([...qs].length) dest += `?${qs.toString()}`;
        navigate(dest, { replace: true });
      }
    }
  }, [username, authUser, navigate, searchParams]);

  const [user, setUser] = useState<User | null>(null);
  const [certs, setCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);
  const [detail, setDetail] = useState<ProfileDetail | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deletingCv, setDeletingCv] = useState(false);

  // ── fetch profile ──
  useEffect(() => {
    setLoading(true);
    api
      .get(`/users/profile/${username}`)
      .then((profileRes) => {
        const u = profileRes.data.data.user;
        setUser(u);
        setCerts(profileRes.data.data.certificates || u?.certificates || []);
        // Use isOwner from the backend response
        setIsOwner(profileRes.data.data.isOwner === true);
        setSkills(
          (u?.skills || []).map((s: any) => ({
            id: s.skill.id,
            name: s.skill.name,
            level: s.level,
          })),
        );
        setDetail(u?.profileDetail || null);
      })
      .catch((error) => {
        console.error("Failed to fetch profile:", error);
        toast.error("Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, [username]);

  // ── scroll-to-section after form mounts ──
  // We store the target id in a ref (not state) so setting it never causes a render.
  // The form wrapper uses a callback ref; React calls it with the DOM node the instant
  // the node is inserted — guaranteed after paint, unlike useEffect.
  const scrollTargetRef = useRef<string | null>(null);

  const openSection = (sectionId: string) => {
    scrollTargetRef.current = sectionId;
    setEditOpen(true);
  };

  // callback ref on the edit form wrapper
  const formWrapperRef = (el: HTMLDivElement | null) => {
    if (!el || !scrollTargetRef.current) return;
    const target = el.querySelector<HTMLElement>(`#${scrollTargetRef.current}`);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTargetRef.current = null;
  };

  // ── delete CV ──
  const handleDeleteCv = async () => {
    if (!window.confirm("Remove your CV from your profile?")) return;
    setDeletingCv(true);
    try {
      await api.delete("/users/cv");
      setDetail((d) => (d ? { ...d, cvUrl: undefined } : d));
      toast.success("CV removed");
    } catch {
      toast.error("Failed to remove CV");
    } finally {
      setDeletingCv(false);
    }
  };

  // ── loading / not found ──
  if (loading)
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-muted)]">Loading…</p>
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <p className="text-[var(--color-muted)]">User not found</p>
      </div>
    );

  const visibleCerts = isOwner ? certs : certs.filter((c) => c.isPublic);

  // map detail → form's initial data shape
  const detailForForm: Partial<ProfileDetailData> = detail
    ? {
        headline: detail.headline || "",
        summary: detail.summary || "",
        phone: detail.phone || "",
        location: detail.location || "",
        gender: detail.gender || "",
        dob: detail.dob ? detail.dob.slice(0, 10) : "",
        linkedinUrl: detail.linkedinUrl || "",
        githubUrl: detail.githubUrl || "",
        portfolioUrl: detail.portfolioUrl || "",
        extraCurricular: detail.extraCurricular || "",
        accomplishments: detail.accomplishments || "",
        education: (detail.education || []).map((e) => ({
          institution: e.institution,
          degree: e.degree || "",
          fieldOfStudy: e.fieldOfStudy || "",
          startYear: e.startYear?.toString() || "",
          endYear: e.endYear?.toString() || "",
          grade: e.grade || "",
          description: e.description || "",
        })),
        experience: (detail.experience || []).map((e) => ({
          company: e.company,
          title: e.title,
          employmentType: e.employmentType || "full_time",
          location: e.location || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          isCurrent: e.isCurrent,
          description: e.description || "",
        })),
        certifications: (detail.certifications || []).map((c) => ({
          name: c.name,
          issuer: c.issuer || "",
          issueDate: c.issueDate || "",
          expiryDate: "",
          credentialUrl: c.credentialUrl || "",
        })),
        projects: (detail.projects || []).map((p) => ({
          title: p.title,
          startDate: p.startDate || "",
          endDate: p.endDate || "",
          isOngoing: p.isOngoing,
          projectUrl: p.projectUrl || "",
          description: p.description || "",
        })),
        trainings: (detail.trainings || []).map((t) => ({
          program: t.program,
          organization: t.organization || "",
          location: t.location || "",
          isOnline: t.isOnline,
          startDate: t.startDate || "",
          endDate: t.endDate || "",
          isOngoing: t.isOngoing,
          description: t.description || "",
        })),
        portfolios: (detail.portfolios || []).map((p) => ({
          title: p.title,
          url: p.url,
        })),
      }
    : {};

  // shorthand so every section's edit button is one line
  const editBtn = (id: string) => (isOwner ? () => openSection(id) : undefined);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-0">
        {/* ── Header card ── */}
        <Card className="p-0 overflow-hidden rounded-b-none border-b-0">
          <div className="h-20 bg-gradient-to-r from-[var(--color-primary)] to-[color-mix(in_srgb,var(--color-primary)_70%,#6366f1)]" />
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
              {/* Avatar + name */}
              <div className="flex items-end gap-4">
                {isOwner ? (
                  <AvatarEditor
                    user={user}
                    onUpdated={(patch) =>
                      setUser((u) => (u ? { ...u, ...patch } : u))
                    }
                  />
                ) : user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[var(--color-surface)] shadow"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] border-4 border-[var(--color-surface)] shadow flex items-center justify-center">
                    <span className="text-4xl font-bold text-[var(--color-primary)]">
                      {user.name[0].toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="mb-1">
                  {isOwner ? (
                    <NameEditor
                      name={user.name}
                      onSaved={(name) =>
                        setUser((u) => (u ? { ...u, name } : u))
                      }
                    />
                  ) : (
                    <h1 className="text-2xl font-bold text-[var(--color-text)]">
                      {user.name}
                    </h1>
                  )}
                  {detail?.headline && (
                    <p className="text-sm font-medium text-[var(--color-primary)] mt-0.5">
                      {detail.headline}
                    </p>
                  )}
                  <p className="text-xs text-[var(--color-muted)] mt-0.5">
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 items-center">
                {isOwner && (
                  <button
                    onClick={() => setEditOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] text-sm rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                  >
                    {editOpen ? <X size={14} /> : <Edit2 size={14} />}
                    {editOpen ? "Close" : "Edit Resume"}
                  </button>
                )}

                {detail?.cvUrl && (
                  <div className="flex items-center gap-1">
                    <a
                      href={detail.cvUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)] text-sm rounded-xl hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors"
                    >
                      <Download size={14} /> View CV
                    </a>
                    {isOwner && (
                      <button
                        onClick={handleDeleteCv}
                        disabled={deletingCv}
                        title="Remove CV"
                        className="inline-flex items-center justify-center w-9 h-9 bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] rounded-xl hover:border-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deletingCv ? (
                          <svg
                            className="animate-spin w-3.5 h-3.5"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8v8z"
                            />
                          </svg>
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    )}
                  </div>
                )}

                <a
                  href={`mailto:${user.email || ""}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white text-sm rounded-xl hover:opacity-90 transition-opacity"
                >
                  <Mail size={14} /> Hire Me
                </a>
              </div>
            </div>

            {/* Contact meta row */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-[var(--color-muted)]">
              {user.email && (
                <span className="flex items-center gap-1">
                  <Mail size={11} /> {user.email}
                </span>
              )}
              {detail?.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={11} /> {detail.phone}
                </span>
              )}
              {detail?.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} /> {detail.location}
                </span>
              )}
              {detail?.linkedinUrl && (
                <a
                  href={detail.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                >
                  <LinkedInIcon size={11} /> LinkedIn
                </a>
              )}
              {detail?.githubUrl && (
                <a
                  href={detail.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                >
                  <GitBranch size={11} /> GitHub
                </a>
              )}
              {detail?.portfolioUrl && (
                <a
                  href={detail.portfolioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors"
                >
                  <Globe size={11} /> Portfolio
                </a>
              )}
            </div>
          </div>
        </Card>

        {/* ── Edit form (only for owner, only when open) ── */}
        {isOwner && editOpen && (
          <div
            ref={formWrapperRef}
            className="border-x border-[var(--color-border)]"
          >
            <ProfileDetailForm
              initial={detailForForm}
              onSaved={(saved) => {
                setDetail(saved as unknown as ProfileDetail);
                setEditOpen(false);
                // Re-fetch profile to get fresh data with all relations
                api.get(`/users/profile/${username}`).then((res) => {
                  const u = res.data.data.user;
                  setUser(u);
                  setDetail(u?.profileDetail || null);
                  setSkills(
                    (u?.skills || []).map((s: any) => ({
                      id: s.skill.id,
                      name: s.skill.name,
                      level: s.level,
                    })),
                  );
                });
              }}
            />
          </div>
        )}

        {/* ── Resume body ── */}
        <Card className="rounded-t-none px-6 py-6 space-y-7">
          {/* Career Objective */}
          <section>
            <SectionHead
              title="Career Objective"
              onEdit={editBtn("edit-summary")}
            />
            {detail?.summary ? (
              <p className="text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-wrap">
                {detail.summary}
              </p>
            ) : isOwner ? (
              <AddPrompt
                label="Add a career objective"
                onClick={() => openSection("edit-summary")}
              />
            ) : (
              <EmptyState text="No objective listed." />
            )}
          </section>

          {/* Education */}
          <section>
            <SectionHead
              icon={<GraduationCap size={14} />}
              title="Education"
              onEdit={editBtn("edit-education")}
            />
            {(detail?.education || []).length === 0 ? (
              isOwner ? (
                <AddPrompt
                  label="Add education"
                  onClick={() => openSection("edit-education")}
                />
              ) : (
                <EmptyState text="No education listed." />
              )
            ) : (
              <div className="space-y-3">
                {detail!.education.map((edu, i) => (
                  <ItemCard key={edu.id || i}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text)]">
                          {[edu.degree, edu.fieldOfStudy]
                            .filter(Boolean)
                            .join(", ") || edu.institution}
                        </p>
                        {(edu.degree || edu.fieldOfStudy) && (
                          <p className="text-sm text-[var(--color-muted)]">
                            {edu.institution}
                          </p>
                        )}
                        {edu.grade && (
                          <p className="text-xs text-[var(--color-muted)] mt-0.5">
                            CGPA / Grade: {edu.grade}
                          </p>
                        )}
                        {edu.description && (
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            {edu.description}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] shrink-0">
                        {fmtYear(edu.startYear, edu.endYear)}
                      </p>
                    </div>
                  </ItemCard>
                ))}
              </div>
            )}
          </section>

          {/* Work Experience */}
          <section>
            <SectionHead
              icon={<Briefcase size={14} />}
              title="Work Experience"
              onEdit={editBtn("edit-experience")}
            />
            {(detail?.experience || []).length === 0 ? (
              isOwner ? (
                <AddPrompt
                  label="Add work experience"
                  onClick={() => openSection("edit-experience")}
                />
              ) : (
                <EmptyState text="No experience listed." />
              )
            ) : (
              <div className="space-y-3">
                {detail!.experience.map((exp, i) => (
                  <ItemCard key={exp.id || i}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-[var(--color-text)]">
                            {exp.title}
                          </p>
                          {exp.employmentType && (
                            <Badge variant="default" className="text-xs">
                              {empLabel[exp.employmentType] ||
                                exp.employmentType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-muted)]">
                          {exp.company}
                          {exp.location ? ` · ${exp.location}` : ""}
                        </p>
                        {exp.description && (
                          <ul className="mt-2 space-y-1">
                            {exp.description
                              .split("\n")
                              .filter(Boolean)
                              .map((line, li) => (
                                <li
                                  key={li}
                                  className="text-xs text-[var(--color-muted)] flex gap-2"
                                >
                                  <span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--color-primary)] flex-shrink-0" />
                                  {line}
                                </li>
                              ))}
                          </ul>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] shrink-0">
                        {fmtMonth(exp.startDate, exp.endDate, exp.isCurrent)}
                      </p>
                    </div>
                  </ItemCard>
                ))}
              </div>
            )}
          </section>

          {/* Extra Curricular */}
          {(detail?.extraCurricular || isOwner) && (
            <section>
              <SectionHead
                icon={<Star size={14} />}
                title="Extra Curricular Activities"
                onEdit={editBtn("edit-extracurricular")}
              />
              {detail?.extraCurricular ? (
                <ItemCard>
                  <ul className="space-y-1">
                    {detail.extraCurricular
                      .split("\n")
                      .filter(Boolean)
                      .map((line, i) => (
                        <li
                          key={i}
                          className="text-sm text-[var(--color-text)] flex gap-2"
                        >
                          <span className="font-medium text-[var(--color-muted)] min-w-[1.2em]">
                            {i + 1}.
                          </span>
                          <span>{line.replace(/^\d+\.\s*/, "")}</span>
                        </li>
                      ))}
                  </ul>
                </ItemCard>
              ) : (
                <AddPrompt
                  label="Add extra curricular activities"
                  onClick={() => openSection("edit-extracurricular")}
                />
              )}
            </section>
          )}

          {/* Trainings / Courses */}
          <section>
            <SectionHead
              icon={<BookOpen size={14} />}
              title="Trainings / Courses"
              onEdit={editBtn("edit-trainings")}
            />
            {(detail?.trainings || []).length === 0 ? (
              isOwner ? (
                <AddPrompt
                  label="Add trainings / courses"
                  onClick={() => openSection("edit-trainings")}
                />
              ) : (
                <EmptyState text="No trainings listed." />
              )
            ) : (
              <div className="space-y-3">
                {detail!.trainings.map((tr, i) => (
                  <ItemCard key={tr.id || i}>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text)]">
                          {tr.program}
                        </p>
                        {tr.organization && (
                          <p className="text-sm text-[var(--color-muted)]">
                            {tr.organization}
                            {tr.isOnline
                              ? " · Online"
                              : tr.location
                                ? ` · ${tr.location}`
                                : ""}
                          </p>
                        )}
                        {tr.description && (
                          <p className="text-xs text-[var(--color-muted)] mt-1">
                            {tr.description}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] shrink-0">
                        {fmtMonth(tr.startDate, tr.endDate, tr.isOngoing)}
                      </p>
                    </div>
                  </ItemCard>
                ))}
              </div>
            )}
          </section>

          {/* Academics / Personal Projects */}
          <section>
            <SectionHead
              icon={<FolderOpen size={14} />}
              title="Academics / Personal Projects"
              onEdit={editBtn("edit-projects")}
            />
            {(detail?.projects || []).length === 0 ? (
              isOwner ? (
                <AddPrompt
                  label="Add a project"
                  onClick={() => openSection("edit-projects")}
                />
              ) : (
                <EmptyState text="No projects listed." />
              )
            ) : (
              <div className="space-y-3">
                {detail!.projects.map((proj, i) => (
                  <ItemCard key={proj.id || i}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--color-text)]">
                          {proj.title}
                        </p>
                        {proj.projectUrl && (
                          <a
                            href={proj.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[var(--color-primary)] flex items-center gap-1 hover:underline mt-0.5"
                          >
                            <ExternalLink size={10} /> {proj.projectUrl}
                          </a>
                        )}
                        {proj.description && (
                          <div className="mt-2 text-xs text-[var(--color-muted)] leading-relaxed whitespace-pre-wrap">
                            {proj.description}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted)] shrink-0">
                        {fmtMonth(proj.startDate, proj.endDate, proj.isOngoing)}
                      </p>
                    </div>
                  </ItemCard>
                ))}
              </div>
            )}
          </section>

          {/* Skills */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Layers size={14} className="text-[var(--color-primary)]" />
              <h2 className="text-xs font-bold text-[var(--color-muted)] tracking-widest uppercase">
                Skills
              </h2>
              <div className="flex-1 h-px bg-[var(--color-border)]" />
              {isOwner && (
                <Button
                  size="sm"
                  loading={savingSkills}
                  onClick={async () => {
                    setSavingSkills(true);
                    try {
                      await api.put("/users/skills", {
                        skills: skills.map((s) => ({
                          name: s.name,
                          level: s.level || undefined,
                        })),
                      });
                      toast.success("Skills updated");
                    } catch (err: any) {
                      toast.error(
                        err?.response?.data?.message || "Failed to save skills",
                      );
                    } finally {
                      setSavingSkills(false);
                    }
                  }}
                >
                  Save
                </Button>
              )}
            </div>
            {isOwner ? (
              <SkillsInput
                value={skills}
                onChange={setSkills}
                showLevel
                placeholder="Add a skill…"
              />
            ) : skills.length > 0 ? (
              <div className="border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                {skills.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between px-4 py-2.5"
                  >
                    <span className="text-sm text-[var(--color-text)]">
                      {s.name}
                    </span>
                    {s.level && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getLevelColor?.(s.level) ?? "bg-[var(--color-surface2)] text-[var(--color-muted)]"}`}
                      >
                        {s.level.charAt(0).toUpperCase() + s.level.slice(1)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No skills listed yet." />
            )}
          </section>

          {/* Portfolio / Work Samples */}
          {((detail?.portfolios || []).length > 0 || isOwner) && (
            <section>
              <SectionHead
                icon={<Link2 size={14} />}
                title="Portfolio / Work Samples"
                onEdit={editBtn("edit-portfolios")}
              />
              {(detail?.portfolios || []).length === 0 ? (
                <AddPrompt
                  label="Add portfolio links"
                  onClick={() => openSection("edit-portfolios")}
                />
              ) : (
                <div className="border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                  {detail!.portfolios.map((p, i) => (
                    <div
                      key={p.id || i}
                      className="flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-text)]">
                          {p.title}
                        </p>
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1"
                        >
                          <ExternalLink size={10} /> {p.url}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Certifications */}
          <section>
            <SectionHead
              icon={<BadgeCheck size={14} />}
              title="Certifications"
              onEdit={editBtn("edit-certifications")}
            />
            {(detail?.certifications || []).length === 0 ? (
              isOwner ? (
                <AddPrompt
                  label="Add a certification"
                  onClick={() => openSection("edit-certifications")}
                />
              ) : (
                <EmptyState text="None listed." />
              )
            ) : (
              <div className="border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                {detail!.certifications.map((c, i) => (
                  <div key={c.id || i} className="px-4 py-3">
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {c.name}
                    </p>
                    {c.issuer && (
                      <p className="text-xs text-[var(--color-muted)]">
                        {c.issuer}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {c.issueDate && (
                        <p className="text-xs text-[var(--color-muted)]">
                          {new Date(c.issueDate).toLocaleDateString("en-IN", {
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      )}
                      {c.credentialUrl && (
                        <a
                          href={c.credentialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 hover:underline"
                        >
                          <Link2 size={10} /> View
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Accomplishments */}
          {(detail?.accomplishments || isOwner) && (
            <section>
              <SectionHead
                icon={<Award size={14} />}
                title="Accomplishments / Additional Details"
                onEdit={editBtn("edit-accomplishments")}
              />
              {detail?.accomplishments ? (
                <div className="border border-[var(--color-border)] rounded-xl divide-y divide-[var(--color-border)]">
                  {detail.accomplishments
                    .split("\n")
                    .filter(Boolean)
                    .map((line, i) => (
                      <div
                        key={i}
                        className="px-4 py-3 text-sm text-[var(--color-text)]"
                      >
                        {line.replace(/^\d+\.\s*/, "")}
                      </div>
                    ))}
                </div>
              ) : (
                <AddPrompt
                  label="Add accomplishments"
                  onClick={() => openSection("edit-accomplishments")}
                />
              )}
            </section>
          )}

          {/* Platform Certificates */}
          <section>
            <SectionHead
              icon={<Award size={14} />}
              title="Platform Certificates"
            />
            {visibleCerts.length === 0 ? (
              <div className="text-center py-8 bg-[var(--color-surface)] border border-dashed border-[var(--color-border)] rounded-2xl">
                <Award
                  size={24}
                  className="text-[var(--color-muted)] mx-auto mb-2 opacity-40"
                />
                <p className="text-[var(--color-muted)] text-sm">
                  {isOwner
                    ? "No certificates yet — complete a domain to earn one."
                    : "No public certificates yet."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {visibleCerts.map((cert) => (
                  <CertificateCard key={cert.id} cert={cert} />
                ))}
              </div>
            )}
          </section>
        </Card>
      </div>
    </div>
  );
}