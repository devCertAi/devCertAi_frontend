

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
import api from "@/services/api";
import toast from "react-hot-toast";
// Google login disabled — no VITE_GOOGLE_CLIENT_ID configured

export default function Register() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ?next=/apply/:slug → after registration, go to profile then back to apply
  const nextPath = searchParams.get("next") || null;

  // Google login disabled

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
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden">
              <img src="/assets/logo.svg" alt="Proeva" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text)]">
              Proeva
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
              {/* {" · "}
              <Link
                to="/auth/register-recruiter"
                className="text-[var(--color-primary)] hover:text-[var(--color-primary-d)] font-medium transition-colors"
              >
                Hire with Proeva
              </Link> */}
            </>
          )}
        </p>
      </motion.div>
    </div>
  );
}
