/**
 * Register.tsx — Updated to handle ?next= query param
 *
 * When a student clicks "Apply" on a job posting without being logged in,
 * they're sent here with ?next=/apply/:slug. After successful registration
 * they're redirected back to complete their profile (which then leads back
 * to the apply page).
 *
 * This page ONLY ever creates regular (developer/candidate) accounts.
 * Recruiter sign-up is a fully separate flow/page at /auth/register-recruiter
 * (OTP-based, backed by its own `Recruiter` table) — there is no role
 * switch here anymore.
 */

import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  Briefcase,
} from "lucide-react";
import { registerSchema, RegisterInput } from "@/lib/validators";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";
import api from "@/services/api";
import toast from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?next=/apply/:slug → after registration, go to profile then back to apply
  const nextPath = searchParams.get("next") || null;

  const { googleLogin } = useAuthStore();

  const handleGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await googleLogin(tokenResponse.access_token);
        const freshUser = useAuthStore.getState().user;
        toast.success("Account created! Welcome aboard.");

        // If they came from an apply link, send them to fill profile first
        if (nextPath) {
          const username = useAuthStore.getState().user?.username;
          navigate(
            `/profile/${username ?? "me"}?tab=edit&returnTo=${encodeURIComponent(nextPath)}`,
            { replace: true },
          );
        } else {
          const redirectAfterLogin =
            freshUser?.role === "recruiter"
              ? "/recruiter/dashboard"
              : "/dashboard";
          navigate(redirectAfterLogin, { replace: true });
        }
      } catch (err: any) {
        // NOTE: the axios interceptor only handles 401 (silent refresh) —
        // it does not show any error message for other statuses, so this
        // must surface its own toast or the failure is completely silent.
        const message = err?.response?.data?.message;
        toast.error(message || "Google sign up failed. Please try again.");
      }
    },
    onError: () => toast.error("Google sign up failed"),
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch("password", "");

  const getStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = getStrength(password);
  const strengthColors = [
    "",
    "var(--color-danger)",
    "var(--color-warning)",
    "var(--color-success)",
    "var(--color-success)",
  ];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      await api.post("/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      toast.success("Account created! Check your email to verify.");

      if (nextPath) {
        // Send them to login; after login they'll land on the apply page.
        // The apply page itself shows a profile-completeness gate if their
        // profile isn't filled out yet.
        navigate(`/auth/login?next=${encodeURIComponent(nextPath)}`, {
          replace: true,
        });
      } else {
        navigate("/auth/login", {
          state: { from: { pathname: "/dashboard" } },
        });
      }
    } catch (err: any) {
      // The axios interceptor in services/api.ts only intercepts 401s (silent
      // refresh) — every other status, including this 409 for a duplicate
      // email, passes straight through. Without this catch it becomes an
      // unhandled promise rejection and the person sees nothing at all.
      const status = err?.response?.status;
      const message = err?.response?.data?.message;
      if (status === 409) {
        toast.error(
          message || "An account with this email already exists. Try logging in instead.",
        );
      } else {
        toast.error(message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isApplyFlow = !!nextPath && nextPath.startsWith("/apply/");

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 w-80 h-80 bg-[color-mix(in_srgb,var(--color-secondary)_6%,transparent)] rounded-full blur-3xl" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary)] flex items-center justify-center">
              <span className="text-[var(--color-inverse)] font-bold">DC</span>
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">
              DevCert
            </span>
          </Link>

          {isApplyFlow ? (
            <>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-3 text-xs font-medium"
                style={{
                  background:
                    "color-mix(in srgb, var(--color-primary) 10%, transparent)",
                  color: "var(--color-primary)",
                }}
              >
                <Briefcase size={12} /> Applying for a position
              </div>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Create your account
              </h1>
              <p className="text-[var(--color-muted)] mt-1 text-sm">
                Register, complete your profile, then finish applying
              </p>
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-[var(--color-muted)]">
                {["Register", "Complete profile", "Apply"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${i === 0 ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-border)] text-[var(--color-muted)]"}`}
                    >
                      {i + 1}
                    </span>
                    <span
                      className={
                        i === 0 ? "text-[var(--color-text)] font-medium" : ""
                      }
                    >
                      {step}
                    </span>
                    {i < 2 && <ArrowRight size={10} />}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-[var(--color-text)]">
                Create your account
              </h1>
              <p className="text-[var(--color-muted)] mt-1 text-sm">
                Start getting AI-certified today
              </p>
            </>
          )}
        </div>

        <Card className="p-6">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {" "}
            <Input
              label="Full Name"
              placeholder="John Doe"
              leftIcon={<User size={15} />}
              error={errors.name?.message}
              {...register("name")}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={15} />}
              error={errors.email?.message}
              {...register("email")}
            />
            <div>
              <Input
                label="Password"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                leftIcon={<Lock size={15} />}
                rightIcon={
                  <button type="button" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                error={errors.password?.message}
                {...register("password")}
              />
              {password && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            i <= strength
                              ? strengthColors[strength]
                              : "var(--color-surface2)",
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-xs"
                    style={{ color: strengthColors[strength] }}
                  >
                    {strengthLabels[strength]}
                  </span>
                </div>
              )}
            </div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              {isApplyFlow ? "Create Account & Continue" : "Create Account"}
            </Button>
          </form>

          <div className="mt-4 relative flex items-center">
            <div className="flex-1 border-t border-[var(--color-border)]" />
            <span className="mx-3 text-xs text-[var(--color-muted)]">or</span>
            <div className="flex-1 border-t border-[var(--color-border)]" />
          </div>

          <button
            type="button"
            onClick={() => handleGoogle()}
            className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl text-sm text-[var(--color-text)] hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </Card>

        <p className="text-center text-sm text-[var(--color-muted)] mt-6">
          Already have an account?{" "}
          <Link
            to={
              nextPath
                ? `/auth/login?next=${encodeURIComponent(nextPath)}`
                : "/auth/login"
            }
            className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
          >
            Sign in
          </Link>
          {!isApplyFlow && (
            <>
              {" · "}
              <Link
                to="/auth/register-recruiter"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
              >
                Hire with DevCert
              </Link>
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
