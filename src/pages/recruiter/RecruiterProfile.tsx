import { useEffect, useState } from "react";
import {
  Building2,
  Globe,
  CheckCircle,
  Clock,
  Briefcase,
  Mail,
  Edit2,
  ExternalLink,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import api from "@/services/api";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";

// Interface mein
interface Company {
  name: string;
  website: string | null;
  industry: string | null;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  logo: string | null; // logo → logo
}

// JSX mein

interface Posting {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  _count?: { applications: number };
}

interface RecruiterProfileData {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  company: Company | null;
  jobPostings: Posting[];
}

const VERIFICATION_CONFIG = {
  verified: {
    label: "Verified",
    color: "var(--color-success)",
    bg: "color-mix(in srgb, var(--color-success) 10%, transparent)",
  },
  pending: {
    label: "Pending",
    color: "var(--color-warning)",
    bg: "color-mix(in srgb, var(--color-warning) 10%, transparent)",
  },
  unverified: {
    label: "Unverified",
    color: "var(--color-muted)",
    bg: "var(--color-surface2)",
  },
  rejected: {
    label: "Rejected",
    color: "var(--color-danger)",
    bg: "color-mix(in srgb, var(--color-danger) 10%, transparent)",
  },
};

export default function RecruiterProfile() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<RecruiterProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/auth/recruiter/profile")
      .then(({ data }) => setProfile(data.data))
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{
            borderColor: "var(--color-primary)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  const company = profile?.company;
  const verif =
    VERIFICATION_CONFIG[company?.verificationStatus ?? "unverified"];
  const activePostings =
    profile?.jobPostings.filter((p) => p.status === "active") ?? [];
  const totalPostings = profile?.jobPostings.length ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* ── Header card ── */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shrink-0"
              style={{
                background:
                  "color-mix(in srgb, var(--color-primary) 15%, transparent)",
                color: "var(--color-primary)",
                border:
                  "2px solid color-mix(in srgb, var(--color-primary) 25%, transparent)",
              }}
            >
              {profile?.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                profile?.name?.[0]?.toUpperCase()
              )}
            </div>

            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {profile?.name}
              </h1>
              <div
                className="flex items-center gap-1.5 mt-0.5"
                style={{ color: "var(--color-muted)" }}
              >
                <Mail size={13} />
                <span className="text-sm">{profile?.email}</span>
              </div>
              <span
                className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-secondary) 10%, transparent)",
                  color: "var(--color-secondary)",
                }}
              >
                Recruiter
              </span>
            </div>
          </div>

          <Link to="/settings">
            <Button variant="ghost" size="sm">
              <Edit2 size={14} /> Edit
            </Button>
          </Link>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[var(--color-border)]">
          {[
            { label: "Total Postings", value: totalPostings },
            { label: "Active", value: activePostings.length },
            { label: "Company", value: company ? "✓" : "—" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {value}
              </p>
              <p
                className="text-xs mt-0.5"
                style={{ color: "var(--color-muted)" }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Company card ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-semibold text-base"
            style={{ color: "var(--color-text)" }}
          >
            Company
          </h2>
          <span
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: verif.bg, color: verif.color }}
          >
            {company?.verificationStatus === "verified" ? (
              <CheckCircle size={11} />
            ) : (
              <Clock size={11} />
            )}
            {verif.label}
          </span>
        </div>

        {company ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "var(--color-surface2)" }}
              >
                {company.logo ? (
                  <img
                    src={company.logo}
                    alt={company.name}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : (
                  <Building2
                    size={18}
                    style={{ color: "var(--color-muted)" }}
                  />
                )}
              </div>
              <div>
                <p
                  className="font-medium text-sm"
                  style={{ color: "var(--color-text)" }}
                >
                  {company.name}
                </p>
                {company.industry && (
                  <p
                    className="text-xs"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {company.industry}
                  </p>
                )}
              </div>
            </div>

            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm transition-colors hover:underline"
                style={{ color: "var(--color-primary)" }}
              >
                <Globe size={13} />
                {company.website.replace(/^https?:\/\//, "")}
                <ExternalLink size={11} />
              </a>
            )}

            {company.verificationStatus === "unverified" && (
              <Link to="/recruiter/company/verify">
                <Button size="sm" variant="ghost" className="mt-1">
                  Submit for verification →
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <Building2
              size={28}
              className="mx-auto mb-2"
              style={{ color: "var(--color-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              No company linked yet
            </p>
            <Link to="/recruiter/company/verify">
              <Button size="sm" className="mt-3">
                Add Company
              </Button>
            </Link>
          </div>
        )}
      </Card>

      {/* ── Recent postings ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="font-semibold text-base"
            style={{ color: "var(--color-text)" }}
          >
            Job Postings
          </h2>
          <Link to="/recruiter/postings">
            <Button size="sm" variant="ghost">
              View all →
            </Button>
          </Link>
        </div>

        {profile?.jobPostings.length === 0 ? (
          <div className="text-center py-6">
            <Briefcase
              size={28}
              className="mx-auto mb-2"
              style={{ color: "var(--color-muted)" }}
            />
            <p className="text-sm" style={{ color: "var(--color-muted)" }}>
              No postings yet
            </p>
            <Link to="/recruiter/postings/new">
              <Button size="sm" className="mt-3">
                Create Posting
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {profile?.jobPostings.slice(0, 5).map((posting) => (
              <Link
                key={posting.id}
                to={`/recruiter/postings/${posting.id}`}
                className="flex items-center justify-between p-3 rounded-xl transition-colors hover:bg-[var(--color-surface2)]"
              >
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    {posting.title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: "var(--color-muted)" }}
                  >
                    {new Date(posting.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {posting._count &&
                      ` · ${posting._count.applications} applicants`}
                  </p>
                </div>
                <span
                  className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background:
                      posting.status === "active"
                        ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                        : "var(--color-surface2)",
                    color:
                      posting.status === "active"
                        ? "var(--color-success)"
                        : "var(--color-muted)",
                  }}
                >
                  {posting.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
